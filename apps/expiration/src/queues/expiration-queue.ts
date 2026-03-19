export const EXPIRATION_QUEUE_NAME = 'expiration';
export const EXPIRATION_JOB_NAME = 'expire-order';

export interface ExpirationJobData {
  orderId: string;
}
