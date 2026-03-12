import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { NotAuthorizedError, NotFoundError } from '@org/errors';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './schema/ticket.schema';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,
  ) { }

  async create(createTicketDto: CreateTicketDto) {
    const ticket = this.ticketModel.create(createTicketDto);
    return ticket;
  }

  findAll() {
    const tickets = this.ticketModel.find({});
    return tickets
  }

  async findOne(id: string) {
    const ticket = await this.ticketModel.findById(id).exec();

    if (!ticket) {
      throw new NotFoundError();
    }

    return ticket;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto) {
    const ticket = await this.ticketModel
      .findById(updateTicketDto.id)
      .exec();
    if (!ticket) {
      throw new NotFoundError();
    }

    // if (ticket.orderId) {
    //   throw new BadRequestError('Cannot edit a reserved ticket')
    // }

    if (ticket.userId !== updateTicketDto.userId) {
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
