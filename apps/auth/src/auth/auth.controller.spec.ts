import { randomUUID } from 'crypto';
import request from 'supertest';
import { app } from '../../test/setup';

describe('UsersController  Signup (e2e)', () => {
  it('returns a 201 on successful signup', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'test@test.com',
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
    const email = 'test@test.com';

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

describe('UsersController  Signin (e2e)', () => {
  it('fails when an email that does not exist is supplied', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signin')
      .send({
        email: 'test@test.com',
        password: 'password'
      })
      .expect(400);
  });

  it('fails when an incorrect password is supplied', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({
        email: 'test@test.com',
        password: 'password'
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/signin')
      .send({
        email: 'test@test.com',
        password: 'aslkdfjalskdfj'
      })
      .expect(400);
  });

});


