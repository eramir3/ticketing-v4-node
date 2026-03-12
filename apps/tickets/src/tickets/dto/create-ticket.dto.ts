import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateTicketDto {
    @IsNotEmpty({ message: 'Title is required' })
    @IsString({ message: 'Title must be a string' })
    title!: string;

    @IsNumber()
    @Min(0, { message: 'Price must be greater than 0' })
    price!: number;

    @IsNotEmpty({ message: 'User Id is required' })
    @IsString({ message: 'User Id must be a string' })
    userId!: string;
}
