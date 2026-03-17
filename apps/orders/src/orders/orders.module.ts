import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    TicketsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule { }
