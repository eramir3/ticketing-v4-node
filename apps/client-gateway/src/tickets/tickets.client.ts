import axios, { type AxiosInstance } from 'axios';
import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  buildRequestHeaders,
  buildAuthHeaders,
  type TicketingUser,
} from '@org/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ENV_KEYS } from '../config/env.keys';
import { CreateTicketInput } from './dto/create-ticket.input';
import { UpdateTicketInput } from './dto/update-ticket.input';
import { Ticket } from './entities/ticket.entity';

type TicketApiResponse = Ticket & {
  _id?: string;
};

@Injectable()
export class TicketsClient {
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {
    this.httpClient = axios.create({
      baseURL: this.configService.getOrThrow<string>(ENV_KEYS.TICKETS_SERVICE),
    });
  }

  async create(createTicketDto: CreateTicketInput, user: TicketingUser): Promise<Ticket> {
    try {
      const { data } = await this.httpClient.post<TicketApiResponse>(
        '/tickets',
        createTicketDto,
        { headers: buildAuthHeaders(this.jwtService, user) }
      );
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAll(): Promise<Ticket[]> {
    try {
      const { data } = await this.httpClient.get<TicketApiResponse[]>('/tickets', {
        headers: buildRequestHeaders(),
      });
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOne(id: string): Promise<Ticket> {
    try {
      const { data } = await this.httpClient.get<TicketApiResponse>(`/tickets/${id}`, {
        headers: buildRequestHeaders(),
      });
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, updateTicketDto: UpdateTicketInput, user: TicketingUser): Promise<Ticket> {
    try {
      const { id: _id, ...body } = updateTicketDto;
      const { data } = await this.httpClient.patch<TicketApiResponse>(
        `/tickets/${id}`,
        body,
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

      throw new ServiceUnavailableException('Tickets service unavailable');
    }

    throw error;
  }
}
