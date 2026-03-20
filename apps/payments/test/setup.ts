import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection, Model } from 'mongoose';
import jwt from 'jsonwebtoken';
import { PaymentCreatedPublisher } from '../src/events/publishers/payment-created-publisher';
import { TicketingEventsService } from '../src/events/ticketing-events.service';
import { Order } from '../src/orders/schemas/order.schema';
import { Payment } from '../src/payments/schemas/payment.schema';

jest.setTimeout(15000);

declare global {
  var signin: () => string[];
}

export let app: INestApplication;
let mongo: MongoMemoryServer | null = null;
let dbConnection: Connection | null = null;
export let paymentModel: Model<Payment>;
export let orderModel: Model<Order>;
export const ticketingEventsServiceMock = {
  ensureStream: jest.fn().mockResolvedValue(undefined),
};
export const paymentCreatedPublisherMock = {
  publish: jest.fn().mockResolvedValue(undefined),
};
export const orderCancelledPublisherMock = {
  publish: jest.fn().mockResolvedValue(undefined),
};

beforeAll(async () => {
  process.env.JWT_KEY = 'asdfasdf';
  process.env.PORT = '3005';

  // Starts MongoMemoryServer
  mongo = await MongoMemoryServer.create();

  const mongoUri = mongo.getUri();
  process.env.MONGO_URI = mongoUri;

  const { configureApp } = await import('../src/app.js');
  const { AppModule } = await import('../src/app.module.js');
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(TicketingEventsService)
    .useValue(ticketingEventsServiceMock)
    .overrideProvider(PaymentCreatedPublisher)
    .useValue(paymentCreatedPublisherMock)
    .compile();

  app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  dbConnection = app.get<Connection>(getConnectionToken());
  paymentModel = app.get(getModelToken(Payment.name));
  orderModel = app.get(getModelToken(Order.name));
});

beforeEach(async () => {
  jest.clearAllMocks();

  if (!dbConnection?.db) {
    return;
  }

  const collections = await dbConnection.db.collections();

  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await app?.close();

  if (mongo) {
    await mongo.stop();
  }
});

global.signin = () => {
  // Build a JWT payload.  { id, email }
  const payload = {
    id: new mongoose.Types.ObjectId().toHexString(),
    email: 'test@test.com',
  };

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // Build session Object. { jwt: MY_JWT }
  const session = { jwt: token };

  // Turn that session into JSON
  const sessionJSON = JSON.stringify(session);

  // Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');

  // return a string thats the cookie with the encoded data
  return [`session=${base64}`];
};
