import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CookieSessionMiddleware } from '@org/common';
import { NatsJetStreamModule } from '@org/transport';
import { OrderCreatedListener } from './events/listeners/order-created-listener';
import { ExpirationCompletePublisher } from './events/publishers/expiration-complete-publisher';
import { TicketingEventsService } from './events/ticketing-events.service';
import { ENV_KEYS } from './config/env.keys';
import { validateEnv } from './config/env.validation';
import { ExpirationProcessor } from './queues/expiration.processor';
import { EXPIRATION_QUEUE_NAME } from './queues/expiration-queue';

const enableExpirationWorkers = process.env.NODE_ENV !== 'test';
const eventImports = enableExpirationWorkers
  ? [
    NatsJetStreamModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        servers: configService.getOrThrow<string>(ENV_KEYS.NATS_SERVER),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>(ENV_KEYS.REDIS_HOST),
          port: Number(configService.getOrThrow<string>(ENV_KEYS.REDIS_PORT)),
        },
      }),
    }),
    BullModule.registerQueue({
      name: EXPIRATION_QUEUE_NAME,
    }),
  ]
  : [];
const eventProviders = enableExpirationWorkers
  ? [
    TicketingEventsService,
    OrderCreatedListener,
    ExpirationCompletePublisher,
    ExpirationProcessor,
  ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/expiration/.env', '.env'],
      validate: validateEnv,
    }),
    ...eventImports,
  ],
  providers: [...eventProviders],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CookieSessionMiddleware).forRoutes('*');
  }
}
