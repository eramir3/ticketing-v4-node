import { startOpenTelemetry } from '../../../libs/common/src/observability/start-open-telemetry';

const SERVICE_NAME = 'client-gateway';

async function bootstrap() {
  await startOpenTelemetry(SERVICE_NAME);
  const [
    { ValidationPipe },
    { NestFactory },
    { CustomExceptionFilter, configureHttpObservability },
    { RequestValidationError },
    { AppModule },
  ] = await Promise.all([
    import('@nestjs/common'),
    import('@nestjs/core'),
    import('@org/common'),
    import('@org/errors'),
    import('./app.module'),
  ]);
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
