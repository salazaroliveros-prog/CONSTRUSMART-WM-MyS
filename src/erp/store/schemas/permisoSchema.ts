import { z } from 'zod';

export const permisoSchema = z.object({
  id: z.string(),
  usuarioId: z.string(),
  proyectoId: z.string(),
  rol: z.string().optional(),
  permisos: z.record(z.string(), z.boolean()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Permiso = z.infer<typeof permisoSchema>;