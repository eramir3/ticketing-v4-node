import { Injectable, NotImplementedException } from '@nestjs/common';
import { CreateTicketInput } from './dto/create-ticket.input';
import { UpdateTicketInput } from './dto/update-ticket.input';
import { TicketsClient } from './tickets.client';

@Injectable()
export class TicketsService {
  constructor(private readonly ticketsClient: TicketsClient) { }

  create(createTicketInput: CreateTicketInput, userId: string) {
    return this.ticketsClient.create({
      ...createTicketInput,
      userId,
    });
  }

  findAll() {
    return this.ticketsClient.findAll();
  }

  findOne(id: string) {
    return this.ticketsClient.findOne(id);
  }

  update(id: string, updateTicketInput: UpdateTicketInput, userId: string) {
    return this.ticketsClient.update(id, {
      ...updateTicketInput,
      userId,
    });
  }
}
