import { OrderCancelledEvent } from '@org/transport';
import { type JetStreamClient, type JsMsg } from 'nats';
import { TicketsService } from '../../../tickets/tickets.service';
import { TicketingEventsService } from '../../ticketing-events.service';
import { OrderCancelledListener } from '../order-cancelled-listener';

const buildData = (): OrderCancelledEvent['data'] => ({
  id: 'order-123',
  version: 0,
  ticket: {
    id: 'ticket-123',
  },
});

const buildMessage = () =>
  ({
    ack: jest.fn(),
  }) as unknown as JsMsg;

const buildListener = () => {
  const clearReservation = jest.fn().mockResolvedValue(undefined);
  const ticketsService = {
    clearReservation,
  } as unknown as TicketsService;
  const ticketingEventsService = {
    ensureStream: jest.fn(),
  } as unknown as TicketingEventsService;

  const listener = new OrderCancelledListener(
    {} as JetStreamClient,
    ticketsService,
    ticketingEventsService
  );

  return { listener, clearReservation };
};

describe('OrderCancelledListener', () => {
  it('clears the reservation and acknowledges the message', async () => {
    const { listener, clearReservation } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(clearReservation).toHaveBeenCalledWith(data.ticket.id, data.id);
    expect(msg.ack).toHaveBeenCalledTimes(1);
  });

  it('does not acknowledge the message when clearing the reservation fails', async () => {
    const { listener, clearReservation } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    clearReservation.mockRejectedValueOnce(new Error('clear failed'));

    await expect(listener.onMessage(data, msg)).rejects.toThrow('clear failed');
    expect(msg.ack).not.toHaveBeenCalled();
  });
});
