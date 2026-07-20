import { z } from 'zod';

export const configuracionSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  nombre: z.string(),
  valor: z.string(),
  tipo: z.enum(['texto','numero','booleano','json']).default('texto'),
  descripcion: z.string().optional(),
  updatedBy: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Configuracion = z.infer<typeof configuracionSchema>;