import { Injectable } from '@nestjs/common';
import { type TicketingUser } from '@org/common';
import { CreateTicketInput } from './dto/create-ticket.input';
import { UpdateTicketInput } from './dto/update-ticket.input';
import { TicketsClient } from './tickets.client';

@Injectable()
export class TicketsService {
  constructor(private readonly ticketsClient: TicketsClient) { }

  create(createTicketInput: CreateTicketInput, user: TicketingUser) {
    return this.ticketsClient.create(createTicketInput, user);
  }

  findAll() {
    return this.ticketsClient.findAll();
  }

  findOne(id: string) {
    return this.ticketsClient.findOne(id);
  }

  update(id: string, updateTicketInput: UpdateTicketInput, user: TicketingUser) {
    return this.ticketsClient.update(id, updateTicketInput, user);
  }
}
