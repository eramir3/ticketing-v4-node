import { Injectable } from '@nestjs/common';
import { type TicketingUser } from '@org/common';
import { CreateOrderInput } from './dto/create-order.input';
import { OrdersClient } from './orders.client';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersClient: OrdersClient) { }

  create(createOrderInput: CreateOrderInput, user: TicketingUser) {
    return this.ordersClient.create(createOrderInput, user);
  }

  findAll(user: TicketingUser) {
    return this.ordersClient.findAll(user);
  }

  findOne(id: string, user: TicketingUser) {
    return this.ordersClient.findOne(id, user);
  }

  cancel(id: string, user: TicketingUser) {
    return this.ordersClient.cancel(id, user);
  }
}
