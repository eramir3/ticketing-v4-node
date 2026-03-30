import { HealthService } from './health.service';

describe('HealthService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reports ready when mongo and nats are healthy', async () => {
    const ping = jest.fn().mockResolvedValue(undefined);
    const jetstreamManager = jest.fn().mockResolvedValue({});
    const service = new HealthService(
      {
        readyState: 1,
        db: {
          admin: () => ({
            ping,
          }),
        },
      } as any,
      {
        isClosed: () => false,
        jetstreamManager,
      } as any
    );

    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('ready');
    expect(readiness.dependencies).toEqual([
      {
        name: 'mongo',
        ok: true,
        readyState: 1,
      },
      {
        name: 'nats',
        ok: true,
      },
    ]);
    expect(ping).toHaveBeenCalledTimes(1);
    expect(jetstreamManager).toHaveBeenCalledTimes(1);
  });

  it('reports not_ready when nats is closed', async () => {
    const ping = jest.fn().mockResolvedValue(undefined);
    const service = new HealthService(
      {
        readyState: 1,
        db: {
          admin: () => ({
            ping,
          }),
        },
      } as any,
      {
        isClosed: () => true,
      } as any
    );

    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('not_ready');
    expect(readiness.dependencies).toEqual([
      {
        name: 'mongo',
        ok: true,
        readyState: 1,
      },
      {
        name: 'nats',
        ok: false,
        error: 'NATS connection is closed',
      },
    ]);
  });

  it('skips the nats probe when the connection is not registered', async () => {
    const ping = jest.fn().mockResolvedValue(undefined);
    const service = new HealthService(
      {
        readyState: 1,
        db: {
          admin: () => ({
            ping,
          }),
        },
      } as any
    );

    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('ready');
    expect(readiness.dependencies).toEqual([
      {
        name: 'mongo',
        ok: true,
        readyState: 1,
      },
      {
        name: 'nats',
        ok: true,
        skipped: true,
      },
    ]);
  });
});
