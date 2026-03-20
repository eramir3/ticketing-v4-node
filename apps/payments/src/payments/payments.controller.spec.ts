import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { OrderStatus } from '@org/common';
import {
  app,
  orderModel,
  paymentCreatedPublisherMock,
  paymentModel,
} from '../../test/setup';

const buildCookie = (userId: string) => {
  const payload = {
    id: userId,
    email: 'test@test.com',
  };
  const token = jwt.sign(payload, process.env.JWT_KEY!);
  const session = Buffer.from(JSON.stringify({ jwt: token })).toString('base64');

  return [`session=${session}`];
};

it('returns a 404 when purchasing an order that does not exist', async () => {
  const orderId = new mongoose.Types.ObjectId().toHexString();

  await request(app.getHttpServer())
    .post('/api/payments')
    .set('Cookie', global.signin())
    .send({ orderId })
    .expect(404);
});

it('returns a 401 when purchasing an order that doesnt belong to the user', async () => {
  const order = await orderModel.create({
    _id: new mongoose.Types.ObjectId(),
    version: 0,
    status: OrderStatus.Created,
    userId: 'user-123',
    price: 20,
  });

  await request(app.getHttpServer())
    .post('/api/payments')
    .set('Cookie', buildCookie('user-999'))
    .send({ orderId: order.id })
    .expect(401);
});

it('returns a 400 when purchasing a cancelled order', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const order = await orderModel.create({
    _id: new mongoose.Types.ObjectId(),
    version: 0,
    status: OrderStatus.Cancelled,
    userId,
    price: 20,
  });

  await request(app.getHttpServer())
    .post('/api/payments')
    .set('Cookie', buildCookie(userId))
    .send({ orderId: order.id })
    .expect(400);
});

it('returns a 201 with valid inputs', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const order = await orderModel.create({
    _id: new mongoose.Types.ObjectId(),
    version: 0,
    status: OrderStatus.Created,
    userId,
    price: 20,
  });

  const response = await request(app.getHttpServer())
    .post('/api/payments')
    .set('Cookie', buildCookie(userId))
    .send({ orderId: order.id })
    .expect(201);

  const payments = await paymentModel.find({});

  expect(payments).toHaveLength(1);
  expect(payments[0]?.orderId).toBe(order.id);
  expect(response.body.orderId).toBe(order.id);
  expect(paymentCreatedPublisherMock.publish).toHaveBeenCalledWith({
    id: response.body.id,
    version: response.body.version,
    orderId: order.id,
  });
});
