import axios, { type AxiosInstance } from 'axios';
import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type TicketingUser } from '@org/common';
import { SignInDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';
import { ENV_KEYS } from '../config/env.keys';

type AuthResponse = {
  user: TicketingUser;
  token: string;
};

@Injectable()
export class AuthClient {
  private readonly httpClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.httpClient = axios.create({
      baseURL: this.configService.getOrThrow<string>(ENV_KEYS.AUTH_SERVICE),
    });
  }

  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    try {
      const { data } = await this.httpClient.post<AuthResponse>(
        '/auth/signup',
        signUpDto
      );

      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponse> {
    try {
      const { data } = await this.httpClient.post<AuthResponse>(
        '/auth/signin',
        signInDto
      );

      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }

      throw new ServiceUnavailableException('Auth service unavailable');
    }

    throw error;
  }
}
