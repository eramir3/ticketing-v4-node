import { HealthService } from './health.service';

describe('HealthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reports ready when redis and nats are healthy', async () => {
    const ping = jest.fn().mockResolvedValue('PONG');
    const waitUntilReady = jest.fn().mockResolvedValue({ ping });
    const jetstreamManager = jest.fn().mockResolvedValue({});
    const service = new HealthService(
      {
        isClosed: () => false,
        jetstreamManager,
      } as any,
      {
        waitUntilReady,
      } as any
    );

    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('ready');
    expect(readiness.dependencies).toEqual([
      {
        name: 'redis',
        ok: true,
      },
      {
        name: 'nats',
        ok: true,
      },
    ]);
    expect(waitUntilReady).toHaveBeenCalledTimes(1);
    expect(ping).toHaveBeenCalledTimes(1);
    expect(jetstreamManager).toHaveBeenCalledTimes(1);
  });

  it('reports not_ready when nats is closed', async () => {
    const ping = jest.fn().mockResolvedValue('PONG');
    const waitUntilReady = jest.fn().mockResolvedValue({ ping });
    const service = new HealthService(
      {
        isClosed: () => true,
      } as any,
      {
        waitUntilReady,
      } as any
    );

    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('not_ready');
    expect(readiness.dependencies).toEqual([
      {
        name: 'redis',
        ok: true,
      },
      {
        name: 'nats',
        ok: false,
        error: 'NATS connection is closed',
      },
    ]);
  });

  it('skips readiness probes when queue and nats are not registered', async () => {
    const service = new HealthService();

    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('ready');
    expect(readiness.dependencies).toEqual([
      {
        name: 'redis',
        ok: true,
        skipped: true,
      },
      {
        name: 'nats',
        ok: true,
        skipped: true,
      },
    ]);
  });
});
