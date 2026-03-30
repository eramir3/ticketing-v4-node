import type { INestApplication } from '@nestjs/common';
import type { Request, RequestHandler, Response } from 'express';
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

type GlobalPrometheusState = typeof globalThis & {
  __ticketingPrometheusMetrics?: PrometheusMetricsState;
};

type HttpMetricLabels = 'method' | 'route' | 'status_code';

interface PrometheusMetricsState {
  serviceName: string;
  registry: Registry;
  requestsTotal: Counter<HttpMetricLabels>;
  requestDuration: Histogram<HttpMetricLabels>;
}

const METRICS_PATH = '/metrics';
const globalPrometheusState = globalThis as GlobalPrometheusState;

export function configurePrometheusMetrics(
  app: INestApplication,
  serviceName: string
) {
  const metrics = getOrCreatePrometheusMetrics(serviceName);

  app.use(createPrometheusMetricsMiddleware(metrics));
  app.use(METRICS_PATH, (_request: Request, response: Response) => {
    void sendMetricsResponse(metrics.registry, response);
  });
}

function getOrCreatePrometheusMetrics(
  serviceName: string
): PrometheusMetricsState {
  if (
    globalPrometheusState.__ticketingPrometheusMetrics &&
    globalPrometheusState.__ticketingPrometheusMetrics.serviceName === serviceName
  ) {
    return globalPrometheusState.__ticketingPrometheusMetrics;
  }

  const registry = new Registry();

  registry.setDefaultLabels({
    service_name: serviceName,
  });

  collectDefaultMetrics({
    register: registry,
    labels: {
      service_name: serviceName,
    },
  });

  const requestsTotal = new Counter<HttpMetricLabels>({
    name: 'http_server_requests_total',
    help: 'Total number of completed HTTP requests.',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry],
  });

  const requestDuration = new Histogram<HttpMetricLabels>({
    name: 'http_server_request_duration_seconds',
    help: 'HTTP request duration in seconds.',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
  });

  const state = {
    serviceName,
    registry,
    requestsTotal,
    requestDuration,
  };

  globalPrometheusState.__ticketingPrometheusMetrics = state;

  return state;
}

function createPrometheusMetricsMiddleware(
  metrics: PrometheusMetricsState
): RequestHandler {
  return (request, response, next) => {
    if (isMetricsRequest(request)) {
      next();
      return;
    }

    const startedAt = process.hrtime.bigint();

    response.on('finish', () => {
      if (isMetricsRequest(request)) {
        return;
      }

      const labels = {
        method: request.method,
        route: resolveRouteLabel(request),
        status_code: String(response.statusCode),
      };

      metrics.requestsTotal.inc(labels);

      const durationSeconds =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
      metrics.requestDuration.observe(labels, durationSeconds);
    });

    next();
  };
}

async function sendMetricsResponse(registry: Registry, response: Response) {
  response.setHeader('Content-Type', registry.contentType);
  response.end(await registry.metrics());
}

function isMetricsRequest(request: Request) {
  const path = request.originalUrl || request.url;
  return path === METRICS_PATH || path.startsWith(`${METRICS_PATH}?`);
}

function resolveRouteLabel(request: Request) {
  const routePath = request.route?.path;
  const baseUrl = request.baseUrl || '';

  if (typeof routePath === 'string') {
    return normalizeRouteLabel(`${baseUrl}${routePath}`);
  }

  if (Array.isArray(routePath) && routePath.length > 0) {
    return normalizeRouteLabel(`${baseUrl}${routePath[0]}`);
  }

  const originalUrl = request.originalUrl || request.url || '/';
  return normalizeRouteLabel(originalUrl.split('?')[0] || '/');
}

function normalizeRouteLabel(route: string) {
  if (!route) {
    return '/';
  }

  if (route === '/') {
    return route;
  }

  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  return normalizedRoute.replace(/\/+$/, '') || '/';
}
