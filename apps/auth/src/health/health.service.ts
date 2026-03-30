import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  getHealth() {
    return {
      status: 'ok' as const,
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async getReadiness() {
    const mongo = await this.checkMongo();
    const isReady = mongo.ok;

    return {
      status: isReady ? ('ready' as const) : ('not_ready' as const),
      service: 'auth-service',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      dependencies: [mongo],
    };
  }

  private async checkMongo() {
    if (this.connection.readyState !== 1 || !this.connection.db) {
      return {
        name: 'mongo',
        ok: false,
        readyState: this.connection.readyState,
        error: 'Mongo connection is not ready',
      };
    }

    try {
      await this.connection.db.admin().ping();

      return {
        name: 'mongo',
        ok: true,
        readyState: this.connection.readyState,
      };
    } catch (error) {
      return {
        name: 'mongo',
        ok: false,
        readyState: this.connection.readyState,
        error: error instanceof Error ? error.message : 'Mongo ping failed',
      };
    }
  }
}
