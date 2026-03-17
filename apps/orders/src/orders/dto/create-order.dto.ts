import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @IsMongoId({ message: 'TicketId must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'TicketId must be provided' })
  ticketId!: string;
}
