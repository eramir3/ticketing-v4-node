import { TicketCreatedEvent } from '@org/transport';
import { type JetStreamClient, type JsMsg } from 'nats';
import { TicketsService } from '../../../tickets/tickets.service';
import { TicketingEventsService } from '../../ticketing-events.service';
import { TicketCreatedListener } from '../ticket-created-listener';

const buildData = (): TicketCreatedEvent['data'] => ({
  id: '507f1f77bcf86cd799439011',
  version: 0,
  title: 'concert',
  price: 10,
  userId: 'user-123',
});

const buildMessage = () =>
  ({
    ack: jest.fn(),
  }) as unknown as JsMsg;

const buildListener = () => {
  const create = jest.fn().mockResolvedValue(undefined);
  const ticketsService = {
    create,
  } as unknown as TicketsService;
  const ticketingEventsService = {
    ensureStream: jest.fn(),
  } as unknown as TicketingEventsService;

  const listener = new TicketCreatedListener(
    {} as JetStreamClient,
    ticketsService,
    ticketingEventsService
  );

  return { listener, create };
};

describe('TicketCreatedListener', () => {
  it('creates a ticket', async () => {
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

  it('does not ack if ticket creation fails', async () => {
    const { listener, create } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    create.mockRejectedValueOnce(new Error('create failed'));

    await expect(listener.onMessage(data, msg)).rejects.toThrow('create failed');
    expect(msg.ack).not.toHaveBeenCalled();
  });
});
