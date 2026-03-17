import { OrderStatus } from '@org/common';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { GraphQLISODateTime } from '@nestjs/graphql';
import { Ticket } from '../../tickets/entities/ticket.entity';

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@ObjectType()
export class Order {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => OrderStatus, { nullable: true })
  status?: OrderStatus;

  @Field(() => GraphQLISODateTime, { nullable: true })
  expiresAt?: Date;

  @Field(() => ID, { nullable: true })
  userId?: string;

  @Field(() => Ticket, { nullable: true })
  ticket?: Ticket;
}