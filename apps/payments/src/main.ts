import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { appConfig, GLOBAL_PREFIX } from './app';
import { ENV_KEYS } from './config/env.keys';

async function bootstrap() {
  Logger.log('Starting up...')
  const { app } = await appConfig()
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<string>(ENV_KEYS.PORT);

  await app.listen(port);
  Logger.log(
    `🚀 Payments service is running on: http://localhost:${port}/${GLOBAL_PREFIX}`
  );
}

bootstrap();