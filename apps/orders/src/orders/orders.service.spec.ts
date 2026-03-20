import { OrdersService } from './orders.service';

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
});
