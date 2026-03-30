import request from 'supertest';
import { app } from '../../test/setup';

describe('HealthController (e2e)', () => {
  it('returns a 200 on /health', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('auth-service');
  });

  it('returns a 200 on /ready when mongo is available', async () => {
    const response = await request(app.getHttpServer()).get('/ready');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ready');
    expect(response.body.dependencies).toEqual([
      expect.objectContaining({
        name: 'mongo',
        ok: true,
      }),
    ]);
  });
});
