import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { type JetStreamClient, type JsMsg } from 'nats';
import {
  ExpirationCompleteEvent,
  Listener,
  NATS_JETSTREAM_CLIENT,
  Subjects,
} from '@org/transport';
import { OrdersService } from '../../orders/orders.service';
import { TicketingEventsService } from '../ticketing-events.service';
import { queueGroupName } from './queue-group-name';

@Injectable()
export class ExpirationCompleteListener
  extends Listener<ExpirationCompleteEvent>
  implements OnModuleInit {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;
  queueGroupName = queueGroupName;
  private readonly logger = new Logger(ExpirationCompleteListener.name);

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

  async onMessage(data: ExpirationCompleteEvent['data'], msg: JsMsg) {
    await this.ordersService.expire(data);
    msg.ack();
  }

  private async start() {
    try {
      await this.ticketingEventsService.ensureStream();
      await this.listen();
    } catch (error) {
      this.logger.error('Failed to start expiration-complete listener', error);
    }
  }
}
