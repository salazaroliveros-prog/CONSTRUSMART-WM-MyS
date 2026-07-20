import { z } from 'zod';

export const documentoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  tipo: z.string(),
  nombre: z.string(),
  url: z.string(),
  tamanoBytes: z.number().optional(),
  subidoPor: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Documento = z.infer<typeof documentoSchema>;