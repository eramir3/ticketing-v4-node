import { UseFilters, UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import {
  AuthGuard,
  CurrentUser,
  CustomGraphqlExceptionFilter,
  type TicketingUser,
} from '@org/common';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { CreateOrderInput } from './dto/create-order.input';

@UseFilters(CustomGraphqlExceptionFilter)
@UseGuards(AuthGuard)
@Resolver(() => Order)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) { }

  @Mutation(() => Order)
  createOrder(
    @Args('createOrderInput') createOrderInput: CreateOrderInput,
    @CurrentUser() user: TicketingUser
  ) {
    return this.ordersService.create(createOrderInput, user);
  }

  @Query(() => [Order], { name: 'orders' })
  findAll(@CurrentUser() user: TicketingUser) {
    return this.ordersService.findAll(user);
  }

  @Query(() => Order, { name: 'order' })
  findOne(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: TicketingUser
  ) {
    return this.ordersService.findOne(id, user);
  }

  @Mutation(() => Order)
  cancelOrder(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: TicketingUser
  ) {
    return this.ordersService.cancel(id, user);
  }
}
