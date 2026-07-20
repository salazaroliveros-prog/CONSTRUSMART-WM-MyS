import { z } from 'zod';

export const anticipoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  proveedorId: z.string().optional(),
  monto: z.number(),
  motivo: z.string(),
  fechaSolicitud: z.string(),
  fechaAprobacion: z.string().optional(),
  estado: z.enum(['pendiente','aprobado','pagado','rechazado']).default('pendiente'),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Anticipo = z.infer<typeof anticipoSchema>;