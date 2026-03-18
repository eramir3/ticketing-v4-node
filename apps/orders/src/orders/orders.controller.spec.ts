import mongoose from 'mongoose';
import request from 'supertest';
import { OrderStatus } from '@org/common';
import { Ticket } from '../tickets/schemas/ticket.schema';
import {
  app,
  orderCreatedPublisherMock,
  orderModel,
  ticketModel,
} from '../../test/setup';

describe('OrdersController New (e2e)', () => {

  it('returns an error if the ticket does not exist', async () => {
    const ticketId = new mongoose.Types.ObjectId().toHexString();

    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', global.signin())
      .send({ ticketId })
      .expect(404);
  });

  it('returns an error if the ticket is already reserved', async () => {
    const ticket = await ticketModel.create({
      title: 'concert',
      price: 20,
    });

    await orderModel.create({
      userId: 'user-123',
      status: OrderStatus.Created,
      expiresAt: new Date(),
      ticket: ticket.id as any
    });

    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', global.signin())
      .send({ ticketId: ticket.id })
      .expect(400);
  });

  it('reserves a ticket', async () => {
    const cookie = global.signin();
    const ticket = await ticketModel.create({
      title: 'concert',
      price: 20,
    });

    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', cookie)
      .send({ ticketId: ticket.id })
      .expect(201);

    const order = await orderModel.findById(response.body.id).populate('ticket');

    expect(order).not.toBeNull();
    expect(order?.status).toBe(OrderStatus.Created);
    expect((order?.ticket as Ticket).id).toBe(ticket.id);
    expect(response.body.status).toBe(OrderStatus.Created);
    expect(response.body.ticket.id).toBe(ticket.id);
  });

  it('emits an order created event', async () => {
    const ticket = await ticketModel.create({
      title: 'concert',
      price: 20,
    });

    const response = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', global.signin())
      .send({ ticketId: ticket.id })
      .expect(201);

    expect(orderCreatedPublisherMock.publish).toHaveBeenCalledTimes(1);
    expect(orderCreatedPublisherMock.publish).toHaveBeenCalledWith({
      id: response.body.id,
      version: response.body.version,
      status: OrderStatus.Created,
      userId: response.body.userId,
      expiresAt: response.body.expiresAt,
      ticket: {
        id: ticket.id,
        price: 20,
      },
    });
  });
});
