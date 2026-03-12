import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  AuthResultData,
  AuthMessages,
  SignInPayload,
  SignUpPayload,
} from '@org/contracts';
import { MESSAGING_TOKENS } from '@org/transport';
import { firstValueFrom } from 'rxjs';
import { SignInDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';

@Injectable()
export class AuthClient {
  constructor(
    @Inject(MESSAGING_TOKENS.NATS_CLIENT)
    private readonly client: ClientProxy,
  ) { }

  signUp(signUpDto: SignUpDto) {
    return this.send<AuthResultData, SignUpPayload>(AuthMessages.UserSignUp, {
      email: signUpDto.email,
      password: signUpDto.password,
    });
  }

  signIn(signInDto: SignInDto) {
    return this.send<AuthResultData, SignInPayload>(AuthMessages.UserSignIn, {
      email: signInDto.email,
      password: signInDto.password,
    });
  }

  private async send<TResponse, TData>(
    subject: AuthMessages,
    data: TData,
  ): Promise<TResponse> {
    return firstValueFrom(this.client.send<TResponse, TData>(subject, data));
  }
}
