import { z } from 'zod';

export const amortizacionSchema = z.object({
  id: z.string(),
  anticipoId: z.string(),
  monto: z.number(),
  fecha: z.string(),
  metodo: z.enum(['mensual','trimestral','anual']).default('mensual'),
  numeroCuota: z.number(),
  observaciones: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Amortizacion = z.infer<typeof amortizacionSchema>;