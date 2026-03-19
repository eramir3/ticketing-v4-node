import { Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Ticket } from './schemas/ticket.schema';
import { Order } from '../orders/schemas/order.schema';
import { Model } from 'mongoose';
import { NotFoundError } from '@org/errors';
import { OrderStatus } from '@org/common';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
  ) { }

  async create(createTicketDto: CreateTicketDto) {
    const ticket = await this.ticketModel.create({
      title: createTicketDto.title,
      price: createTicketDto.price,
      version: createTicketDto.version,
      _id: createTicketDto.id,
    });
    return ticket;
  }

  async update(updateTicketDto: UpdateTicketDto) {
    const ticket = await this.ticketModel.findOne({
      _id: updateTicketDto.id,
      version: updateTicketDto.version - 1,
    });

    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    ticket.set({
      ...(updateTicketDto.title !== undefined
        ? { title: updateTicketDto.title }
        : {}),
      ...(updateTicketDto.price !== undefined
        ? { price: updateTicketDto.price }
        : {}),
      version: updateTicketDto.version
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
