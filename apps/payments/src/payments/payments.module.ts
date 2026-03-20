import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { NatsJetStreamModule } from '@org/transport';
import { ENV_KEYS } from '../config/env.keys';
import { TicketingEventsService } from '../events/ticketing-events.service';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment, PaymentsSchema } from './schemas/payment.schema';

const enableEventPublishers = process.env.NODE_ENV !== 'test';
const eventImports = enableEventPublishers
  ? [
    NatsJetStreamModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        servers: configService.getOrThrow<string>(ENV_KEYS.NATS_SERVER),
      }),
    }),
  ]
  : [];
const eventProviders = [
  TicketingEventsService,
  PaymentCreatedPublisher,
];

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(ENV_KEYS.JWT_KEY),
      }),
    }),
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentsSchema }]),
    OrdersModule,
    ...eventImports,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, ...eventProviders],
})
export class PaymentsModule {}
