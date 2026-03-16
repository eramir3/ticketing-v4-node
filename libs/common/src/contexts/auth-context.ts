import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { TicketingUser } from '../types/user.type';

type AuthCarrier = {
  jwt?: string;
  user?: TicketingUser;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function getCarrier(context: ExecutionContext): AuthCarrier | null {
  const type = context.getType<'http' | 'graphql'>();

  if (type === 'http') {
    const request = context.switchToHttp().getRequest();
    return isRecord(request) ? (request as AuthCarrier) : null;
  }

  if (type === 'graphql') {
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const request = gqlContext?.req;
    return isRecord(request) ? (request as AuthCarrier) : null;
  }

  return null;
}

export function getCurrentUserFromContext(
  context: ExecutionContext
): TicketingUser | null {
  return getCarrier(context)?.user ?? null;
}

export function getJwtFromContext(context: ExecutionContext): string | null {
  return getCarrier(context)?.jwt ?? null;
}

export function setCurrentUserOnContext(
  context: ExecutionContext,
  user: TicketingUser
): void {
  const carrier = getCarrier(context);

  if (carrier) {
    carrier.user = user;
  }
}