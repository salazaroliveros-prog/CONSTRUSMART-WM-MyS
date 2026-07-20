import { z } from 'zod';

export const apiKeySchema = z.object({
  id: z.string(),
  nombre: z.string(),
  keyHash: z.string(),
  ultimos4: z.string(),
  rol: z.string().optional(),
  expiracion: z.string().optional(),
  activa: z.boolean().default(true),
  ultimoUso: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
});

export type ApiKey = z.infer<typeof apiKeySchema>;