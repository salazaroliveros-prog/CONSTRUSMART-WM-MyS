import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_KEY: z.string().min(1),
  VITE_ADMIN_EMAIL: z.string().email().optional().default('admin@construsmart.com'),
});

export const env = envSchema.parse(import.meta.env);

export type Env = typeof env;