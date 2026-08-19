import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { z } from 'zod';

// A single .env at the repo root serves docker compose, the API and Vite.
config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)), quiet: true });

/** A blank value in .env means "not configured", not "empty string". */
const optional = (schema: z.ZodString) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    schema.optional(),
  );

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  DATABASE_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),

  // Provider credentials stay server-side (NFR-004). Optional until their phase lands.
  OPENROUTESERVICE_API_KEY: optional(z.string().min(1)),
  OPENROUTESERVICE_BASE_URL: z.string().url().default('https://api.openrouteservice.org'),

  // Photon needs no key; override only to point at a self-hosted instance.
  PHOTON_BASE_URL: z.string().url().default('https://photon.komoot.io'),

  // Auth arrives in phase P8.
  GOOGLE_CLIENT_ID: optional(z.string().min(1)),
  GOOGLE_CLIENT_SECRET: optional(z.string().min(1)),
  SESSION_SECRET: optional(z.string().min(32, 'SESSION_SECRET must be at least 32 characters')),
  ALLOWED_EMAILS: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;

export const isAuthConfigured =
  Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET) && Boolean(env.SESSION_SECRET);

export const allowedEmails = env.ALLOWED_EMAILS.split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
