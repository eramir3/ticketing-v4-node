import { Injectable, NestMiddleware } from '@nestjs/common';
import cookieSession from 'cookie-session';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CookieSessionMiddleware implements NestMiddleware {
  private readonly isProduction = process.env.NODE_ENV === 'production';
  private readonly sessionCookieName = 'session';

  private readonly cookiePattern = new RegExp(
    `(^|;\\s*)${this.sessionCookieName}=([^;]+)`
  );

  private readonly middleware = cookieSession({
    name: this.sessionCookieName,
    //keys: [process.env.COOKIE_KEY!],
    signed: false, //!
    secure: this.isProduction,
    httpOnly: true,
    sameSite: this.isProduction ? 'none' : 'lax',
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.normalizeEncodedSessionCookie(req);
    this.middleware(req, res, (error?: unknown) => {
      if (error) {
        next(error as Error);
        return;
      }

      this.forwardJwtToRequest(req);
      next();
    });
  }

  private normalizeEncodedSessionCookie(req: Request) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return;

    req.headers.cookie = cookieHeader.replace(
      this.cookiePattern,
      (full, prefix: string, value: string) => {
        if (!value.includes('%')) return full;

        try {
          return `${prefix}${this.sessionCookieName}=${decodeURIComponent(value)}`;
        } catch {
          return full;
        }
      },
    );
  }

  private forwardJwtToRequest(req: Request) {
    req.jwt = typeof req.session?.jwt === 'string' ? req.session.jwt : undefined;
  }
}
