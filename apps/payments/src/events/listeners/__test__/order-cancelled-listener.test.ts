import { OrderCancelledEvent } from '@org/transport';
import { type JetStreamClient, type JsMsg } from 'nats';
import { OrdersService } from '../../../orders/orders.service';
import { TicketingEventsService } from '../../ticketing-events.service';
import { OrderCancelledListener } from '../order-cancelled-listener';

const buildData = (): OrderCancelledEvent['data'] => ({
  id: '507f1f77bcf86cd799439011',
  version: 1,
  ticket: {
    id: 'ticket-123',
  },
});

const buildMessage = () =>
  ({
    ack: jest.fn(),
  }) as unknown as JsMsg;

const buildListener = () => {
  const cancel = jest.fn().mockResolvedValue(undefined);
  const ordersService = {
    cancel,
  } as unknown as OrdersService;
  const ticketingEventsService = {
    ensureStream: jest.fn(),
  } as unknown as TicketingEventsService;

  const listener = new OrderCancelledListener(
    {} as JetStreamClient,
    ordersService,
    ticketingEventsService
  );

  return { listener, cancel };
};

describe('OrderCancelledListener', () => {
  it('cancels the projected order', async () => {
    const { listener, cancel } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(cancel).toHaveBeenCalledWith(data);
  });

  it('acks the message', async () => {
    const { listener } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalledTimes(1);
  });

  it('does not ack if cancelling the projection fails', async () => {
    const { listener, cancel } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    cancel.mockRejectedValueOnce(new Error('cancel failed'));

    await expect(listener.onMessage(data, msg)).rejects.toThrow('cancel failed');
    expect(msg.ack).not.toHaveBeenCalled();
  });
});
