import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CookieSessionMiddleware } from '@org/common';
import { validateEnv } from './config/env.validation';
import { ENV_KEYS } from './config/env.keys';
import { TicketsModule } from './tickets/tickets.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/tickets/.env', '.env'],
      validate: validateEnv,
    }),
    // Use when not using ConfigService
    // MongooseModule.forRootAsync({
    //   useFactory: () => ({ uri: process.env.MONGO_URI }),
    // }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>(ENV_KEYS.MONGO_URI),
      }),
    }),
    TicketsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CookieSessionMiddleware).forRoutes('*');
  }
}
