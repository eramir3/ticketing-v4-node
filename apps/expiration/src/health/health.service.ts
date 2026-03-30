import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { NATS_JETSTREAM_CONNECTION } from '@org/transport';
import type { Queue } from 'bullmq';
import type { NatsConnection } from 'nats';
import type { ExpirationJobData } from '../queues/expiration-queue';
import { EXPIRATION_QUEUE_NAME } from '../queues/expiration-queue';

@Injectable()
export class HealthService {
  constructor(
    @Optional()
    @Inject(NATS_JETSTREAM_CONNECTION)
    private readonly natsConnection?: NatsConnection,
    @Optional()
    @InjectQueue(EXPIRATION_QUEUE_NAME)
    private readonly expirationQueue?: Queue<ExpirationJobData>
  ) {}

  getHealth() {
    return {
      status: 'ok' as const,
      service: 'expiration-service',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async getReadiness() {
    const dependencies = await Promise.all([
      this.checkRedis(),
      this.checkNats(),
    ]);
    const isReady = dependencies.every((dependency) => dependency.ok);

    return {
      status: isReady ? ('ready' as const) : ('not_ready' as const),
      service: 'expiration-service',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      dependencies,
    };
  }

  private async checkRedis() {
    if (!this.expirationQueue) {
      return {
        name: 'redis',
        ok: true,
        skipped: true,
      };
    }

    try {
      const client = await this.expirationQueue.waitUntilReady();
      await client.ping();

      return {
        name: 'redis',
        ok: true,
      };
    } catch (error) {
      return {
        name: 'redis',
        ok: false,
        error: error instanceof Error ? error.message : 'Redis probe failed',
      };
    }
  }

  private async checkNats() {
    if (!this.natsConnection) {
      return {
        name: 'nats',
        ok: true,
        skipped: true,
      };
    }

    if (this.natsConnection.isClosed()) {
      return {
        name: 'nats',
        ok: false,
        error: 'NATS connection is closed',
      };
    }

    try {
      await this.natsConnection.jetstreamManager();

      return {
        name: 'nats',
        ok: true,
      };
    } catch (error) {
      return {
        name: 'nats',
        ok: false,
        error: error instanceof Error ? error.message : 'NATS probe failed',
      };
    }
  }
}
