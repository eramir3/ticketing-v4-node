import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CustomExceptionFilter, configureHttpObservability } from '@org/common';
import { RequestValidationError } from '@org/errors';
import { AppModule } from './app.module';

export const GLOBAL_PREFIX = 'api';
export const SERVICE_NAME = 'orders-service';

export function configureApp(app: INestApplication) {
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: errors => new RequestValidationError(errors),
    })
  );
  app.useGlobalFilters(new CustomExceptionFilter());
}

// Configures app instance
export async function appConfig() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = configureHttpObservability(app, SERVICE_NAME);
  configureApp(app);
  return { app, logger };
}
