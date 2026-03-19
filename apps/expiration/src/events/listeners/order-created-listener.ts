import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { type JetStreamClient, type JsMsg } from 'nats';
import {
  Listener,
  NATS_JETSTREAM_CLIENT,
  OrderCreatedEvent,
  Subjects,
} from '@org/transport';
import { TicketingEventsService } from '../ticketing-events.service';
import {
  EXPIRATION_JOB_NAME,
  EXPIRATION_QUEUE_NAME,
  type ExpirationJobData,
} from '../../queues/expiration-queue';
import { queueGroupName } from './queue-group-name';

@Injectable()
export class OrderCreatedListener
  extends Listener<OrderCreatedEvent>
  implements OnModuleInit {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  queueGroupName = queueGroupName;
  private readonly logger = new Logger(OrderCreatedListener.name);

  constructor(
    @Inject(NATS_JETSTREAM_CLIENT)
    client: JetStreamClient,
    @InjectQueue(EXPIRATION_QUEUE_NAME)
    private readonly expirationQueue: Queue<ExpirationJobData>,
    private readonly ticketingEventsService: TicketingEventsService
  ) {
    super(client);
  }

  onModuleInit() {
    void this.start();
  }

  async onMessage(data: OrderCreatedEvent['data'], msg: JsMsg) {
    const delay = Math.max(0, new Date(data.expiresAt).getTime() - Date.now());

    await this.expirationQueue.add(
      EXPIRATION_JOB_NAME,
      {
        orderId: data.id,
      },
      {
        delay,
        jobId: data.id,
        removeOnComplete: true,
      }
    );

    msg.ack();
  }

  private async start() {
    try {
      await this.ticketingEventsService.ensureStream();
      await this.listen();
    } catch (error) {
      this.logger.error('Failed to start order-created listener', error);
    }
  }
}
