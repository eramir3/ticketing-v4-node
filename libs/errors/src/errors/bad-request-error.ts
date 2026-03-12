import { CustomError, SerializedError } from './custom-error';

export class BadRequestError extends CustomError {
  override statusCode = 400;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  serializeErrors(): SerializedError[] {
    return [{ message: this.message }];
  }
}
