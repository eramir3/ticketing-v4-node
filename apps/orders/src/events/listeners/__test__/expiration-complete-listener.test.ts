import { ExpirationCompleteEvent } from '@org/transport';
import { type JetStreamClient, type JsMsg } from 'nats';
import { OrdersService } from '../../../orders/orders.service';
import { TicketingEventsService } from '../../ticketing-events.service';
import { ExpirationCompleteListener } from '../expiration-complete-listener';

const buildData = (): ExpirationCompleteEvent['data'] => ({
  orderId: 'order-123',
});

const buildMessage = () =>
  ({
    ack: jest.fn(),
  }) as unknown as JsMsg;

const buildListener = () => {
  const expire = jest.fn().mockResolvedValue(undefined);
  const ordersService = {
    expire,
  } as unknown as OrdersService;
  const ticketingEventsService = {
    ensureStream: jest.fn(),
  } as unknown as TicketingEventsService;

  const listener = new ExpirationCompleteListener(
    {} as JetStreamClient,
    ordersService,
    ticketingEventsService
  );

  return { listener, expire };
};

describe('ExpirationCompleteListener', () => {
  it('expires the order', async () => {
    const { listener, expire } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(expire).toHaveBeenCalledWith(data);
  });

  it('acks the message', async () => {
    const { listener } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalledTimes(1);
  });

  it('does not ack if expiring the order fails', async () => {
    const { listener, expire } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    expire.mockRejectedValueOnce(new Error('expire failed'));

    await expect(listener.onMessage(data, msg)).rejects.toThrow('expire failed');
    expect(msg.ack).not.toHaveBeenCalled();
  });
});
