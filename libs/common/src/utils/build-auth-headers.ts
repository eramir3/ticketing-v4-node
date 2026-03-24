import { JwtService } from '@nestjs/jwt';
import type { TicketingUser } from '../types/user.type';
import { getRequestContext } from '../observability/request-context';

type RequestHeaders = Record<string, string>;

export function buildRequestHeaders(headers: RequestHeaders = {}) {
  const requestId = getRequestContext()?.requestId;

  if (!requestId) {
    return headers;
  }

  return {
    'x-request-id': requestId,
    ...headers,
  };
}

export function buildAuthHeaders(
  jwtService: JwtService,
  user: TicketingUser
) {
  const token = jwtService.sign(user);
  const session = Buffer.from(JSON.stringify({ jwt: token })).toString('base64');

  return buildRequestHeaders({
    Cookie: `session=${session}`,
  });
}
