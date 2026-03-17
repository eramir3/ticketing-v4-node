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
import { CreateOrderInput } from './dto/create-order.input';
import { Order } from './entities/order.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

type OrderApiResponse = Omit<Order, 'ticket'> & {
  _id?: string;
  ticket?: Ticket | string;
};

@Injectable()
export class OrdersClient {
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {
    this.httpClient = axios.create({
      baseURL: this.configService.getOrThrow<string>(ENV_KEYS.ORDERS_SERVICE),
    });
  }

  async create(createOrderDto: CreateOrderInput, user: TicketingUser): Promise<Order> {
    try {
      const { data } = await this.httpClient.post<OrderApiResponse>(
        '/orders',
        createOrderDto,
        { headers: buildAuthHeaders(this.jwtService, user) }
      );

      return this.normalizeOrder(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  async findAll(user: TicketingUser): Promise<Order[]> {
    try {
      const { data } = await this.httpClient.get<OrderApiResponse[]>('/orders', {
        headers: buildAuthHeaders(this.jwtService, user),
      });

      return data.map((order) => this.normalizeOrder(order));
    } catch (error) {
      this.handleError(error);
    }
  }

  async findOne(id: string, user: TicketingUser): Promise<Order> {
    try {
      const { data } = await this.httpClient.get<OrderApiResponse>(`/orders/${id}`, {
        headers: buildAuthHeaders(this.jwtService, user),
      });

      return this.normalizeOrder(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  async cancel(id: string, user: TicketingUser): Promise<Order> {
    try {
      const { data } = await this.httpClient.patch<OrderApiResponse>(
        `/orders/${id}`,
        undefined,
        { headers: buildAuthHeaders(this.jwtService, user) }
      );

      return this.normalizeOrder(data);
    } catch (error) {
      this.handleError(error);
    }
  }

  private normalizeOrder(order: OrderApiResponse): Order {
    return {
      ...order,
      ticket: typeof order.ticket === 'string'
        ? { id: order.ticket }
        : order.ticket,
    };
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }

      throw new ServiceUnavailableException('Orders service unavailable');
    }

    throw error;
  }
}
