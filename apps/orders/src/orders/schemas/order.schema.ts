import { OrderStatus } from "@org/common";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from 'mongoose';
import { Ticket } from "../../tickets/schemas/ticket.schema";

@Schema({ versionKey: 'version', optimisticConcurrency: true })
class Order {
  id!: string;

  version!: number; // Mongoose will increment this on each save

  @Prop({ type: String, enum: OrderStatus, required: true, default: OrderStatus.Created })
  status!: OrderStatus;

  @Prop()
  expiresAt!: Date;

  @Prop({ required: true })
  userId!: string;

  @Prop({
    type: Types.ObjectId,
    ref: Ticket.name,
    required: true,
    unique: true, // enforces one order per ticket
  })
  ticket!: Types.ObjectId
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