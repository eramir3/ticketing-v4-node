import { randomUUID } from "crypto";
import { getConnectionToken } from "@nestjs/mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Connection } from "mongoose";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { appConfig } from "../src/app";

declare global {
  var signin: () => Promise<string[]>;
}

export let app: INestApplication;

let mongo: MongoMemoryServer | null = null;
let dbConnection: Connection | null = null;

beforeAll(async () => {
  process.env.JWT_KEY = "asdfasdf";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  // Starts MongoMemoryServer
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();
  process.env.MONGO_URI = mongoUri;

  // Configures nestjs app instance
  const { app: testApp } = await appConfig()
  app = testApp
  await app.init();
  dbConnection = app.get<Connection>(getConnectionToken());
});

beforeEach(async () => {
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

global.signin = async () => {
  const email = `${randomUUID()}@test.com`;
  const password = "password";

  const response = await request(app.getHttpServer())
    .post("/api/auth/signup")
    .send({
      email,
      password,
    })
    .expect(201);

  const cookie = response.get("Set-Cookie");

  if (!cookie) {
    throw new Error("Failed to get cookie from response");
  }
  return cookie;
};
