import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CustomExceptionFilter } from '@org/common';
import { RequestValidationError } from '@org/errors';
import { AppModule } from './app.module';

export const GLOBAL_PREFIX = 'api';

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
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  return { app };
}
