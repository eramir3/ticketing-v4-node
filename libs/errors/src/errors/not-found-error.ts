import { CustomError, SerializedError } from './custom-error';

export class NotFoundError extends CustomError {
  statusCode = 404;

  constructor() {
    super('Rout not found');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeErrors(): SerializedError[] {
    return [{ message: 'Not Found' }];
  }
}