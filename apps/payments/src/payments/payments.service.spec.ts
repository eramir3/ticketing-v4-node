import { OrderStatus, type TicketingUser } from '@org/common';
import {
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
} from '@org/errors';
import { OrdersService } from '../orders/orders.service';
import { TicketingEventsService } from '../events/ticketing-events.service';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { PaymentsService } from './payments.service';

const buildUser = (overrides: Partial<TicketingUser> = {}): TicketingUser => ({
  id: 'user-123',
  email: 'user@test.com',
  ...overrides,
});

describe('PaymentsService', () => {
  it('creates a payment and publishes the event', async () => {
    const payment = {
      id: 'payment-123',
      version: 0,
      orderId: '507f1f77bcf86cd799439011',
    };
    const paymentModel = {
      create: jest.fn().mockResolvedValue(payment),
    };
    const ordersService = {
      findById: jest.fn().mockResolvedValue({
        id: payment.orderId,
        userId: 'user-123',
        status: OrderStatus.Created,
      }),
    } as unknown as OrdersService;
    const ticketingEventsService = {
      ensureStream: jest.fn().mockResolvedValue(undefined),
    } as unknown as TicketingEventsService;
    const paymentCreatedPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as unknown as PaymentCreatedPublisher;
    const service = new PaymentsService(
      paymentModel as never,
      ordersService,
      ticketingEventsService,
      paymentCreatedPublisher
    );

    const result = await service.create(
      { orderId: payment.orderId },
      buildUser()
    );

    expect(paymentModel.create).toHaveBeenCalledWith({ orderId: payment.orderId });
    expect(ticketingEventsService.ensureStream).toHaveBeenCalledTimes(1);
    expect(paymentCreatedPublisher.publish).toHaveBeenCalledWith({
      id: 'payment-123',
      version: 0,
      orderId: payment.orderId,
    });
    expect(result).toBe(payment);
  });

  it('throws when the order does not exist', async () => {
    const service = new PaymentsService(
      { create: jest.fn() } as never,
      {
        findById: jest.fn().mockResolvedValue(null),
      } as unknown as OrdersService
    );

    await expect(
      service.create(
        { orderId: '507f1f77bcf86cd799439011' },
        buildUser()
      )
    ).rejects.toThrow(NotFoundError);
  });

  it('throws when the order belongs to another user', async () => {
    const service = new PaymentsService(
      { create: jest.fn() } as never,
      {
        findById: jest.fn().mockResolvedValue({
          id: 'order-123',
          userId: 'user-999',
          status: OrderStatus.Created,
        }),
      } as unknown as OrdersService
    );

    await expect(
      service.create(
        { orderId: '507f1f77bcf86cd799439011' },
        buildUser()
      )
    ).rejects.toThrow(NotAuthorizedError);
  });

  it('throws when the order is cancelled', async () => {
    const service = new PaymentsService(
      { create: jest.fn() } as never,
      {
        findById: jest.fn().mockResolvedValue({
          id: 'order-123',
          userId: 'user-123',
          status: OrderStatus.Cancelled,
        }),
      } as unknown as OrdersService
    );

    await expect(
      service.create(
        { orderId: '507f1f77bcf86cd799439011' },
        buildUser()
      )
    ).rejects.toThrow(BadRequestError);
  });
});
