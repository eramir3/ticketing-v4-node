import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateOrderInput {
  @IsNotEmpty({ message: 'OrderId must be provided' })
  @Field(() => Int)
  id!: number;
}
