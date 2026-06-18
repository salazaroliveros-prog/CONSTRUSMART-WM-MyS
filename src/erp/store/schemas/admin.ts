import { z } from 'zod';

export const centroCostoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  codigo: z.string(),
  nombre: z.string(),
  presupuestoAsignado: z.number().default(0),
  gastoActual: z.number().default(0),
  tipo: z.enum(['directo', 'indirecto', 'administrativo'] as const).default('directo'),
});