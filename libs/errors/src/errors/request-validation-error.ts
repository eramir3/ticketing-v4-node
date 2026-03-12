import { ValidationError } from 'class-validator';
import { CustomError, SerializedError } from './custom-error';

export class RequestValidationError extends CustomError {
  statusCode = 400;

  constructor(private readonly errors: ValidationError[]) {
    super('Invalid request parameters');
    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  serializeErrors(): SerializedError[] {
    return this.errors.flatMap(err =>
      Object.values(err.constraints ?? {}).map(message => ({
        field: err.property,
        message,
      })),
    );
  }
}
