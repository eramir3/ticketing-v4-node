import { Inject, Injectable } from '@nestjs/common';
import { type JetStreamClient } from 'nats';
import {
  NATS_JETSTREAM_CLIENT,
  Publisher,
  Subjects,
  TicketUpdatedEvent,
} from '@org/transport';

@Injectable()
export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;

  constructor(
    @Inject(NATS_JETSTREAM_CLIENT)
    client: JetStreamClient
  ) {
    super(client);
  }
}
