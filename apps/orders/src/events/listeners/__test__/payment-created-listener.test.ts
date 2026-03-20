import { PaymentCreatedEvent } from '@org/transport';
import { type JetStreamClient, type JsMsg } from 'nats';
import { OrdersService } from '../../../orders/orders.service';
import { TicketingEventsService } from '../../ticketing-events.service';
import { PaymentCreatedListener } from '../payment-created-listener';

const buildData = (): PaymentCreatedEvent['data'] => ({
  id: 'payment-123',
  version: 0,
  orderId: 'order-123',
});

const buildMessage = () =>
  ({
    ack: jest.fn(),
  }) as unknown as JsMsg;

const buildListener = () => {
  const paymentCreated = jest.fn().mockResolvedValue(undefined);
  const ordersService = {
    paymentCreated,
  } as unknown as OrdersService;
  const ticketingEventsService = {
    ensureStream: jest.fn(),
  } as unknown as TicketingEventsService;

  const listener = new PaymentCreatedListener(
    {} as JetStreamClient,
    ordersService,
    ticketingEventsService
  );

  return { listener, paymentCreated };
};

describe('PaymentCreatedListener', () => {
  it('marks the order as complete', async () => {
    const { listener, paymentCreated } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(paymentCreated).toHaveBeenCalledWith(data);
  });

  it('acks the message', async () => {
    const { listener } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    await listener.onMessage(data, msg);

    expect(msg.ack).toHaveBeenCalledTimes(1);
  });

  it('does not ack if marking the order complete fails', async () => {
    const { listener, paymentCreated } = buildListener();
    const data = buildData();
    const msg = buildMessage();

    paymentCreated.mockRejectedValueOnce(new Error('payment failed'));

    await expect(listener.onMessage(data, msg)).rejects.toThrow('payment failed');
    expect(msg.ack).not.toHaveBeenCalled();
  });
});
