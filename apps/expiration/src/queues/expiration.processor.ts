import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ExpirationCompletePublisher } from '../events/publishers/expiration-complete-publisher';
import {
  EXPIRATION_QUEUE_NAME,
  type ExpirationJobData,
} from './expiration-queue';

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
    this.logger.log(`Processing expiration job for order ${job.data.orderId}`);
    await this.expirationCompletePublisher.publish({
      orderId: job.data.orderId,
    });
  }
}
