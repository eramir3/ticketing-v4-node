import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TicketsService } from './tickets.service';
import { TicketsResolver } from './tickets.resolver';
import { TicketsClient } from './tickets.client';
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
  providers: [TicketsResolver, TicketsService, TicketsClient],
})
export class TicketsModule { }
