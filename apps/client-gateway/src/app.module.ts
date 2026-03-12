import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { type Request, type Response } from 'express';
import { validateEnv } from './config/env.validation';
import {
  CookieSessionMiddleware,
  createGraphQLErrorResponsePlugin,
} from '@org/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloServerPlugin } from '@apollo/server';
import { AuthModule } from './auth/auth.module';
import { ENV_KEYS } from './config/env.keys';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/client-gateway/.env', '.env'],
      validate: validateEnv,
    }),

    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CookieSessionMiddleware)
      .forRoutes('*'); // or limit to specific controllers/routes
  }
}
