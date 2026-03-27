import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  SpanKind,
  SpanStatusCode,
  context as otelContext,
  trace,
} from '@opentelemetry/api';
import { ExpirationCompletePublisher } from '../events/publishers/expiration-complete-publisher';
import { extractTraceCarrierContext } from '@org/common';
import {
  EXPIRATION_QUEUE_NAME,
  type ExpirationJobData,
} from './expiration-queue';

const tracer = trace.getTracer('expiration-worker');

@Injectable()
@Processor(EXPIRATION_QUEUE_NAME)
export class ExpirationProcessor extends WorkerHost {
  private readonly logger = new Logger(ExpirationProcessor.name);

  constructor(
    private readonly expirationCompletePublisher: ExpirationCompletePublisher
  ) {
    super();
  }

  async process(job: Job<ExpirationJobData>) {
    const parentContext = extractTraceCarrierContext(job.data.traceCarrier);
    const span = tracer.startSpan(
      `bullmq process ${EXPIRATION_QUEUE_NAME}`,
      {
        kind: SpanKind.CONSUMER,
        attributes: {
          'messaging.system': 'bullmq',
          'messaging.destination.name': EXPIRATION_QUEUE_NAME,
          'messaging.operation': 'process',
        },
      },
      parentContext
    );

    await otelContext.with(trace.setSpan(parentContext, span), async () => {
      try {
        this.logger.log(`Processing expiration job for order ${job.data.orderId}`);
        await this.expirationCompletePublisher.publish({
          orderId: job.data.orderId,
        });
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'failed to process expiration job',
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
