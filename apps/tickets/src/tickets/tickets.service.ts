import { Model } from 'mongoose';
import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BadRequestError, NotAuthorizedError, NotFoundError } from '@org/errors';
import {
  TicketCreatedEvent,
  TicketUpdatedEvent,
} from '@org/transport';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './schemas/ticket.schema';
import { TicketCreatedPublisher } from '../events/publishers/ticket-created-publisher';
import { TicketUpdatedPublisher } from '../events/publishers/ticket-updated-publisher';
import { TicketingEventsService } from '../events/ticketing-events.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,
    @Optional()
    private readonly ticketingEventsService?: TicketingEventsService,
    @Optional()
    private readonly ticketCreatedPublisher?: TicketCreatedPublisher,
    @Optional()
    private readonly ticketUpdatedPublisher?: TicketUpdatedPublisher,
  ) { }

  async create(createTicketDto: CreateTicketDto, userId: string) {
    const ticket = await this.ticketModel.create({
      ...createTicketDto,
      userId,
    });

    await this.publishTicketCreated(ticket);

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

    await this.publishTicketUpdated(ticket);

    return ticket;
  }

  async reserve(id: string, orderId: string) {
    const ticket = await this.findOne(id);

    if (ticket.orderId === orderId) {
      return ticket;
    }
    if (ticket.orderId && ticket.orderId !== orderId) {
      throw new BadRequestError('Ticket is already reserved');
    }

    ticket.set({ orderId });
    await ticket.save();

    await this.publishTicketUpdated(ticket);

    return ticket;
  }

  async clearReservation(id: string, orderId: string) {
    const ticket = await this.findOne(id);

    if (!ticket.orderId || ticket.orderId !== orderId) {
      return ticket;
    }

    ticket.set({ orderId: undefined });
    await ticket.save();

    await this.publishTicketUpdated(ticket);

    return ticket;
  }

  private buildTicketCreatedEventData(ticket: Ticket): TicketCreatedEvent['data'] {
    return {
      id: ticket.id,
      version: ticket.version,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
    };
  }

  private buildTicketUpdatedEventData(ticket: Ticket): TicketUpdatedEvent['data'] {
    return {
      id: ticket.id,
      version: ticket.version,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      orderId: ticket.orderId,
    };
  }

  private async publishTicketCreated(ticket: Ticket) {
    if (!this.ticketingEventsService || !this.ticketCreatedPublisher) {
      return;
    }

    await this.ticketingEventsService.ensureStream();
    await this.ticketCreatedPublisher.publish(
      this.buildTicketCreatedEventData(ticket)
    );
  }

  private async publishTicketUpdated(ticket: Ticket) {
    if (!this.ticketingEventsService || !this.ticketUpdatedPublisher) {
      return;
    }

    await this.ticketingEventsService.ensureStream();
    await this.ticketUpdatedPublisher.publish(
      this.buildTicketUpdatedEventData(ticket)
    );
  }
}
