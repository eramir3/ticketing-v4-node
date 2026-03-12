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

function getRequestCarrier(context: ExecutionContext): AuthCarrier | null {
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

function getRpcCarrier(context: ExecutionContext): AuthCarrier | null {
  const rpc = context.switchToRpc();

  const data = rpc.getData();
  if (isRecord(data)) {
    return data as AuthCarrier;
  }

  const ctx = rpc.getContext();
  if (isRecord(ctx)) {
    return ctx as AuthCarrier;
  }

  return null;
}

function getCarrier(context: ExecutionContext): AuthCarrier | null {
  const type = context.getType<'http' | 'graphql' | 'rpc'>();

  if (type === 'rpc') {
    return getRpcCarrier(context);
  }

  return getRequestCarrier(context);
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