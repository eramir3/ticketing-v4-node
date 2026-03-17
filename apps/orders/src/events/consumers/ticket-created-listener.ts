import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { type JetStreamClient, type JsMsg } from 'nats';
import {
  Listener,
  NATS_JETSTREAM_CLIENT,
  Subjects,
  TicketCreatedEvent,
} from '@org/transport';
import { TicketsService } from '../../tickets/tickets.service';
import { TicketingEventsService } from '../ticketing-events.service';
import { queueGroupName } from './queue-group-name';

@Injectable()
export class TicketCreatedListener
  extends Listener<TicketCreatedEvent>
  implements OnModuleInit {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  queueGroupName = queueGroupName;
  private readonly logger = new Logger(TicketCreatedListener.name);

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

  async onMessage(data: TicketCreatedEvent['data'], msg: JsMsg) {
    await this.ticketsService.create(data);
    msg.ack();
  }

  private async start() {
    try {
      await this.ticketingEventsService.ensureStream();
      await this.listen();
    } catch (error) {
      this.logger.error('Failed to start ticket-created listener', error);
    }
  }
}
