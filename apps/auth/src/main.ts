import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { appConfig } from './app';
import { ENV_KEYS } from './config/env.keys';

async function bootstrap() {
  Logger.log('Starting up...')
  const { app } = await appConfig()
  const configService = app.get(ConfigService);
  const globalPrefix = 'api';
  const port = configService.getOrThrow<string>(ENV_KEYS.PORT);

  await app.listen(port);
  Logger.log(
    `🚀 Auth service is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
