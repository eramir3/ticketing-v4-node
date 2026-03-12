import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class Ticket {
  @Field(() => ID)
  id?: string;

  @Field(() => String)
  title?: string;

  @Field(() => Float)
  price?: number;

  @Field(() => ID)
  userId?: string;
}