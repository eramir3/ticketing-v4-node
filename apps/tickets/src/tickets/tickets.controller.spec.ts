import request from 'supertest';
import { app, ticketModel } from '../../test/setup';

describe('TicketController Index (e2e)', () => {
  it('can fetch a list of tickets', async () => {
    await ticketModel.create([
      { title: 'concert', price: 10, userId: 'user-1' },
      { title: 'show', price: 20, userId: 'user-2' },
      { title: 'movie', price: 30, userId: 'user-3' },
    ]);

    const response = await request(app.getHttpServer())
      .get('/api/tickets')
      .expect(200);

    expect(response.body).toHaveLength(3);
    expect(response.body.map((ticket: { title: string }) => ticket.title)).toEqual(
      expect.arrayContaining(['concert', 'show', 'movie'])
    );
  });
});

describe('TicketController New (e2e)', () => {
  it('has a route handler listening to /api/tickets for post requests', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/tickets')
      .send({});

    expect(response.status).not.toBe(404);
  });

  it('can only be accessed if the user is signed in', async () => {
    await request(app.getHttpServer())
      .post('/api/tickets')
      .send({
        title: 'ticket',
        price: 10,
      })
      .expect(401);
  });

  it('returns a status other than 401 if the user is signed in', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/tickets')
      .set('Cookie', global.signin())
      .send({});

    expect(response.status).not.toBe(401);
  });


  it('returns an error if an invalid title is provided', async () => {
    await request(app.getHttpServer())
      .post('/api/tickets')
      .set('Cookie', global.signin())
      .send({
        title: '',
        price: 10,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/tickets')
      .set('Cookie', global.signin())
      .send({
        price: 10,
      })
      .expect(400);
  });

  it('returns an error if an invalid price is provided', async () => {
    await request(app.getHttpServer())
      .post('/api/tickets')
      .set('Cookie', global.signin())
      .send({
        title: 'ticket',
        price: -10,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/tickets')
      .set('Cookie', global.signin())
      .send({
        title: 'ticket',
      })
      .expect(400);
  });


  it('creates a ticket with valid inputs', async () => {
    let tickets = await ticketModel.find({});
    expect(tickets).toHaveLength(0);

    const response = await request(app.getHttpServer())
      .post('/api/tickets')
      .set('Cookie', global.signin())
      .send({
        title: 'ticket',
        price: 10,
      })
      .expect(201);

    tickets = await ticketModel.find({});
    expect(tickets).toHaveLength(1);
    expect(tickets[0]?.title).toBe('ticket');
    expect(tickets[0]?.price).toBe(10);
    expect(response.body.title).toBe('ticket');
    expect(response.body.price).toBe(10);
  });
});