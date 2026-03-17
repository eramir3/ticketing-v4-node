import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, type TicketingUser } from '@org/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: TicketingUser) {
    return this.ordersService.create(createOrderDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: TicketingUser) {
    return this.ordersService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: TicketingUser) {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id')
  cancel(@Param('id') id: string, @CurrentUser() user: TicketingUser) {
    return this.ordersService.cancel(id, user);
  }
}
