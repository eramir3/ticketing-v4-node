import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Model } from 'mongoose';
import { TicketsService } from '../tickets/tickets.service';
import { OrderStatus, TicketingUser } from '@org/common';
import { BadRequestError, NotAuthorizedError, NotFoundError } from '@org/errors';

const EXPIRATION_WINDOW_SECONDS = 1 * 10;

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    private readonly ticketsService: TicketsService,
  ) { }

  async create(createOrderDto: CreateOrderDto, user: TicketingUser) {
    const { ticketId } = createOrderDto;

    // Find the ticket the user is trying to order in the database
    const ticket = await this.ticketsService.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError();
    }

    // Make sure that this ticket is not already reserved
    const isReserved = await this.ticketsService.isReserved(ticket.id);
    if (isReserved) {
      throw new BadRequestError('Ticket is already reserved')
    }

    // Calculate an expiration date for this order
    const expiration = new Date();
    expiration.setSeconds(expiration.getSeconds() + EXPIRATION_WINDOW_SECONDS);

    // Build the order and save it to the database
    const order = await this.orderModel.create({
      userId: user.id,
      status: OrderStatus.Created,
      expiresAt: expiration,
      ticket: ticket.id
    });

    // Publish an event saying that an order was created

    await order.populate('ticket');

    return order;
  }

  async findAll(user: TicketingUser) {
    const orders = await this.orderModel.find({
      userId: user.id,
    }).populate('ticket');

    return orders;
  }

  async findOne(id: string, user: TicketingUser) {
    const order = await this.orderModel.findById(id).populate('ticket');

    if (!order) {
      throw new NotFoundError();
    }
    if (order.userId !== user.id) {
      throw new NotAuthorizedError();
    }

    return order;
  }

  async cancel(id: string, user: TicketingUser) {
    const order = await this.orderModel.findById(id).populate('ticket');

    if (!order) {
      throw new NotFoundError();
    }
    if (order.userId !== user.id) {
      throw new NotAuthorizedError();
    }
    order.status = OrderStatus.Cancelled;
    await order.save();

    return order;
  }
}
