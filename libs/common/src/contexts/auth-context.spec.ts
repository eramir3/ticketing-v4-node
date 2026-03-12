import type { ExecutionContext } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import {
  getCurrentUserFromContext,
  getJwtFromContext,
  setCurrentUserOnContext,
} from './auth-context';

function createRpcExecutionContext(data: unknown): ExecutionContext {
  return {
    getType: () => 'rpc',
    switchToRpc: () => ({
      getContext: () => null,
      getData: () => data,
    }),
  } as ExecutionContext;
}

function createHttpExecutionContext(
  request: Record<string, unknown>
): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('auth-context', () => {
  it('returns the current user from an rpc payload', () => {
    const context = createRpcExecutionContext({
      user: {
        email: 'test@test.com',
        id: 'user-123',
      },
    });

    expect(getCurrentUserFromContext(context)).toEqual({
      email: 'test@test.com',
      id: 'user-123',
    });
  });

  it('returns a jwt from both http and rpc carriers', () => {
    const token = jwt.sign(
      {
        email: 'test@test.com',
        id: 'user-123',
      },
      'test-jwt-key'
    );

    const rpcContext = createRpcExecutionContext({
      jwt: token,
    });
    const httpContext = createHttpExecutionContext({
      jwt: token,
    });

    expect(getJwtFromContext(rpcContext)).toBe(token);
    expect(getJwtFromContext(httpContext)).toBe(token);
  });

  it('stores the current user on an rpc payload', () => {
    const data: Record<string, unknown> = {};
    const context = createRpcExecutionContext(data);

    setCurrentUserOnContext(context, {
      email: 'test@test.com',
      id: 'user-123',
    });

    expect(data.user).toEqual({
      email: 'test@test.com',
      id: 'user-123',
    });
  });
});
