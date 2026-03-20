import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: 'version' })
class Payment {
  id!: string;

  version!: number; // Mongoose will increment this on each save

  @Prop({ required: true })
  orderId!: string;
}

const PaymentsSchema = SchemaFactory.createForClass(Payment);

// Hide sensitive/irrelevant fields when sending JSON responses
PaymentsSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    ret.id = ret._id;
    delete ret._id;
  },
});

export { Payment, PaymentsSchema };