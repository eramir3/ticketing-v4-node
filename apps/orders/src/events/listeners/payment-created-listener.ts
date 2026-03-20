import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { type JetStreamClient, type JsMsg } from 'nats';
import {
  Listener,
  NATS_JETSTREAM_CLIENT,
  PaymentCreatedEvent,
  Subjects,
} from '@org/transport';
import { queueGroupName } from './queue-group-name';
import { OrdersService } from '../../orders/orders.service';
import { TicketingEventsService } from '../ticketing-events.service';

@Injectable()
export class PaymentCreatedListener
  extends Listener<PaymentCreatedEvent>
  implements OnModuleInit {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
  queueGroupName = queueGroupName;
  private readonly logger = new Logger(PaymentCreatedListener.name);

  constructor(
    @Inject(NATS_JETSTREAM_CLIENT)
    client: JetStreamClient,
    private readonly ordersService: OrdersService,
    private readonly ticketingEventsService: TicketingEventsService,
  ) {
    super(client);
  }

  onModuleInit() {
    void this.start();
  }

  async onMessage(data: PaymentCreatedEvent['data'], msg: JsMsg) {
    await this.ordersService.paymentCreated(data);
    msg.ack();
  }

  private async start() {
    try {
      await this.ticketingEventsService.ensureStream();
      await this.listen();
    } catch (error) {
      this.logger.error('Failed to start payment-created listener', error);
    }
  }
}
