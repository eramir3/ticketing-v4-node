import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { NATS_JETSTREAM_CONNECTION } from '@org/transport';
import type { Connection as MongoConnection } from 'mongoose';
import type { NatsConnection } from 'nats';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private readonly mongoConnection: MongoConnection,
    @Optional()
    @Inject(NATS_JETSTREAM_CONNECTION)
    private readonly natsConnection?: NatsConnection
  ) {}

  getHealth() {
    return {
      status: 'ok' as const,
      service: 'orders-service',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async getReadiness() {
    const dependencies = await Promise.all([
      this.checkMongo(),
      this.checkNats(),
    ]);
    const isReady = dependencies.every((dependency) => dependency.ok);

    return {
      status: isReady ? ('ready' as const) : ('not_ready' as const),
      service: 'orders-service',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      dependencies,
    };
  }

  private async checkMongo() {
    if (this.mongoConnection.readyState !== 1 || !this.mongoConnection.db) {
      return {
        name: 'mongo',
        ok: false,
        readyState: this.mongoConnection.readyState,
        error: 'Mongo connection is not ready',
      };
    }

    try {
      await this.mongoConnection.db.admin().ping();

      return {
        name: 'mongo',
        ok: true,
        readyState: this.mongoConnection.readyState,
      };
    } catch (error) {
      return {
        name: 'mongo',
        ok: false,
        readyState: this.mongoConnection.readyState,
        error: error instanceof Error ? error.message : 'Mongo ping failed',
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
