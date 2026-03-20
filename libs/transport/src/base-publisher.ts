import {
  JSONCodec,
  type JetStreamClient,
} from 'nats';
import { Event } from './types';
import { Logger } from '@nestjs/common';

export abstract class Publisher<T extends Event> {
  abstract subject: T['subject'];
  protected client: JetStreamClient;

  constructor(client: JetStreamClient) {
    this.client = client;
  }

  publish(data: T['data']): Promise<void> {
    return this.client
      .publish(this.subject, JSONCodec<T['data']>().encode(data))
      .then(() => {
        Logger.log('Event published to subject', this.subject);
      });
  }
}
