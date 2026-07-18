/**
 * Environment Validation — Fleet Management SaaS
 * Validates all required env vars at runtime using Zod.
 * Throws a clear error if any required variable is missing or invalid.
 */

import { z } from 'zod';

// ───────────────────────────────────────────────────────────────────────────────
// Schema definition with NODE_ENV-specific requirements
// ───────────────────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Core runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database (required in all environments)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_DATABASE_URL: z.string().min(1, 'DIRECT_DATABASE_URL is required').optional(),

  // Auth (required in all environments)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('900'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('604800'),

  // App URLs (required in all environments)
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
  APP_URL: z.string().url('APP_URL must be a valid URL').optional(),
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL').optional(),

  // Cloudinary (optional)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Email (optional with fallback)
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional().default('noreply@fleet.local'),
  FROM_NAME: z.string().optional().default('Fleet Management'),

  // M-Pesa (optional)
  MPESA_CONSUMER_KEY: z.string().optional(),
  MPESA_CONSUMER_SECRET: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  MPESA_CALLBACK_URL: z.string().url().optional(),

  // Redis (optional but recommended)
  REDIS_URL: z.string().optional(),
  REDIS_POOL_SIZE: z.string().optional().default('10'),

  // Monitoring (optional)
  SENTRY_DSN: z.string().optional(),
  GRAFANA_ADMIN_USER: z.string().optional().default('admin'),
  GRAFANA_ADMIN_PASSWORD: z.string().optional().default('admin'),

  // Security (optional)
  ADMIN_2FA_REQUIRED: z.string().optional().default('false'),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  MAX_UPLOAD_SIZE_MB: z.string().optional().default('10'),
  LOG_REQUESTS: z.string().optional().default('true'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// ───────────────────────────────────────────────────────────────────────────────
// Parse and validate process.env at runtime
// ───────────────────────────────────────────────────────────────────────────────

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errors = parsedEnv.error.errors.map(
    (e) => `  • ${e.path.join('.')}: ${e.message}`
  );

  console.error(
    '\n╔══════════════════════════════════════════════════════════════════════╗' +
    '\n║  ENVIRONMENT VALIDATION FAILED                                       ║' +
    '\n╠══════════════════════════════════════════════════════════════════════╣' +
    '\n' + errors.join('\n') +
    '\n╚══════════════════════════════════════════════════════════════════════╝\n'
  );

  throw new Error(
    `Environment validation failed with ${parsedEnv.error.errors.length} error(s). ` +
    `Check your .env file or environment variables.`
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Export typed env object (immutable)
// ───────────────────────────────────────────────────────────────────────────────

export const env = Object.freeze(parsedEnv.data);

// Re-export for convenience
export type Env = typeof env;
export default env;
