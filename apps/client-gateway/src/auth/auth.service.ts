import { type Request } from 'express';
import { Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { AuthClient } from './auth.client';

// req.session.jwt is the storage mechanism; req.jwt is the backend-facing API. 

type GatewayRequest = Request & {
  jwt?: string;
  session?: { jwt?: string } | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authClient: AuthClient,
  ) { }

  async signUp(dto: SignUpDto, req: GatewayRequest) {
    const response = await this.authClient.signUp(dto);
    const user = response.user
    const userJwt = response.token
    req.session = {
      jwt: userJwt
    };
    req.jwt = userJwt;
    return user
  }

  async signIn(dto: SignInDto, req: GatewayRequest) {
    const response = await this.authClient.signIn(dto);
    const user = response.user
    const userJwt = response.token
    req.session = {
      jwt: userJwt
    };
    req.jwt = userJwt;
    return user
  }

  async signOut(req: GatewayRequest) {
    if (req.session) {
      req.session = null;
    }
    req.jwt = undefined;
    return {}
  }
}
