import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { CustomError, type SerializedError } from '@org/errors';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof CustomError) {
      return response.status(exception.statusCode).json({
        errors: exception.serializeErrors(),
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const rawErrors =
        typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? (exceptionResponse as Record<string, unknown>).errors ??
            (exceptionResponse as Record<string, unknown>).message ??
            exception.message
          : exceptionResponse;

      return response.status(status).json({
        errors: this.normalizeErrors(rawErrors, exception.message),
      });
    }

    Logger.error(
      'Unhandled HTTP exception',
      exception instanceof Error ? exception : undefined,
      CustomExceptionFilter.name
    );
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      errors: [{ message: 'Something went wrong' }],
    });
  }

  private normalizeErrors(
    rawErrors: unknown,
    fallbackMessage: string,
  ): SerializedError[] {
    const list = Array.isArray(rawErrors) ? rawErrors.flat() : [rawErrors];

    const normalized = list
      .map((error): SerializedError | null => {
        if (typeof error === 'string') {
          return { message: error };
        }

        if (typeof error !== 'object' || error === null || !('message' in error)) {
          return null;
        }

        const message = (error as { message?: unknown }).message;
        const field = (error as { field?: unknown }).field;

        if (typeof message !== 'string') {
          return null;
        }

        return {
          message,
          ...(typeof field === 'string' ? { field } : {}),
        };
      })
      .filter((error): error is SerializedError => error !== null);

    return normalized.length > 0 ? normalized : [{ message: fallbackMessage }];
  }
}
