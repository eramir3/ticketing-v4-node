import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser, type TicketingUser } from '@org/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) { }

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser() user: TicketingUser
  ) {
    return this.ticketsService.create(createTicketDto, user.id);
  }

  @Get()
  findAll() {
    return this.ticketsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto, @CurrentUser() user: TicketingUser) {
    return this.ticketsService.update(id, updateTicketDto, user.id);
  }
}
