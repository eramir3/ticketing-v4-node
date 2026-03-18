import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '../config/env.keys';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { TicketsController } from './tickets.controller';
import { NatsJetStreamModule } from '@org/transport';
import { OrderCancelledListener } from '../events/listeners/order-cancelled-listener';
import { OrderCreatedListener } from '../events/listeners/order-created-listener';
import { TicketCreatedPublisher } from '../events/publishers/ticket-created-publisher';
import { TicketUpdatedPublisher } from '../events/publishers/ticket-updated-publisher';
import { TicketingEventsService } from '../events/ticketing-events.service';

const enableEventListeners = process.env.NODE_ENV !== 'test';
const eventImports = enableEventListeners
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
  TicketCreatedPublisher,
  TicketUpdatedPublisher,
  ...(enableEventListeners
    ? [OrderCreatedListener, OrderCancelledListener]
    : []),
];

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>(ENV_KEYS.JWT_KEY),
      }),
    }),
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
    ...eventImports,
  ],
  controllers: [TicketsController],
  providers: [TicketsService, ...eventProviders],
})
export class TicketsModule { }
