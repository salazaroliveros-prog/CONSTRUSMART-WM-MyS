import { z } from 'zod';

export const bodegaSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  materialId: z.string().optional(),
  codigo: z.string(),
  nombre: z.string(),
  categoria: z.string().optional(),
  unidad: z.string(),
  stock: z.number().default(0),
  stockMinimo: z.number().default(0),
  ubicacion: z.string().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Bodega = z.infer<typeof bodegaSchema>;