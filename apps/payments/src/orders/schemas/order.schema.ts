import { OrderStatus } from '@org/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: false })
class Order {
  id!: string;

  // Event version from the orders service projection
  @Prop({ required: true })
  version!: number;

  @Prop({ type: String, enum: OrderStatus, required: true, default: OrderStatus.Created })
  status!: OrderStatus;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  price!: number
}

const OrderSchema = SchemaFactory.createForClass(Order);

// Hide sensitive/irrelevant fields when sending JSON responses
OrderSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    ret.id = ret._id;
    delete ret._id;
  },
});

export { Order, OrderSchema };