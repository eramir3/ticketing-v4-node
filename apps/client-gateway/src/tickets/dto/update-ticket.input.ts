import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty } from 'class-validator';
import { CreateTicketInput } from './create-ticket.input';

@InputType()
export class UpdateTicketInput extends PartialType(CreateTicketInput) {
  @IsNotEmpty({ message: 'Ticket Id must be provided' })
  @IsMongoId({ message: 'TicketId must be a valid MongoDB ObjectId' })
  @Field(() => String)
  id!: string;
}
