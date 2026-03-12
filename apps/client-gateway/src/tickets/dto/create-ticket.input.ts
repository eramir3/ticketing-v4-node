import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, Min, IsNumber } from 'class-validator';

@InputType()
export class CreateTicketInput {
  @Field()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0, { message: 'Price must be greater than 0' })
  price!: number;
}