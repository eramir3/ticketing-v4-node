import { NotFoundError } from '@org/errors';
import { TicketUpdatedEvent } from '@org/transport';
import { type JetStreamClient, type JsMsg } from 'nats';
import { TicketsService } from '../../../tickets/tickets.service';
import { TicketingEventsService } from '../../ticketing-events.service';
import { TicketUpdatedListener } from '../ticket-updated-listener';

const buildData = (): TicketUpdatedEvent['data'] => ({
  id: '507f1f77bcf86cd799439011',
  version: 1,
  title: 'new concert',
  price: 999,
  userId: 'user-123',
});

const buildMessage = () =>
  ({
    ack: jest.fn(),
  }) as unknown as JsMsg;

const buildListener = () => {
  const update = jest.fn().mockResolvedValue(undefined);
  const ticketsService = {
    update,
  } as unknown as TicketsService;
  const ticketingEventsService = {
    ensureStream: jest.fn(),
  } as unknown as TicketingEventsService;

  const listener = new TicketUpdatedListener(
    {} as JetStreamClient,
    ticketsService,
    ticketingEventsService
  );

  return { listener, update };
};

describe('TicketUpdatedListener', () => {
  it('updates a ticket', async () => {
    const { listener, update } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(update).toHaveBeenCalledWith(data);
  });

  it('acks the message', async () => {
    const { listener } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalledTimes(1);
  });

  it('does not call ack if the event has a skipped version number', async () => {
    const { listener, update } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    update.mockRejectedValueOnce(new NotFoundError());

    await expect(listener.onMessage(data, msg)).rejects.toThrow();
    expect(msg.ack).not.toHaveBeenCalled();
  });
});
