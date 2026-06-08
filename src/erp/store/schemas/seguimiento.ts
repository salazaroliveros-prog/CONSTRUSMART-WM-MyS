import { z } from 'zod';

export const seguimientoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  fecha: z.string(),
  avanceFisico: z.number().default(0),
  avanceFinanciero: z.number().default(0),
  costoPlaneado: z.number().default(0),
  costoReal: z.number().default(0),
  valorPlaneado: z.number().default(0),
  valorGanado: z.number().default(0),
  cv: z.number().nullable().optional(),
  sv: z.number().nullable().optional(),
  createdAt: z.string().default(new Date().toISOString()),
});

export const hitoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  nombre: z.string().default(''),
  descripcion: z.string().default(''),
  fecha: z.string(),
  tipo: z.enum(['inicio','hito','entrega','cierre'] as const).default('hito'),
  estado: z.enum(['pendiente','completado','retrasado'] as const).default('pendiente'),
  responsable: z.string().default(''),
  dependeDe: z.array(z.string()).optional().default([]),
  completadoEn: z.string().nullable().optional(),
});

export const riesgoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  nombre: z.string().default(''),
  descripcion: z.string().default(''),
  tipo: z.enum(['tecnico','financiero','cronograma','legal','ambiental','seguridad','otro'] as const).default('tecnico'),
  probabilidad: z.number().min(1).max(5).default(1),
  impacto: z.number().min(1).max(5).default(1),
  nivel: z.enum(['bajo','medio','alto','critico'] as const).default('bajo'),
  planMitigacion: z.string().optional(),
  planContingencia: z.string().optional(),
  responsable: z.string().optional(),
  fechaIdentificacion: z.string().default(new Date().toISOString().split('T')[0]),
  estado: z.enum(['identificado','en_mitigacion','mitigado','materializado'] as const).default('identificado'),
  costoSoporte: z.number().optional(),
  createdAt: z.string().default(new Date().toISOString()),
});