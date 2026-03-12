import { z } from 'zod';
import { ENV_KEYS } from './env.keys';

const envSchema = z.looseObject({
  [ENV_KEYS.MONGO_URI]: z.preprocess(
    (value) => (value == null ? '' : value),
    z
      .string()
      .trim()
      .min(1, `${ENV_KEYS.MONGO_URI} environment variable must be defined`)
      .regex(
        /^mongodb(\+srv)?:\/\/\S+$/,
        `${ENV_KEYS.MONGO_URI} environment variable must be a valid MongoDB URI`
      )
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
