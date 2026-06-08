import { z } from 'zod';

export const empleadoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  puesto: z.string(),
  salarioDiario: z.number(),
  tipo: z.enum(['planilla','destajo'] as const).default('planilla'),
  activo: z.boolean().default(true),
  proyectoIds: z.array(z.string()).default([]),
  telefono: z.string().nullable().optional(),
  diasTrabajados: z.number().nullable().optional(),
});

export const incidenteSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  tipo: z.enum(['accidente','cuasi-accidente','condicion_insegura','acto_inseguro'] as const).default('acto_inseguro'),
  fecha: z.string(),
  hora: z.string().default('00:00'),
  descripcion: z.string().default(''),
  afectados: z.string().default(''),
  testigos: z.string().nullable().optional(),
  accionesInmediatas: z.string().nullable().optional(),
  reportadoPor: z.string().default(''),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  fotos: z.array(z.string()).default([]),
  estado: z.enum(['abierto','investigacion','cerrado'] as const).default('abierto'),
});