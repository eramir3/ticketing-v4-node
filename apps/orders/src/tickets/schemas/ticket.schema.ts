import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ versionKey: 'version' })
class Ticket {
  // Virtual id getter provided by Mongoose; added for typing
  id!: string;

  // Mongoose will increment this on each save
  version!: number;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  price!: number;
}

const TicketSchema = SchemaFactory.createForClass(Ticket);

// Hide sensitive/irrelevant fields when sending JSON responses
TicketSchema.set('toJSON', {
  transform(_doc, ret: Record<string, any>) {
    ret.id = ret._id;
    delete ret._id;
  },
});

export { Ticket, TicketSchema };