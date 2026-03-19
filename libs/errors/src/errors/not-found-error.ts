import { CustomError, SerializedError } from './custom-error';

export class NotFoundError extends CustomError {
  statusCode = 404;

  constructor(message: string = 'Route not found') {
    super(message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeErrors(): SerializedError[] {
    return [{ message: 'Not Found' }];
  }
}