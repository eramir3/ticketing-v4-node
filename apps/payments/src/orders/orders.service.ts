import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderStatus } from '@org/common';
import { NotFoundError } from '@org/errors';
import {
  OrderCancelledEvent,
  OrderCreatedEvent,
} from '@org/transport';
import { Order } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
  ) { }

  async create(orderCreatedEvent: OrderCreatedEvent['data']) {
    return this.orderModel.create({
      _id: orderCreatedEvent.id,
      price: orderCreatedEvent.ticket.price,
      status: orderCreatedEvent.status,
      userId: orderCreatedEvent.userId,
      version: orderCreatedEvent.version,
    });
  }

  async cancel(orderCancelledEvent: OrderCancelledEvent['data']) {
    const order = await this.orderModel.findOne({
      _id: orderCancelledEvent.id,
      version: orderCancelledEvent.version - 1,
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }
    if (order.status === OrderStatus.Complete) {
      return order;
    }

    order.set({
      status: OrderStatus.Cancelled,
      version: orderCancelledEvent.version,
    });
    await order.save();

    return order;
  }

  async findById(id: string) {
    return this.orderModel.findById(id);
  }
}
