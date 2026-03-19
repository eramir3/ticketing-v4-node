import { Inject, Injectable } from '@nestjs/common';
import { type JetStreamClient } from 'nats';
import {
  ExpirationCompleteEvent,
  NATS_JETSTREAM_CLIENT,
  Publisher,
  Subjects,
} from '@org/transport';

@Injectable()
export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;

  constructor(
    @Inject(NATS_JETSTREAM_CLIENT)
    client: JetStreamClient
  ) {
    super(client);
  }
}
