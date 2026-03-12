import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { CustomError } from '@org/errors';
import { Response } from 'express';
import { GraphQLError } from 'graphql';

type NormalizedError = {
  statusCode: number;
  errors: { message: string; field?: string }[];
};

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const normalized = this.normalizeException(exception);

    if (host.getType<'http' | 'graphql'>() === 'graphql') {
      return this.toGraphQL(normalized);
    }

    const response = host.switchToHttp().getResponse<Response>();

    return response.status(normalized.statusCode).json({
      errors: normalized.errors,
    });
  }

  private normalizeException(exception: unknown): NormalizedError {
    if (exception instanceof CustomError) {
      return {
        statusCode: exception.statusCode,
        errors: exception.serializeErrors(),
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as any;

      const messages = Array.isArray(res?.message)
        ? res.message
        : [res?.message ?? 'Something went wrong'];

      return {
        statusCode: status,
        errors: messages.map((message: string) => ({ message })),
      };
    }

    return {
      statusCode: 500,
      errors: [{ message: 'Internal server error' }],
    };
  }

  private toGraphQL(error: NormalizedError) {
    return new GraphQLError(error.errors[0]?.message ?? 'Internal server error', {
      extensions: {
        errors: error.errors,
      },
    });
  }
}
