import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsMongoId({ message: 'TicketId must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'TicketId must be provided' })
  ticketId!: string;

  @IsNotEmpty({ message: 'User Id is required' })
  @IsString({ message: 'User Id must be a string' })
  userId!: string;
}
