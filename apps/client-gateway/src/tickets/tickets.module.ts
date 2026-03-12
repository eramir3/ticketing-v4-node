import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsResolver } from './tickets.resolver';
import { TicketsClient } from './tickets.client';

@Module({
  providers: [TicketsResolver, TicketsService, TicketsClient],
})
export class TicketsModule { }
