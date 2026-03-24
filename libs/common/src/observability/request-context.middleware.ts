import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { PinoLoggerService } from './pino-logger.service';
import { runWithRequestContext } from './request-context';

const REQUEST_ID_HEADER = 'x-request-id';

export function createRequestContextMiddleware(
  logger: PinoLoggerService
): RequestHandler {
  return (request, response, next) => {
    const requestId = readRequestId(request.headers[REQUEST_ID_HEADER]);
    const startedAt = process.hrtime.bigint();

    request.requestId = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    runWithRequestContext({ requestId }, () => {
      response.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

        logger.getPinoLogger().info(
          {
            request_id: requestId,
            http: {
              method: request.method,
              path: request.originalUrl || request.url,
              status_code: response.statusCode,
              response_time_ms: Number(durationMs.toFixed(2)),
            },
            client_ip: request.ip,
            user_agent: request.get('user-agent') ?? undefined,
          },
          'request completed'
        );
      });

      next();
    });
  };
}

function readRequestId(value: string | string[] | undefined) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  if (Array.isArray(value)) {
    const requestId = value.find((item) => item.trim().length > 0);

    if (requestId) {
      return requestId;
    }
  }

  return randomUUID();
}
