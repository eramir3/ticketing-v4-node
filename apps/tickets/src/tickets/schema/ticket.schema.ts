import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ versionKey: 'version', optimisticConcurrency: true })
export class Ticket {
  // Virtual id getter provided by Mongoose; added for typing
  id!: string;

  // Mongoose will increment this on each save
  version!: number;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  userId!: string;

  @Prop()
  orderId!: string;
}