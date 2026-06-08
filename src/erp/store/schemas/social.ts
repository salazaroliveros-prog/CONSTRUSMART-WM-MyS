import { z } from 'zod';

export const muroSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  autor: z.string().default(''),
  autorAvatar: z.string().nullable().optional(),
  contenido: z.string().default(''),
  tipo: z.enum(['avance','calidad','seguridad','general'] as const).default('general'),
  fotos: z.array(z.string()).default([]),
  documento: z.object({ nombre: z.string(), url: z.string() }).nullable().optional(),
  createdAt: z.string().default(new Date().toISOString()),
  likes: z.number().default(0),
  comentarios: z.array(z.object({
    id: z.string(),
    autor: z.string(),
    autorAvatar: z.string().nullable().optional(),
    contenido: z.string(),
    createdAt: z.string(),
  })).default([]),
});

export const notificacionSchema = z.object({
  id: z.string(),
  tipo: z.enum(['checklist_rechazado','orden_cambio_pendiente','stock_critico','desviacion_rendimiento','avance_registrado','general'] as const).default('general'),
  titulo: z.string().default(''),
  mensaje: z.string().default(''),
  proyectoId: z.string().nullable().optional(),
  referenciaId: z.string().nullable().optional(),
  leido: z.boolean().default(false),
  createdAt: z.string().default(new Date().toISOString()),
});