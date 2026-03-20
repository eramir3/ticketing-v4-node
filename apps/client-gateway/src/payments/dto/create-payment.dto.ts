import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @IsMongoId({ message: 'OrderId must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'OrderId must be provided' })
  orderId!: string;
}
