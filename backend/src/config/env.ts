import { z } from 'zod';

// Blank values (common on hosting dashboards) count as "not set".
const blankToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  HOST: z.string().min(1).default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  // Supabase project URL and *publishable* key. Used to verify user tokens. Never a secret key.
  SUPABASE_URL: z.preprocess(
    blankToUndefined,
    z
      .string()
      .url()
      .refine((value) => value.startsWith('https://'), 'must start with https://')
      .optional(),
  ),
  SUPABASE_PUBLISHABLE_KEY: z.preprocess(blankToUndefined, z.string().min(1).optional()),
  // Comma-separated list of allowed origins. Capacitor Android uses https://localhost.
  CORS_ORIGINS: z
    .string()
    .default('https://localhost,http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
});

export type Env = z.infer<typeof envSchema>;

/** Parses and validates environment variables. Throws a readable error when invalid. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return result.data;
}
