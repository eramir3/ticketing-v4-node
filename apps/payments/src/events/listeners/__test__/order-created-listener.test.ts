import { OrderStatus } from '@org/common';
import { OrderCreatedEvent } from '@org/transport';
import { type JetStreamClient, type JsMsg } from 'nats';
import { OrdersService } from '../../../orders/orders.service';
import { TicketingEventsService } from '../../ticketing-events.service';
import { OrderCreatedListener } from '../order-created-listener';

const buildData = (): OrderCreatedEvent['data'] => ({
  id: '507f1f77bcf86cd799439011',
  version: 0,
  expiresAt: new Date().toISOString(),
  userId: 'user-123',
  status: OrderStatus.Created,
  ticket: {
    id: 'ticket-123',
    price: 10,
  },
});

const buildMessage = () =>
  ({
    ack: jest.fn(),
  }) as unknown as JsMsg;

const buildListener = () => {
  const create = jest.fn().mockResolvedValue(undefined);
  const ordersService = {
    create,
  } as unknown as OrdersService;
  const ticketingEventsService = {
    ensureStream: jest.fn(),
  } as unknown as TicketingEventsService;

  const listener = new OrderCreatedListener(
    {} as JetStreamClient,
    ordersService,
    ticketingEventsService
  );

  return { listener, create };
};

describe('OrderCreatedListener', () => {
  it('creates the order projection', async () => {
    const { listener, create } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(create).toHaveBeenCalledWith(data);
  });

  it('acks the message', async () => {
    const { listener } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalledTimes(1);
  });

  it('does not ack if creating the projection fails', async () => {
    const { listener, create } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    create.mockRejectedValueOnce(new Error('create failed'));

    await expect(listener.onMessage(data, msg)).rejects.toThrow('create failed');
    expect(msg.ack).not.toHaveBeenCalled();
  });
});
