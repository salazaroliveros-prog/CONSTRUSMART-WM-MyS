import { z } from 'zod';

export const liberacionSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  renglonId: z.string().nullable().optional(),
  renglonNombre: z.string().default(''),
  fechaSolicitud: z.string().default(new Date().toISOString().split('T')[0]),
  fechaLiberacion: z.string().nullable().optional(),
  solicitante: z.string().default(''),
  supervisor: z.string().default(''),
  checklistAprobado: z.boolean().nullable().optional(),
  observaciones: z.string().default(''),
  estado: z.enum(['pendiente','liberado','rechazado'] as const).default('pendiente'),
});

export const pruebaSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  tipo: z.enum(['concreto','suelos','acero','asfalto','otro'] as const).default('concreto'),
  descripcion: z.string().default(''),
  fechaMuestra: z.string().default(new Date().toISOString().split('T')[0]),
  fechaResultado: z.string().nullable().optional(),
  resultado: z.enum(['pendiente','pasa','no_pasa'] as const).default('pendiente'),
  responsable: z.string().default(''),
  observaciones: z.string().nullable().optional(),
});

export const noConformidadSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  codigo: z.string().default(''),
  descripcion: z.string().default(''),
  categoria: z.enum(['material','proceso','documentacion','seguridad','otro'] as const).default('otro'),
  fechaDeteccion: z.string().default(new Date().toISOString().split('T')[0]),
  detectadoPor: z.string().default(''),
  planAccion: z.string().default(''),
  responsableCierre: z.string().default(''),
  fechaCierre: z.string().nullable().optional(),
  estado: z.enum(['detectado','plan_accion','cerrado'] as const).default('detectado'),
});