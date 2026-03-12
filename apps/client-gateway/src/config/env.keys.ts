export const ENV_KEYS = {
  PORT: 'PORT',
  NATS_SERVER: 'NATS_SERVER',
  AUTH_SERVICE: 'AUTH_SERVICE',
} as const;

export const DI_TOKENS = {
  NATS_CLIENT: 'NATS_CLIENT',
  AUTH_SERVICE: 'AUTH_SERVICE',
} as const;
