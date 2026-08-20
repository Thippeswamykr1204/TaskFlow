import { z } from 'zod';

/**
 * Env schema for Tier 0. Extend this as new config surfaces (mail, redis, etc.)
 * are introduced in later tiers — keep it the single source of truth for
 * "what does this service need to boot".
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z
    .string()
    .min(1, 'MONGO_URI is required')
    .regex(/^mongodb(\+srv)?:\/\//, 'MONGO_URI must be a valid Mongo connection string'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3001'),
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z
    .string()
    .min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, 'CLOUDINARY_API_SECRET is required'),
  MAX_ATTACHMENT_SIZE_MB: z.coerce.number().positive().default(10),
  RESEND_API_KEY: z
    .string()
    .min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM_ADDRESS: z
    .string()
    .min(1, 'EMAIL_FROM_ADDRESS is required'),
  OPENWEATHER_API_KEY: z
    .string()
    .min(1, 'OPENWEATHER_API_KEY is required'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Passed to ConfigModule.forRoot({ validate }). Throws — and thus fails
 * Nest's bootstrap — if required vars are missing or malformed, so we never
 * boot into an undefined-config state.
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`❌ Invalid environment configuration:\n${formatted}`);
  }

  return result.data;
}