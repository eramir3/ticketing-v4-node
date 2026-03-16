import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection, Model } from 'mongoose';
import jwt from 'jsonwebtoken';
import { INestApplication } from "@nestjs/common";
import { Ticket } from '../src/tickets/schemas/ticket.schema';
//import { appConfig } from '../src/app'; // Import when not using ConfigService

jest.setTimeout(15000);

declare global {
  var signin: () => string[];
}

// export let ticketModel: Ticket;
export let ticketModel: Model<Ticket>;
export let app: INestApplication;

let mongo: MongoMemoryServer | null = null;
let dbConnection: Connection | null = null;

beforeAll(async () => {
  process.env.JWT_KEY = "asdfasdf";
  process.env.PORT = "3002";

  // Starts MongoMemoryServer
  mongo = await MongoMemoryServer.create();

  const mongoUri = mongo.getUri();
  process.env.MONGO_URI = mongoUri;

  // Configures nestjs app
  //const { app: testApp } = await appConfig() // Use when not using ConfigService
  const { appConfig } = await import('../src/app.js');
  const { app: testApp } = await appConfig()
  app = testApp
  await app.init();
  dbConnection = app.get<Connection>(getConnectionToken());
  ticketModel = app.get(getModelToken(Ticket.name))
});

beforeEach(async () => {
  jest.clearAllMocks()

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
