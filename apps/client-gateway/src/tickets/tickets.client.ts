import axios, { type AxiosInstance } from 'axios';
import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '../config/env.keys';
import { CreateTicketInput } from './dto/create-ticket.input';
import { UpdateTicketInput } from './dto/update-ticket.input';
import { Ticket } from './entities/ticket.entity';

type CreateTicketRequest = CreateTicketInput & {
  userId: string;
};

type TicketApiResponse = Ticket & {
  _id?: string;
};

type UpdateTicketRequest = UpdateTicketInput & {
  userId: string;
};

@Injectable()
export class TicketsClient {
  private readonly httpClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.httpClient = axios.create({
      baseURL: this.configService.getOrThrow<string>(ENV_KEYS.TICKETS_SERVICE),
    });
  }

  async create(createTicketDto: CreateTicketRequest): Promise<Ticket> {
    try {
      const { data } = await this.httpClient.post<TicketApiResponse>(
        '/tickets',
        createTicketDto
      );
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAll(): Promise<Ticket[]> {
    try {
      const { data } = await this.httpClient.get<TicketApiResponse[]>('/tickets');
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOne(id: string): Promise<Ticket> {
    try {
      const { data } = await this.httpClient.get<TicketApiResponse>(`/tickets/${id}`);
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, updateTicketDto: UpdateTicketRequest): Promise<Ticket> {
    try {
      const { data } = await this.httpClient.patch<TicketApiResponse>(
        `/tickets/${id}`,
        updateTicketDto
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

      throw new ServiceUnavailableException('Tickets service unavailable');
    }

    throw error;
  }
}
