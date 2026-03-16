import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CustomExceptionFilter } from '@org/common';
import { RequestValidationError } from '@org/errors';
import { AppModule } from './app.module';

// Configures app instance
export async function appConfig() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: errors => new RequestValidationError(errors),
    })
  );
  app.useGlobalFilters(new CustomExceptionFilter());
  return { app };
}
