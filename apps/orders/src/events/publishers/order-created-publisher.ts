import { Inject, Injectable } from '@nestjs/common';
import { type JetStreamClient } from 'nats';
import {
  NATS_JETSTREAM_CLIENT,
  OrderCreatedEvent,
  Publisher,
  Subjects,
} from '@org/transport';

@Injectable()
export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;

  constructor(
    @Inject(NATS_JETSTREAM_CLIENT)
    client: JetStreamClient
  ) {
    super(client);
  }
}
