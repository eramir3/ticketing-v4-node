import { IsMongoId, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateTicketDto {
  @IsNotEmpty({ message: 'Ticket id is required' })
  @IsString({ message: 'Ticket id must be a string' })
  @IsMongoId({ message: 'TicketId must be a valid MongoDB ObjectId' })
  id!: string;

  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  title!: string;

  @IsNumber()
  @Min(0, { message: 'Price must be greater than 0' })
  price!: number;

  @IsNotEmpty({ message: 'Ticket version must be provided' })
  @IsNumber({}, { message: 'Ticket version must be a number' })
  version!: number
}
