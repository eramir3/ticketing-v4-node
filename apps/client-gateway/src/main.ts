import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RequestValidationError } from '@org/errors';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'api/gateway';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new RequestValidationError(errors),
    }),
  );
  //app.useGlobalFilters(new GatewayExceptionFilter());
  await app.startAllMicroservices();

  const port = process.env.PORT!;
  await app.listen(port);
  Logger.log(
    `🚀 Client Gateway is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `GraphQL endpoint is available at: http://localhost:${port}/${globalPrefix}/graphql`
  );
  Logger.log(`NATS listener connected to: `);
}

bootstrap();
