import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestError, NotAuthorizedError, NotFoundError } from '@org/errors';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './schemas/ticket.schema';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,
  ) { }

  async create(createTicketDto: CreateTicketDto, userId: string) {
    const ticket = await this.ticketModel.create({
      ...createTicketDto,
      userId,
    });
    return ticket;
  }

  async findAll() {
    const tickets = await this.ticketModel.find({}).exec();
    return tickets;
  }

  async findOne(id: string) {
    const ticket = await this.ticketModel.findById(id).exec();

    if (!ticket) {
      throw new NotFoundError();
    }

    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto, userId: string) {
    const ticket = await this.ticketModel
      .findById(id)
      .exec();
    if (!ticket) {
      throw new NotFoundError();
    }

    if (ticket.orderId) {
      throw new BadRequestError('Cannot edit a reserved ticket');
    }

    if (ticket.userId !== userId) {
      throw new NotAuthorizedError();
    }

    ticket.set({
      ...(updateTicketDto.title !== undefined
        ? { title: updateTicketDto.title }
        : {}),
      ...(updateTicketDto.price !== undefined
        ? { price: updateTicketDto.price }
        : {}),
    });
    await ticket.save();

    return ticket;
  }
}
