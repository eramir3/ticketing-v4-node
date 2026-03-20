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

  async create(data: OrderCreatedEvent['data']) {
    return this.orderModel.create({
      _id: data.id,
      price: data.ticket.price,
      status: data.status,
      userId: data.userId,
      version: data.version,
    });
  }

  async cancel(data: OrderCancelledEvent['data']) {
    const order = await this.orderModel.findOne({
      _id: data.id,
      version: data.version - 1,
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }
    if (order.status === OrderStatus.Complete) {
      return order;
    }

    order.set({
      status: OrderStatus.Cancelled,
      version: data.version,
    });
    await order.save();

    return order;
  }

  async findById(id: string) {
    return this.orderModel.findById(id);
  }
}
