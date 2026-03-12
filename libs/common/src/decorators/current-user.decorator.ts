import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getCurrentUserFromContext } from '../contexts/auth-context';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    return getCurrentUserFromContext(context);
  },
);
