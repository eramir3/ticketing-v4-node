import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ENV_KEYS } from '../config/env.keys';
import { PaymentsClient } from './payments.client';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(ENV_KEYS.JWT_KEY),
      }),
    }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsClient],
})
export class PaymentsModule {}
