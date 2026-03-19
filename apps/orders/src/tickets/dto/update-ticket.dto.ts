import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @IsNotEmpty({ message: 'Ticket id is required' })
  @IsString({ message: 'Ticket id must be a string' })
  @IsMongoId({ message: 'TicketId must be a valid MongoDB ObjectId' })
  override id!: string;

  @IsNotEmpty({ message: 'Ticket version must be provided' })
  @IsNumber({}, { message: 'Ticket version must be a number' })
  override version!: number
}
