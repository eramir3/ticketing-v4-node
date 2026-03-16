import { UseFilters, UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { AuthGuard, CurrentUser, CustomGraphqlExceptionFilter, type TicketingUser } from '@org/common';
import { TicketsService } from './tickets.service';
import { Ticket } from './entities/ticket.entity';
import { CreateTicketInput } from './dto/create-ticket.input';
import { UpdateTicketInput } from './dto/update-ticket.input';

@UseFilters(CustomGraphqlExceptionFilter)
@Resolver(() => Ticket)
export class TicketsResolver {
  constructor(private readonly ticketsService: TicketsService) { }

  @Mutation(() => Ticket)
  @UseGuards(AuthGuard)
  createTicket(
    @Args('createTicketInput') createTicketInput: CreateTicketInput,
    @CurrentUser() user: TicketingUser
  ) {
    return this.ticketsService.create(createTicketInput, user.id);
  }

  @Query(() => [Ticket], { name: 'tickets' })
  findAll() {
    return this.ticketsService.findAll();
  }

  @Query(() => Ticket, { name: 'ticket' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.ticketsService.findOne(id);
  }

  @Mutation(() => Ticket)
  @UseGuards(AuthGuard)
  updateTicket(
    @Args('updateTicketInput') updateTicketInput: UpdateTicketInput,
    @CurrentUser() user: TicketingUser
  ) {
    return this.ticketsService.update(updateTicketInput.id, updateTicketInput, user.id);
  }
}
