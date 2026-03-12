import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { type Request, type Response } from 'express';
import { validateEnv } from './config/env.validation';
import { CookieSessionMiddleware, createGraphQLErrorResponsePlugin } from '@org/common'
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ApolloServerPlugin } from '@apollo/server';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/client-gateway/.env', '.env'],
      validate: validateEnv,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'apps/client-gateway/src/schema.gql'),
      context: ({ req, res }: { req: Request, res: Response }) => ({ req, res }),
      path: '/graphql',
      useGlobalPrefix: true,
      graphiql: true,
      plugins: [createGraphQLErrorResponsePlugin() as ApolloServerPlugin<any>],
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
