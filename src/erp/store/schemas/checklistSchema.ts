import { z } from 'zod';

export const checklistSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  nombre: z.string(),
  items: z.array(z.object({
    id: z.string(),
    texto: z.string(),
    completado: z.boolean().default(false),
    responsable: z.string().optional(),
    fechaLimite: z.string().optional(),
  })),
  estado: z.enum(['borrador','en_progreso','completado','cancelado']).default('borrador'),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Checklist = z.infer<typeof checklistSchema>;