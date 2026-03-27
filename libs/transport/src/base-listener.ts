import {
  AckPolicy,
  DeliverPolicy,
  NatsError,
  ReplayPolicy,
  nanos,
  type MsgHdrs,
  type Consumer,
  type ConsumerConfig,
  type ConsumerMessages,
  type JetStreamClient,
  type JsMsg,
} from 'nats';
import { Event } from './types';
import { Logger } from '@nestjs/common';
import {
  ROOT_CONTEXT,
  SpanKind,
  SpanStatusCode,
  context as otelContext,
  propagation,
  trace,
  type TextMapGetter,
} from '@opentelemetry/api';

const tracer = trace.getTracer('ticketing-transport');
const natsHeaderGetter: TextMapGetter<MsgHdrs> = {
  get(carrier, key) {
    const value = carrier.get(key);
    return value ? [value] : [];
  },
  keys(carrier) {
    return carrier.keys();
  },
};

export abstract class Listener<T extends Event> {
  abstract subject: T['subject'];
  abstract queueGroupName: string;
  abstract onMessage(data: T['data'], msg: JsMsg): Promise<void> | void;
  protected client: JetStreamClient;
  protected ackWait = 5 * 1000;
  protected maxDeliver = 5;

  constructor(client: JetStreamClient) {
    this.client = client;
  }

  consumerOptions(): Partial<ConsumerConfig> {
    return {
      ack_policy: AckPolicy.Explicit,
      ack_wait: nanos(this.ackWait),
      deliver_policy: DeliverPolicy.All,
      durable_name: this.durableName(),
      filter_subject: this.subject,
      max_deliver: this.maxDeliver,
      replay_policy: ReplayPolicy.Instant,
    };
  }

  async listen(): Promise<ConsumerMessages> {
    const consumer = await this.getConsumer();
    const messages = await consumer.consume();

    void this.processMessages(messages);

    return messages;
  }

  parseMessage(msg: JsMsg): T['data'] {
    return msg.json<T['data']>();
  }

  private async getConsumer(): Promise<Consumer> {
    const jsm = await this.client.jetstreamManager();
    const stream = await jsm.streams.find(this.subject);
    const durableName = this.durableName();

    try {
      await jsm.consumers.info(stream, durableName);
      await jsm.consumers.update(
        stream,
        durableName,
        this.consumerOptions()
      );
    } catch (error) {
      if (!this.isConsumerMissing(error)) {
        throw error;
      }

      try {
        await jsm.consumers.add(stream, this.consumerOptions());
      } catch (addError) {
        if (!this.isConsumerAlreadyExists(addError)) {
          throw addError;
        }
      }
    }

    return this.client.consumers.get(stream, durableName);
  }

  private isConsumerMissing(error: unknown): boolean {
    if (!(error instanceof NatsError)) {
      return false;
    }

    return error.api_error?.code === 404;
  }

  private isConsumerAlreadyExists(error: unknown): boolean {
    if (!(error instanceof NatsError)) {
      return false;
    }

    return (
      error.api_error?.err_code === 10148 ||
      error.api_error?.description === 'consumer already exists'
    );
  }

  private durableName(): string {
    const normalizedSubject = this.subject.replace(/[^a-zA-Z0-9_-]+/g, '-');
    return `${this.queueGroupName}-${normalizedSubject}`;
  }

  private async processMessages(messages: ConsumerMessages) {
    for await (const msg of messages) {
      const parentContext = msg.headers
        ? propagation.extract(ROOT_CONTEXT, msg.headers, natsHeaderGetter)
        : ROOT_CONTEXT;
      const span = tracer.startSpan(
        `nats process ${this.subject}`,
        {
          kind: SpanKind.CONSUMER,
          attributes: {
            'messaging.system': 'nats',
            'messaging.destination.name': this.subject,
            'messaging.operation': 'process',
          },
        },
        parentContext
      );

      try {
        await otelContext.with(trace.setSpan(parentContext, span), async () => {
          Logger.log(`Message received: ${this.subject} / ${this.queueGroupName}`);
          const parsedData = this.parseMessage(msg);
          await this.onMessage(parsedData, msg);
        });
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'failed to process event',
        });
        Logger.error(
          `Error processing message for subject ${this.subject}`,
          error
        );
      } finally {
        span.end();
      }
    }
  }
}
