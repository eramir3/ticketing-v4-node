import { OrdersService } from './orders.service';
import { OrderStatus } from '@org/common';

describe('OrdersService', () => {
  it('treats missing orders as already handled during expiration', async () => {
    const populate = jest.fn().mockResolvedValue(null);
    const orderModel = {
      findById: jest.fn().mockReturnValue({ populate }),
    };
    const ticketingEventsService = {
      ensureStream: jest.fn(),
    };
    const orderCancelledPublisher = {
      publish: jest.fn(),
    };

    const service = new OrdersService(
      orderModel as never,
      {} as never,
      ticketingEventsService as never,
      undefined,
      orderCancelledPublisher as never
    );

    await expect(
      service.expire({ orderId: 'missing-order-id' })
    ).resolves.toBeUndefined();
    expect(orderModel.findById).toHaveBeenCalledWith('missing-order-id');
    expect(populate).toHaveBeenCalledWith('ticket');
    expect(ticketingEventsService.ensureStream).not.toHaveBeenCalled();
    expect(orderCancelledPublisher.publish).not.toHaveBeenCalled();
  });

  it('marks an order as complete when a payment is created', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const set = jest.fn();
    const orderModel = {
      findById: jest.fn().mockResolvedValue({ set, save }),
    };

    const service = new OrdersService(orderModel as never, {} as never);

    await service.paymentCreated({
      id: 'payment-123',
      version: 0,
      orderId: 'order-123',
    });

    expect(orderModel.findById).toHaveBeenCalledWith('order-123');
    expect(set).toHaveBeenCalledWith({
      status: OrderStatus.Complete,
    });
    expect(save).toHaveBeenCalledTimes(1);
  });
});
