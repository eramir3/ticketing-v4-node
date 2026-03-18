import { OrderStatus } from '@org/common';
import { OrderCreatedEvent } from '@org/transport';
import { type JetStreamClient, type JsMsg } from 'nats';
import { TicketsService } from '../../../tickets/tickets.service';
import { TicketingEventsService } from '../../ticketing-events.service';
import { OrderCreatedListener } from '../order-created-listener';

const buildData = (): OrderCreatedEvent['data'] => ({
  id: 'order-123',
  version: 0,
  status: OrderStatus.Created,
  userId: 'user-123',
  expiresAt: new Date().toISOString(),
  ticket: {
    id: 'ticket-123',
    price: 20,
  },
});

const buildMessage = () =>
  ({
    ack: jest.fn(),
  }) as unknown as JsMsg;

const buildListener = () => {
  const reserve = jest.fn().mockResolvedValue(undefined);
  const ticketsService = {
    reserve,
  } as unknown as TicketsService;
  const ticketingEventsService = {
    ensureStream: jest.fn(),
  } as unknown as TicketingEventsService;

  const listener = new OrderCreatedListener(
    {} as JetStreamClient,
    ticketsService,
    ticketingEventsService
  );

  return { listener, reserve };
};

describe('OrderCreatedListener', () => {
  it('reserves the ticket and acknowledges the message', async () => {
    const { listener, reserve } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(reserve).toHaveBeenCalledWith(data.ticket.id, data.id);
    expect(msg.ack).toHaveBeenCalledTimes(1);
  });

  it('does not acknowledge the message when reserving the ticket fails', async () => {
    const { listener, reserve } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    reserve.mockRejectedValueOnce(new Error('reserve failed'));

    await expect(listener.onMessage(data, msg)).rejects.toThrow('reserve failed');
    expect(msg.ack).not.toHaveBeenCalled();
  });
});
