import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { RequestValidationError } from '@org/errors';
import { GatewayExceptionFilter, resolveNatsServers } from '@org/transport';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const natsServers = resolveNatsServers(configService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: natsServers,
    },
  });

  const globalPrefix = 'api/gateway';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new RequestValidationError(errors),
    }),
  );
  app.useGlobalFilters(new GatewayExceptionFilter());
  await app.startAllMicroservices();

  const port = process.env.PORT!;
  await app.listen(port);
  Logger.log(
    `🚀 Client Gateway is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `GraphQL endpoint is available at: http://localhost:${port}/${globalPrefix}/graphql`
  );
  Logger.log(`NATS listener connected to: ${natsServers.join(', ')}`);
}

bootstrap();
