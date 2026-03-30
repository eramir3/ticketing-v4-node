import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

describe('HealthService', () => {
  const configValues = {
    AUTH_SERVICE: 'http://auth:3001/api',
    TICKETS_SERVICE: 'http://tickets:3002/api',
    ORDERS_SERVICE: 'http://orders:3003/api',
    PAYMENTS_SERVICE: 'http://payments:3005/api',
  };

  const configService = {
    getOrThrow: jest.fn((key: keyof typeof configValues) => configValues[key]),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports the gateway as ready when dependencies are reachable', async () => {
    (axios.get as jest.Mock).mockResolvedValue({ status: 404 });

    const service = new HealthService(configService);
    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('ready');
    expect(readiness.dependencies).toHaveLength(4);
    expect(readiness.dependencies.every((dependency) => dependency.ok)).toBe(true);
  });

  it('reports the gateway as not ready when a dependency probe fails', async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ status: 404 })
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
      .mockResolvedValue({ status: 404 });

    const service = new HealthService(configService);
    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('not_ready');
    expect(readiness.dependencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'tickets',
          ok: false,
          error: 'connect ECONNREFUSED',
        }),
      ])
    );
  });
});
