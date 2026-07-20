import { z } from 'zod';

export const cajaChicaSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  nombre: z.string(),
  montoAsignado: z.number(),
  montoUtilizado: z.number().default(0),
  saldo: z.number(),
  fechaApertura: z.string(),
  fechaCierre: z.string().optional(),
  estado: z.enum(['abierta','cerrada','cancelada']).default('abierta'),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type CajaChica = z.infer<typeof cajaChicaSchema>;