import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CustomExceptionFilter, configureHttpObservability } from '@org/common';
import { RequestValidationError } from '@org/errors';
import { AppModule } from './app.module';

const SERVICE_NAME = 'client-gateway';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = configureHttpObservability(app, SERVICE_NAME);

  const globalPrefix = 'api/gateway';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: errors => new RequestValidationError(errors),
    }),
  );
  app.useGlobalFilters(new CustomExceptionFilter());

  const port = process.env.PORT!;
  await app.listen(port);
  logger.log(
    `🚀 Client Gateway is running on: http://localhost:${port}/${globalPrefix}`,
    'Bootstrap'
  );
  logger.log(
    `GraphQL endpoint is available at: http://localhost:${port}/${globalPrefix}/graphql`,
    'Bootstrap'
  );
}

bootstrap();
