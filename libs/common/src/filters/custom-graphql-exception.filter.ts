import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { CustomError, type SerializedError } from '@org/errors';

@Catch()
export class CustomGraphqlExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType<'graphql' | 'http'>() !== 'graphql') {
      throw exception;
    }

    // 🔴 Custom domain errors
    if (exception instanceof CustomError) {
      const errors = this.normalizeGraphqlErrors(
        exception.serializeErrors(),
        exception.message
      );

      throw new GraphQLError(exception.message, {
        extensions: {
          code: exception.statusCode,
          errors,
        },
      });
    }

    // 🔴 Nest HttpExceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      const rawErrors =
        typeof response === 'object'
          ? (response as any).errors ??
          (response as any).message ??
          exception.message
          : response;

      const errors = this.normalizeGraphqlErrors(rawErrors, exception.message);

      throw new GraphQLError(exception.message, {
        extensions: {
          code: status,
          errors,
        },
      });
    }

    // 🔴 Unknown errors
    Logger.error(
      'Unhandled GraphQL exception',
      exception instanceof Error ? exception : undefined,
      CustomGraphqlExceptionFilter.name
    );

    throw new GraphQLError('Something went wrong', {
      extensions: {
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        errors: [{ message: 'Internal server error' }],
      },
    });
  }

  private normalizeGraphqlErrors(
    rawErrors: unknown,
    fallbackMessage: string
  ): SerializedError[] {
    const list = Array.isArray(rawErrors) ? rawErrors.flat() : [rawErrors];

    const normalized = list
      .map((error): SerializedError | null => {
        if (typeof error === 'string') {
          return { message: error };
        }

        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as { message?: unknown }).message;
          const field = (error as { field?: unknown }).field;

          if (typeof message === 'string') {
            return {
              message,
              ...(typeof field === 'string' ? { field } : {}),
            };
          }
        }

        return null;
      })
      .filter((error): error is SerializedError => error !== null);

    return normalized.length > 0 ? normalized : [{ message: fallbackMessage }];
  }
}
