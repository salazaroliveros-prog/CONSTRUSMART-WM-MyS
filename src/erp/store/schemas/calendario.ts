import { z } from 'zod';
import { hitoSchema } from './seguimiento';

export const eventoSchema = z.object({
  id: z.string(),
  proyectoId: z.string().min(1, 'proyectoId es requerido'),
  titulo: z.string().default(''),
  fecha: z.string(),
  hora: z.string().nullable().optional().default(''),
  tipo: z.string().nullable().optional().default('otros'),
  descripcion: z.string().nullable().optional(),
  completado: z.boolean().nullable().optional(),
  participantes: z.array(z.string()).optional().default([]),
  createdAt: z.string().default(new Date().toISOString()),
});

export const bitacoraSchema = z.object({
  id: z.string(),
  proyectoId: z.string().min(1, 'proyectoId es requerido'),
  fecha: z.string(),
  clima: z.string().nullable().optional().default('soleado'),
  temperatura: z.number().nullable().optional(),
  humedad: z.number().nullable().optional(),
  vientoVelocidad: z.number().nullable().optional(),
  condicionClimatica: z.string().nullable().optional(),
  personal: z.number().nullable().optional().default(0),
  personalPresente: z.number().optional().default(0),
  maquinaria: z.string().nullable().optional().default(''),
  tareas: z.string().nullable().optional().default(''),
  tareasRealizadas: z.string().optional().default(''),
  observaciones: z.string().nullable().optional().default(''),
  fotos: z.array(z.string()).optional().default([]),
  firma: z.string().nullable().optional(),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
  weatherDataCaptured: z.boolean().nullable().optional(),
  weatherDataTimestamp: z.string().nullable().optional(),
  createdAt: z.string().default(new Date().toISOString()),
});

export const hitoFormSchema = hitoSchema.omit({ id: true, estado: true, dependeDe: true, completadoEn: true, createdAt: true });
