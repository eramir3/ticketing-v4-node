import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Ticket } from './schemas/ticket.schema';
import { Order } from '../orders/schemas/order.schema';
import { Model } from 'mongoose';
import { NotFoundError } from '@org/errors';
import { OrderStatus } from '@org/common';
import { TicketCreatedEvent, TicketUpdatedEvent } from '@org/transport';

type TicketProjectionCreateInput = Pick<
  TicketCreatedEvent['data'],
  'id' | 'title' | 'price' | 'version'
>;

type TicketProjectionUpdateInput = Pick<
  TicketUpdatedEvent['data'],
  'id' | 'title' | 'price' | 'version'
>;

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
  ) { }

  async create(ticketCreatedEvent: TicketProjectionCreateInput) {
    const ticket = await this.ticketModel.create({
      title: ticketCreatedEvent.title,
      price: ticketCreatedEvent.price,
      version: ticketCreatedEvent.version,
      _id: ticketCreatedEvent.id,
    });
    return ticket;
  }

  async update(ticketUpdatedEvent: TicketProjectionUpdateInput) {
    const ticket = await this.ticketModel.findOne({
      _id: ticketUpdatedEvent.id,
      version: ticketUpdatedEvent.version - 1,
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    ticket.set({
      ...(ticketUpdatedEvent.title !== undefined
        ? { title: ticketUpdatedEvent.title }
        : {}),
      ...(ticketUpdatedEvent.price !== undefined
        ? { price: ticketUpdatedEvent.price }
        : {}),
      version: ticketUpdatedEvent.version
    });

    await ticket.save();

    return ticket;
  }

  async findById(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketModel.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError();
    }
    return ticket;
  }

  async isReserved(ticketId: string): Promise<boolean> {
    const existingOrder = await this.orderModel.findOne({
      ticket: ticketId,
      status: {
        $in: [
          OrderStatus.Created,
          OrderStatus.AwaitingPayment,
          OrderStatus.Complete,
        ],
      },
    });

    return !!existingOrder;
  }
}
