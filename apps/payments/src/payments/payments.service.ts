import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { type TicketingUser, OrderStatus } from '@org/common';
import { BadRequestError, NotAuthorizedError, NotFoundError } from '@org/errors';
import { PaymentCreatedEvent } from '@org/transport';
import { OrdersService } from '../orders/orders.service';
import { TicketingEventsService } from '../events/ticketing-events.service';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Payment } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<Payment>,
    private readonly ordersService: OrdersService,
    @Optional()
    private readonly ticketingEventsService?: TicketingEventsService,
    @Optional()
    private readonly paymentCreatedPublisher?: PaymentCreatedPublisher,
  ) { }

  async create(createPaymentDto: CreatePaymentDto, user: TicketingUser) {
    const { orderId } = createPaymentDto;
    const order = await this.ordersService.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.userId !== user.id) {
      throw new NotAuthorizedError();
    }

    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError('Cannot pay for a cancelled order');
    }
    if (order.status === OrderStatus.Complete) {
      throw new BadRequestError('Order is already paid');
    }

    const payment = await this.paymentModel.create({ orderId });

    await this.publishPaymentCreated(payment);

    return payment;
  }

  private buildPaymentCreatedEventData(payment: Payment): PaymentCreatedEvent['data'] {
    return {
      id: payment.id,
      version: payment.version,
      orderId: payment.orderId,
    };
  }

  private async publishPaymentCreated(payment: Payment) {
    if (!this.ticketingEventsService || !this.paymentCreatedPublisher) {
      return;
    }

    await this.ticketingEventsService.ensureStream();
    await this.paymentCreatedPublisher.publish(
      this.buildPaymentCreatedEventData(payment)
    );
  }
}
