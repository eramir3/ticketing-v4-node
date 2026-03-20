import { Injectable } from '@nestjs/common';
import { type TicketingUser } from '@org/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsClient } from './payments.client';

@Injectable()
export class PaymentsService {
  constructor(private readonly paymentsClient: PaymentsClient) { }

  create(createPaymentDto: CreatePaymentDto, user: TicketingUser) {
    return this.paymentsClient.create(createPaymentDto, user);
  }
}
