import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OrderStatus, type TicketingUser } from '@org/common';
import { OrdersClient } from './orders.client';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    isAxiosError: jest.fn(),
  },
}));

describe('OrdersClient', () => {
  const httpClient = {
    post: jest.fn(),
  };

  const configService = {
    getOrThrow: jest.fn().mockReturnValue('http://orders-service'),
  } as unknown as ConfigService;

  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-jwt'),
  } as unknown as JwtService;

  const user: TicketingUser = {
    id: 'user-id',
    email: 'user@test.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (axios.create as jest.Mock).mockReturnValue(httpClient);
  });

  it('converts expiresAt strings into Date instances', async () => {
    const expiresAt = '2026-03-20T13:32:24.265Z';
    httpClient.post.mockResolvedValue({
      data: {
        id: 'order-id',
        status: OrderStatus.Created,
        expiresAt,
        userId: user.id,
        ticket: 'ticket-id',
      },
    });

    const client = new OrdersClient(configService, jwtService);
    const order = await client.create({ ticketId: 'ticket-id' }, user);

    expect(order.expiresAt).toBeInstanceOf(Date);
    expect(order.expiresAt?.toISOString()).toBe(expiresAt);
    expect(order.ticket).toEqual({ id: 'ticket-id' });
  });
});
