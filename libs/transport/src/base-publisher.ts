import {
  JSONCodec,
  headers,
  type JetStreamClient,
  type MsgHdrs,
} from 'nats';
import { Event } from './types';
import { Logger } from '@nestjs/common';
import {
  SpanKind,
  SpanStatusCode,
  context as otelContext,
  propagation,
  trace,
  type TextMapSetter,
} from '@opentelemetry/api';

const tracer = trace.getTracer('ticketing-transport');
const natsHeaderSetter: TextMapSetter<MsgHdrs> = {
  set(carrier, key, value) {
    carrier.set(key, value);
  },
};

export abstract class Publisher<T extends Event> {
  abstract subject: T['subject'];
  protected client: JetStreamClient;

  constructor(client: JetStreamClient) {
    this.client = client;
  }

  async publish(data: T['data']): Promise<void> {
    const span = tracer.startSpan(`nats publish ${this.subject}`, {
      kind: SpanKind.PRODUCER,
      attributes: {
        'messaging.system': 'nats',
        'messaging.destination.name': this.subject,
        'messaging.operation': 'publish',
      },
    });

    return otelContext.with(trace.setSpan(otelContext.active(), span), async () => {
      const messageHeaders = headers();
      propagation.inject(otelContext.active(), messageHeaders, natsHeaderSetter);

      try {
        await this.client.publish(
          this.subject,
          JSONCodec<T['data']>().encode(data),
          { headers: messageHeaders }
        );

        Logger.log('Event published to subject', this.subject);
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'failed to publish event',
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
