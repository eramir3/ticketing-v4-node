import { Injectable, Optional } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Model } from 'mongoose';
import { TicketsService } from '../tickets/tickets.service';
import { OrderStatus, TicketingUser } from '@org/common';
import { BadRequestError, NotAuthorizedError, NotFoundError } from '@org/errors';
import { ExpirationCompleteEvent, OrderCancelledEvent, OrderCreatedEvent } from '@org/transport';
import { Ticket } from '../tickets/schemas/ticket.schema';
import { OrderCancelledPublisher } from '../events/publishers/order-cancelled-publisher';
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';
import { TicketingEventsService } from '../events/ticketing-events.service';

const EXPIRATION_WINDOW_SECONDS = 1 * 10;

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    private readonly ticketsService: TicketsService,
    @Optional()
    private readonly ticketingEventsService?: TicketingEventsService,
    @Optional()
    private readonly orderCreatedPublisher?: OrderCreatedPublisher,
    @Optional()
    private readonly orderCancelledPublisher?: OrderCancelledPublisher,
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
      ticket: ticket
    });

    await order.populate('ticket');
    await this.publishOrderCreated(order, ticket);

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

    const ticket = this.getPopulatedTicket(order)

    await this.publishOrderCancelled(order, ticket);

    return order;
  }

  async expire(data: ExpirationCompleteEvent['data']) {
    const order = await this.orderModel.findById(data.orderId).populate('ticket');

    if (!order) {
      throw new Error('Order not found');
    }

    order.set({
      status: OrderStatus.Cancelled,
    });

    await order.save();

    // Publish order cancelled event
  }

  private buildOrderCreatedEventData(order: Order, ticket: Ticket): OrderCreatedEvent['data'] {
    return {
      id: order.id,
      version: order.version,
      status: order.status,
      userId: order.userId,
      expiresAt: order.expiresAt.toISOString(),
      ticket: {
        id: ticket.id,
        price: ticket.price,
      },
    };
  }

  private buildOrderCancelledEventData(
    order: Order, ticket: Ticket
  ): OrderCancelledEvent['data'] {
    return {
      id: order.id,
      version: order.version,
      ticket: {
        id: ticket.id,
      },
    };
  }

  private getPopulatedTicket(order: Order): Ticket {
    return order.ticket as Ticket;
  }

  private async publishOrderCreated(order: Order, ticket: Ticket) {
    if (!this.ticketingEventsService || !this.orderCreatedPublisher) {
      return;
    }

    await this.ticketingEventsService.ensureStream();
    await this.orderCreatedPublisher.publish(
      this.buildOrderCreatedEventData(order, ticket)
    );
  }

  private async publishOrderCancelled(order: Order, ticket: Ticket) {
    if (!this.ticketingEventsService || !this.orderCancelledPublisher) {
      return;
    }

    await this.ticketingEventsService.ensureStream();
    await this.orderCancelledPublisher.publish(
      this.buildOrderCancelledEventData(order, ticket)
    );
  }
}
