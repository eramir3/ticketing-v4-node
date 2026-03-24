import { startOpenTelemetry } from '../../../libs/common/src/observability/start-open-telemetry';

const SERVICE_NAME = 'payments-service';

async function bootstrap() {
  await startOpenTelemetry(SERVICE_NAME);
  const [{ ConfigService }, { appConfig, GLOBAL_PREFIX }, { ENV_KEYS }] =
    await Promise.all([
      import('@nestjs/config'),
      import('./app'),
      import('./config/env.keys'),
    ]);
  const { app, logger } = await appConfig()
  logger.log('Starting up...', 'Bootstrap');
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<string>(ENV_KEYS.PORT);

  await app.listen(port);
  logger.log(
    `🚀 Payments service is running on: http://localhost:${port}/${GLOBAL_PREFIX}`,
    'Bootstrap'
  );
}

bootstrap();
