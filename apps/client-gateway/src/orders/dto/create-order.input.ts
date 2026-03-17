import { InputType, Field, ID } from '@nestjs/graphql';
import { IsMongoId, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateOrderInput {
  @IsMongoId({ message: 'TicketId must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'TicketId must be provided' })
  @Field(() => ID)
  ticketId!: string;
}