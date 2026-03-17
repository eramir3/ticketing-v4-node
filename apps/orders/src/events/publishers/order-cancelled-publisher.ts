import { Inject, Injectable } from '@nestjs/common';
import { type JetStreamClient } from 'nats';
import {
  NATS_JETSTREAM_CLIENT,
  OrderCancelledEvent,
  Publisher,
  Subjects,
} from '@org/transport';

@Injectable()
export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;

  constructor(
    @Inject(NATS_JETSTREAM_CLIENT)
    client: JetStreamClient
  ) {
    super(client);
  }
}
