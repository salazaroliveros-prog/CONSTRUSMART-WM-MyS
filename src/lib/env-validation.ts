import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL debe ser una URL válida'),
  VITE_SUPABASE_KEY: z.string().min(1, 'VITE_SUPABASE_KEY es requerido'),
  VITE_SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'VITE_SUPABASE_SERVICE_ROLE_KEY es requerido').optional(),
  VITE_APP_NAME: z.string().default('erp-construsmart'),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_GOOGLE_OAUTH_HD: z.string().optional(),
  VITE_VAPID_PUBLIC_KEY: z.string().optional(),
  VITE_ADMIN_EMAIL: z.string().email('VITE_ADMIN_EMAIL debe ser un email válido').optional(),
  VITE_SENTRY_DSN: z.string().url('VITE_SENTRY_DSN debe ser una URL válida').optional(),
});

type EnvSchema = z.infer<typeof envSchema>;

function validateEnv(): EnvSchema {
  try {
    const env = envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY,
      VITE_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
      VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
      VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
      VITE_GOOGLE_OAUTH_HD: import.meta.env.VITE_GOOGLE_OAUTH_HD,
      VITE_VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      VITE_ADMIN_EMAIL: import.meta.env.VITE_ADMIN_EMAIL,
      VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    });

    if (env.VITE_APP_ENV === 'production') {
      if (!env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL.includes('tu-proyecto')) {
        throw new Error('VITE_SUPABASE_URL no está configurado para producción');
      }
      if (!env.VITE_SUPABASE_KEY || env.VITE_SUPABASE_KEY.includes('tu-anon-key')) {
        throw new Error('VITE_SUPABASE_KEY no está configurado para producción');
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(
        `Validación de variables de entorno falló:\n${errorMessages.join('\n')}`
      );
    }
    throw error;
  }
}

export const env = validateEnv();

export function isDevelopment(): boolean {
  return env.VITE_APP_ENV === 'development';
}

export function isStaging(): boolean {
  return env.VITE_APP_ENV === 'staging';
}

export function isProduction(): boolean {
  return env.VITE_APP_ENV === 'production';
}

export function getSupabaseConfig() {
  return {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_KEY,
    serviceRoleKey: env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getSentryConfig() {
  return {
    dsn: env.VITE_SENTRY_DSN,
    environment: env.VITE_APP_ENV,
    appName: env.VITE_APP_NAME,
  };
}

export function getAppConfig() {
  return {
    name: env.VITE_APP_NAME,
    environment: env.VITE_APP_ENV,
    adminEmail: env.VITE_ADMIN_EMAIL,
    googleOAuthHD: env.VITE_GOOGLE_OAUTH_HD,
  };
}