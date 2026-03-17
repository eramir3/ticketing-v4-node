import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersClient } from './orders.client';
import { ENV_KEYS } from '../config/env.keys';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(ENV_KEYS.JWT_KEY),
      }),
    }),
  ],
  providers: [OrdersResolver, OrdersService, OrdersClient],
})
export class OrdersModule { }
