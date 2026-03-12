import { type Request } from 'express';
import { Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { AuthClient } from './auth.client';

// req.session.jwt is the storage mechanism; req.jwt is the backend-facing API.

@Injectable()
export class AuthService {
  constructor(
    private readonly authClient: AuthClient,
  ) { }

  async signUp(dto: SignUpDto, req: Request) {
    const response = await this.authClient.signUp(dto);
    const user = response.user
    const userJwt = response.token
    req.session = {
      jwt: userJwt
    };
    req.jwt = userJwt;
    return user
  }

  async signIn(dto: SignInDto, req: Request) {
    const response = await this.authClient.signIn(dto);
    const user = response.user
    const userJwt = response.token
    req.session = {
      jwt: userJwt
    };
    req.jwt = userJwt;
    return user
  }

  async signOut(req: Request) {
    if (req.session) {
      req.session = null;
    }
    req.jwt = undefined;
    return {}
  }
}
