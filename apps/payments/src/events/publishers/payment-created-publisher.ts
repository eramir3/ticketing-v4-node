import { Inject, Injectable } from '@nestjs/common';
import { type JetStreamClient } from 'nats';
import {
  NATS_JETSTREAM_CLIENT,
  PaymentCreatedEvent,
  Publisher,
  Subjects,
} from '@org/transport';

@Injectable()
export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;

  constructor(
    @Inject(NATS_JETSTREAM_CLIENT)
    client: JetStreamClient
  ) {
    super(client);
  }
}
