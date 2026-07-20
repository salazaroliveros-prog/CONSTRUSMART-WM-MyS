import { z } from 'zod';

export const rendimientoCuadrillaSchema = z.object({
  id: z.string(),
  apuId: z.string(),
  cuadrillaId: z.string(),
  rendimiento: z.number(),
  unidad: z.string(),
  fecha: z.string(),
  observaciones: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type RendimientoCuadrilla = z.infer<typeof rendimientoCuadrillaSchema>;