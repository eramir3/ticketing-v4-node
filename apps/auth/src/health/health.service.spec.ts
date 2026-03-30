import { HealthService } from './health.service';

describe('HealthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reports ready when mongoose is connected and ping succeeds', async () => {
    const ping = jest.fn().mockResolvedValue(undefined);
    const service = new HealthService({
      readyState: 1,
      db: {
        admin: () => ({
          ping,
        }),
      },
    } as any);

    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('ready');
    expect(readiness.dependencies).toEqual([
      {
        name: 'mongo',
        ok: true,
        readyState: 1,
      },
    ]);
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('reports not_ready when mongoose is disconnected', async () => {
    const service = new HealthService({
      readyState: 0,
      db: undefined,
    } as any);

    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('not_ready');
    expect(readiness.dependencies).toEqual([
      {
        name: 'mongo',
        ok: false,
        readyState: 0,
        error: 'Mongo connection is not ready',
      },
    ]);
  });
});
