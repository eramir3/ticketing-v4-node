import { TicketsService } from '../../tickets/tickets.service';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { type JetStreamClient, type JsMsg } from 'nats';
import {
  Listener,
  NATS_JETSTREAM_CLIENT,
  Subjects,
  TicketUpdatedEvent,
} from '@org/transport';
import { TicketingEventsService } from '../ticketing-events.service';
import { queueGroupName } from './queue-group-name';

@Injectable()
export class TicketUpdatedListener
  extends Listener<TicketUpdatedEvent>
  implements OnModuleInit {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
  queueGroupName = queueGroupName;
  private readonly logger = new Logger(TicketUpdatedListener.name);

  constructor(
    @Inject(NATS_JETSTREAM_CLIENT)
    client: JetStreamClient,
    private readonly ticketsService: TicketsService,
    private readonly ticketingEventsService: TicketingEventsService,
  ) {
    super(client);
  }

  onModuleInit() {
    void this.start();
  }

  async onMessage(data: TicketUpdatedEvent['data'], msg: JsMsg) {
    await this.ticketsService.update(data);
    msg.ack();
  }

  private async start() {
    try {
      await this.ticketingEventsService.ensureStream();
      await this.listen();
    } catch (error) {
      this.logger.error('Failed to start ticket-updated listener', error);
    }
  }
}
