import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Configures app instance
export async function appConfig() {
  const app = await NestFactory.create(AppModule);
  return { app }
}
