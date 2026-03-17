import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule { }
