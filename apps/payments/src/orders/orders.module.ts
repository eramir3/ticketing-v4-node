import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { NatsJetStreamModule } from '@org/transport';
import { ENV_KEYS } from '../config/env.keys';
import { OrderCreatedListener } from '../events/listeners/order-created-listener';
import { OrderCancelledListener } from '../events/listeners/order-cancelled-listener';
import { TicketingEventsService } from '../events/ticketing-events.service';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from './schemas/order.schema';

const enableEventConsumers = process.env.NODE_ENV !== 'test';
const eventImports = enableEventConsumers
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
  ...(enableEventConsumers
    ? [OrderCreatedListener, OrderCancelledListener]
    : []),
];

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    ...eventImports,
  ],
  providers: [OrdersService, ...eventProviders],
  exports: [OrdersService],
})
export class OrdersModule { }
