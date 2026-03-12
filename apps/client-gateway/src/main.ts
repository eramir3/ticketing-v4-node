import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'api/gateway';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  //app.useGlobalFilters(new GatewayExceptionFilter());

  const port = process.env.PORT!;
  await app.listen(port);
  Logger.log(
    `🚀 Client Gateway is running on: http://localhost:${port}/${globalPrefix}`
  );
  // Logger.log(
  //   `GraphQL endpoint is available at: http://localhost:${port}/${globalPrefix}/graphql`
  // );
}

bootstrap();
