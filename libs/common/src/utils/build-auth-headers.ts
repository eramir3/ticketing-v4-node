import { JwtService } from '@nestjs/jwt';
import type { TicketingUser } from '../types/user.type';

export function buildAuthHeaders(
  jwtService: JwtService,
  user: TicketingUser
) {
  const token = jwtService.sign(user);
  const session = Buffer.from(JSON.stringify({ jwt: token })).toString('base64');

  return {
    Cookie: `session=${session}`,
  };
}
