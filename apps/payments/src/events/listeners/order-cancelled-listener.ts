import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { type JetStreamClient, type JsMsg } from 'nats';
import {
  Listener,
  NATS_JETSTREAM_CLIENT,
  OrderCancelledEvent,
  Subjects,
} from '@org/transport';
import { queueGroupName } from './queue-group-name';
import { OrdersService } from '../../orders/orders.service';
import { TicketingEventsService } from '../ticketing-events.service';

@Injectable()
export class OrderCancelledListener
  extends Listener<OrderCancelledEvent>
  implements OnModuleInit {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;
  private readonly logger = new Logger(OrderCancelledListener.name);

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

  async onMessage(data: OrderCancelledEvent['data'], msg: JsMsg) {
    await this.ordersService.cancel(data);
    msg.ack();
  }

  private async start() {
    try {
      await this.ticketingEventsService.ensureStream();
      await this.listen();
    } catch (error) {
      this.logger.error('Failed to start order-cancelled listener', error);
    }
  }
}
