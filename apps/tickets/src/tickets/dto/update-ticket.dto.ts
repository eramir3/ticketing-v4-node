import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsNotEmpty({ message: 'Ticket Id must be provided' })
  @IsMongoId({ message: 'TicketId must be a valid MongoDB ObjectId' })
  id!: string;
}
