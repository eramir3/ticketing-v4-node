import {
  AckPolicy,
  DeliverPolicy,
  NatsError,
  ReplayPolicy,
  nanos,
  type Consumer,
  type ConsumerConfig,
  type ConsumerMessages,
  type JetStreamClient,
  type JsMsg,
} from 'nats';
import { Event } from './types';

export abstract class Listener<T extends Event> {
  abstract subject: T['subject'];
  abstract queueGroupName: string;
  abstract onMessage(data: T['data'], msg: JsMsg): Promise<void> | void;
  protected client: JetStreamClient;
  protected ackWait = 5 * 1000;

  constructor(client: JetStreamClient) {
    this.client = client;
  }

  consumerOptions(): Partial<ConsumerConfig> {
    return {
      ack_policy: AckPolicy.Explicit,
      ack_wait: nanos(this.ackWait),
      deliver_policy: DeliverPolicy.All,
      durable_name: this.queueGroupName,
      filter_subject: this.subject,
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

    try {
      await jsm.consumers.info(stream, this.queueGroupName);
      await jsm.consumers.update(
        stream,
        this.queueGroupName,
        this.consumerOptions()
      );
    } catch (error) {
      if (!this.isConsumerMissing(error)) {
        throw error;
      }

      await jsm.consumers.add(stream, this.consumerOptions());
    }

    return this.client.consumers.get(stream, this.queueGroupName);
  }

  private isConsumerMissing(error: unknown): boolean {
    if (!(error instanceof NatsError)) {
      return false;
    }

    return error.api_error?.code === 404;
  }

  private async processMessages(messages: ConsumerMessages) {
    for await (const msg of messages) {
      try {
        console.log(`Message received: ${this.subject} / ${this.queueGroupName}`);
        const parsedData = this.parseMessage(msg);
        await this.onMessage(parsedData, msg);
      } catch (error) {
        console.error(
          `Error processing message for subject ${this.subject}`,
          error
        );
      }
    }
  }
}
