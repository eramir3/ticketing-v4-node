import type { INestApplication } from '@nestjs/common';
import { PinoLoggerService } from './pino-logger.service';
import { configurePrometheusMetrics } from './prometheus-metrics';
import { createRequestContextMiddleware } from './request-context.middleware';

export function configureHttpObservability(
  app: INestApplication,
  serviceName: string
) {
  const logger = new PinoLoggerService(serviceName);

  app.useLogger(logger);
  app.use(createRequestContextMiddleware(logger));
  configurePrometheusMetrics(app, serviceName);

  return logger;
}
