import { randomUUID } from 'crypto';
import request from 'supertest';
import { app } from '../../test/setup';

const buildEmail = () => `${randomUUID()}@test.com`;

describe('UsersController  Signup (e2e)', () => {
  it('returns a 201 on successful signup', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: buildEmail(),
        password: 'password'
      });

    expect(response.status).toBe(201);
  });

  it('returns a 400 with an invalid email', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'alskdflaskjfd',
        password: 'password'
      })

    expect(response.status).toBe(400);
  });

  it('returns a 400 with an invalid password', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'alskdflaskjfd',
        password: 'p'
      })

    expect(response.status).toBe(400);
  });

  it('returns a 400 with missing email and password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'test@test.com'
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        password: 'alskjdf'
      })
      .expect(400);
  });

  it('disallows duplicate emails', async () => {
    const email = buildEmail();

    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email,
        password: 'password'
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email,
        password: 'password'
      })
      .expect(400);
  });
});
