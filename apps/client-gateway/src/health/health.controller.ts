import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DependencyStatus, HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  async getReady(@Res({ passthrough: true }) response: Response): Promise<{
    status: "ready" | "not_ready";
    service: string;
    timestamp: string;
    uptimeSeconds: number;
    dependencies: DependencyStatus[];
}> {
    const readiness = await this.healthService.getReadiness();

    response.status(readiness.status === 'ready' ? 200 : 503);

    return readiness;
  }
}
