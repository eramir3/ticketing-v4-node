import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class Ticket {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => ID, { nullable: true })
  userId?: string;
}