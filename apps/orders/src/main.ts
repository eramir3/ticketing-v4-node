import { ConfigService } from '@nestjs/config';
import { appConfig, GLOBAL_PREFIX } from './app';
import { ENV_KEYS } from './config/env.keys';

async function bootstrap() {
  const { app, logger } = await appConfig()
  logger.log('Starting up...', 'Bootstrap');
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<string>(ENV_KEYS.PORT);

  await app.listen(port);
  logger.log(
    `🚀 Orders service is running on: http://localhost:${port}/${GLOBAL_PREFIX}`,
    'Bootstrap'
  );
}

bootstrap();
