import { z } from 'zod';
import { ENV_KEYS } from './env.keys';

const envSchema = z.looseObject({
  [ENV_KEYS.PORT]: z.preprocess(
    (value) => (value == null ? '' : value),
    z
      .string()
      .trim()
      .min(1, `${ENV_KEYS.PORT} environment variable must be defined`)
      .regex(
        /^\d+$/,
        `${ENV_KEYS.PORT} environment variable must be a valid integer`
      )
  ),
  [ENV_KEYS.NATS_SERVER]: z.preprocess(
    (value) => (value == null ? '' : value),
    z
      .string()
      .trim()
      .min(1, `${ENV_KEYS.NATS_SERVER} environment variable must be defined`)
  ),
  [ENV_KEYS.REDIS_HOST]: z.preprocess(
    (value) => (value == null ? '' : value),
    z
      .string()
      .trim()
      .min(1, `${ENV_KEYS.REDIS_HOST} environment variable must be defined`)
  ),
  [ENV_KEYS.REDIS_PORT]: z.preprocess(
    (value) => (value == null ? '' : value),
    z
      .string()
      .trim()
      .min(1, `${ENV_KEYS.REDIS_PORT} environment variable must be defined`)
      .regex(
        /^\d+$/,
        `${ENV_KEYS.REDIS_PORT} environment variable must be a valid integer`
      )
  ),
  [ENV_KEYS.JWT_KEY]: z.preprocess(
    (value) => (value == null ? '' : value),
    z
      .string()
      .trim()
      .min(1, `${ENV_KEYS.JWT_KEY} environment variable must be defined`)
  ),
});

export function validateEnv(env: Record<string, string | undefined>) {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? 'Invalid environment variables'
    );
  }

  return result.data;
}
