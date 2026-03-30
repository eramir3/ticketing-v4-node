import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '../config/env.keys';

interface DependencyTarget {
  name: string;
  url: string;
}

export interface DependencyStatus extends DependencyTarget {
  ok: boolean;
  statusCode?: number;
  error?: string;
}

@Injectable()
export class HealthService {
  private readonly dependencies: DependencyTarget[];

  constructor(private readonly configService: ConfigService) {
    this.dependencies = [
      this.createDependency('auth', ENV_KEYS.AUTH_SERVICE),
      this.createDependency('tickets', ENV_KEYS.TICKETS_SERVICE),
      this.createDependency('orders', ENV_KEYS.ORDERS_SERVICE),
      this.createDependency('payments', ENV_KEYS.PAYMENTS_SERVICE),
    ];
  }

  getHealth() {
    return {
      status: 'ok' as const,
      service: 'client-gateway',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async getReadiness() {
    const dependencies = await Promise.all(
      this.dependencies.map((dependency) => this.probeDependency(dependency))
    );
    const isReady = dependencies.every((dependency) => dependency.ok);

    return {
      status: isReady ? ('ready' as const) : ('not_ready' as const),
      service: 'client-gateway',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      dependencies,
    };
  }

  private createDependency(name: string, envKey: keyof typeof ENV_KEYS) {
    return {
      name,
      url: this.configService.getOrThrow<string>(ENV_KEYS[envKey]),
    };
  }

  private async probeDependency(
    dependency: DependencyTarget
  ): Promise<DependencyStatus> {
    try {
      const response = await axios.get(dependency.url, {
        timeout: 2_000,
        validateStatus: () => true,
      });

      return {
        ...dependency,
        ok: response.status < 500,
        statusCode: response.status,
      };
    } catch (error) {
      return {
        ...dependency,
        ok: false,
        error: error instanceof Error ? error.message : 'probe failed',
      };
    }
  }
}
