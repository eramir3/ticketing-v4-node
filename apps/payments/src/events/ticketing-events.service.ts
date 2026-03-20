import { Inject, Injectable } from '@nestjs/common';
import { NatsError, type NatsConnection } from 'nats';
import {
  NATS_JETSTREAM_CONNECTION,
  Subjects,
} from '@org/transport';

@Injectable()
export class TicketingEventsService {
  private streamReady?: Promise<void>;
  private readonly streamName = 'ticketing';

  constructor(
    @Inject(NATS_JETSTREAM_CONNECTION)
    private readonly connection: NatsConnection
  ) { }

  ensureStream(): Promise<void> {
    this.streamReady ??= this.createOrUpdateStream();
    return this.streamReady;
  }

  private async createOrUpdateStream() {
    const jsm = await this.connection.jetstreamManager();
    const streamConfig = {
      name: this.streamName,
      subjects: Object.values(Subjects),
    };

    try {
      await jsm.streams.info(this.streamName);
      await jsm.streams.update(this.streamName, streamConfig);
    } catch (error) {
      if (!this.isStreamMissing(error)) {
        throw error;
      }

      await jsm.streams.add(streamConfig);
    }
  }

  private isStreamMissing(error: unknown) {
    return error instanceof NatsError && error.api_error?.code === 404;
  }
}
