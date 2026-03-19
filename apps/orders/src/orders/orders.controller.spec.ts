import mongoose from 'mongoose';
import request from 'supertest';
import { OrderStatus } from '@org/common';
import { Ticket } from '../tickets/schemas/ticket.schema';
import {
  app,
  orderCancelledPublisherMock,
  orderCreatedPublisherMock,
  orderModel,
  ticketModel,
} from '../../test/setup';

const buildTicketAttrs = (overrides: Partial<Ticket> = {}) => ({
  title: 'concert',
  price: 20,
  version: 0,
  ...overrides,
});

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
    const ticket = await ticketModel.create(buildTicketAttrs());

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
    const ticket = await ticketModel.create(buildTicketAttrs());

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
    const ticket = await ticketModel.create(buildTicketAttrs());

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

describe('OrdersController Index (e2e)', () => {
  it('fetches orders for an particular user', async () => {
    const userOne = global.signin();
    const userTwo = global.signin();

    const ticketOne = await ticketModel.create(
      buildTicketAttrs({ title: 'concert', price: 10 })
    );
    const ticketTwo = await ticketModel.create(
      buildTicketAttrs({ title: 'show', price: 20 })
    );
    const ticketThree = await ticketModel.create(
      buildTicketAttrs({ title: 'movie', price: 30 })
    );

    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', userOne)
      .send({ ticketId: ticketOne.id })
      .expect(201);

    const orderTwoResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', userTwo)
      .send({ ticketId: ticketTwo.id })
      .expect(201);

    const orderThreeResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', userTwo)
      .send({ ticketId: ticketThree.id })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Cookie', userTwo)
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body.map((order: { id: string }) => order.id)).toEqual(
      expect.arrayContaining([
        orderTwoResponse.body.id,
        orderThreeResponse.body.id,
      ])
    );
  });
});

describe('OrdersController Show (e2e)', () => {
  it('fetches the order', async () => {
    const cookie = global.signin();
    const ticket = await ticketModel.create(buildTicketAttrs());

    const createResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', cookie)
      .send({ ticketId: ticket.id })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/api/orders/${createResponse.body.id}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body.id).toBe(createResponse.body.id);
    expect(response.body.ticket.id).toBe(ticket.id);
    expect(response.body.status).toBe(OrderStatus.Created);
  });

  it('returns an error if one user tries to fetch another users order', async () => {
    const ownerCookie = global.signin();
    const otherUserCookie = global.signin();
    const ticket = await ticketModel.create(buildTicketAttrs());

    const createResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', ownerCookie)
      .send({ ticketId: ticket.id })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/orders/${createResponse.body.id}`)
      .set('Cookie', otherUserCookie)
      .expect(401);
  });

});

describe('OrdersController Cancel (e2e)', () => {
  it('marks an order as cancelled', async () => {
    const cookie = global.signin();
    const ticket = await ticketModel.create(buildTicketAttrs());

    const createResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', cookie)
      .send({ ticketId: ticket.id })
      .expect(201);

    const response = await request(app.getHttpServer())
      .patch(`/api/orders/${createResponse.body.id}`)
      .set('Cookie', cookie)
      .expect(200);

    const order = await orderModel.findById(createResponse.body.id);

    expect(order?.status).toBe(OrderStatus.Cancelled);
    expect(response.body.status).toBe(OrderStatus.Cancelled);
  });

  it('emits a order cancelled event', async () => {
    const cookie = global.signin();
    const ticket = await ticketModel.create(buildTicketAttrs());

    const createResponse = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Cookie', cookie)
      .send({ ticketId: ticket.id })
      .expect(201);

    const cancelResponse = await request(app.getHttpServer())
      .patch(`/api/orders/${createResponse.body.id}`)
      .set('Cookie', cookie)
      .expect(200);

    expect(orderCancelledPublisherMock.publish).toHaveBeenCalledTimes(1);
    expect(orderCancelledPublisherMock.publish).toHaveBeenCalledWith({
      id: cancelResponse.body.id,
      version: cancelResponse.body.version,
      ticket: {
        id: ticket.id,
      },
    });
  });
});
