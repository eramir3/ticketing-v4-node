import axios, { type AxiosInstance } from 'axios';
import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  buildAuthHeaders,
  type TicketingUser,
} from '@org/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ENV_KEYS } from '../config/env.keys';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './entities/payment.entity';

type PaymentApiResponse = Payment & {
  _id?: string;
};

@Injectable()
export class PaymentsClient {
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {
    this.httpClient = axios.create({
      baseURL: this.configService.getOrThrow<string>(ENV_KEYS.PAYMENTS_SERVICE),
    });
  }

  async create(createPaymentDto: CreatePaymentDto, user: TicketingUser): Promise<Payment> {
    try {
      const { data } = await this.httpClient.post<PaymentApiResponse>(
        '/payments',
        createPaymentDto,
        { headers: buildAuthHeaders(this.jwtService, user) }
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

      throw new ServiceUnavailableException('Payments service unavailable');
    }

    throw error;
  }
}
