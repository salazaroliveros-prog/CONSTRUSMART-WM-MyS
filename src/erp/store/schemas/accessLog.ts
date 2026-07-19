import { z } from 'zod';

export const accessEventEnum = z.enum(['sign_in', 'sign_out', 'session_refresh', 'sign_in_failed'] as const);

export const accessLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  email: z.string().nullable(),
  event: accessEventEnum,
  provider: z.string().nullable(),
  ip_hint: z.string().nullable(),
  user_agent: z.string().max(200).nullable(),
  created_at: z.string(),
});

export const accessLogInsertSchema = accessLogSchema.omit({ id: true, created_at: true });

export type AccessLog = z.infer<typeof accessLogSchema>;
export type AccessLogInsert = z.infer<typeof accessLogInsertSchema>;
export type AccessEvent = z.infer<typeof accessEventEnum>;
