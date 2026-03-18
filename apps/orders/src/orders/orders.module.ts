import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { TicketsModule } from '../tickets/tickets.module';
import { NatsJetStreamModule } from '@org/transport';
import { ENV_KEYS } from '../config/env.keys';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';
import { OrderCancelledPublisher } from '../events/publishers/order-cancelled-publisher';
import { TicketingEventsService } from '../events/ticketing-events.service';
import { ExpirationCompleteListener } from '../events/consumers/expiration-complete-listener';
import { TicketCreatedListener } from '../events/consumers/ticket-created-listener';
import { TicketUpdatedListener } from '../events/consumers/ticket-updated-listener';

const enableEvents = process.env.NODE_ENV !== 'test';
const eventImports = enableEvents
  ? [
      NatsJetStreamModule.registerAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          servers: configService.getOrThrow<string>(ENV_KEYS.NATS_SERVER),
        }),
      }),
    ]
  : [];
const eventProviders = enableEvents
  ? [
      TicketingEventsService,
      OrderCreatedPublisher,
      OrderCancelledPublisher,
      TicketCreatedListener,
      TicketUpdatedListener,
      ExpirationCompleteListener,
    ]
  : [];

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(ENV_KEYS.JWT_KEY),
      }),
    }),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    TicketsModule,
    ...eventImports,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, ...eventProviders],
})
export class OrdersModule { }
