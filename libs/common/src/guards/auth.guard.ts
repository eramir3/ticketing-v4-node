import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { getJwtFromContext, setCurrentUserOnContext } from '../contexts/auth-context';
import type { TicketingUser } from '../types/user.type';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const token = getJwtFromContext(context);

    if (!token) {
      throw new UnauthorizedException('Not authorized');
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_KEY!);
      if (typeof payload !== 'object' || payload === null) {
        throw new UnauthorizedException('Not authorized');
      }

      setCurrentUserOnContext(context, payload as TicketingUser);
      return true;
    } catch {
      throw new UnauthorizedException('Not authorized');
    }
  }
}
