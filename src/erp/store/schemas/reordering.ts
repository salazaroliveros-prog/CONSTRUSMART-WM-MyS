import { z } from 'zod';

export const consumoHistoricoSchema = z.object({
  materialId: z.string(),
  proyectoId: z.string(),
  fecha: z.string(),
  cantidad: z.number(),
  fuente: z.enum(['vale_salida', 'recepcion_almacen', 'orden_compra'] as const).default('vale_salida'),
});

export const patronConsumoSchema = z.object({
  materialId: z.string(),
  proyectoId: z.string(),
  consumoPromedioDiario: z.number(),
  consumoPromedioSemanal: z.number(),
  consumoPromedioMensual: z.number(),
  variabilidad: z.number(),
  tendencia: z.enum(['creciente', 'estable', 'decreciente'] as const).default('estable'),
  picoConsumoMes: z.number().optional(),
  picoConsumoCantidad: z.number().optional(),
  ultimoAnalisis: z.string(),
});

export const proveedorLeadTimeSchema = z.object({
  proveedorId: z.string(),
  materialId: z.string().optional(),
  leadTimePromedio: z.number(),
  leadTimeMinimo: z.number(),
  leadTimeMaximo: z.number(),
  confiabilidad: z.number(),
  totalOrdenes: z.number(),
  ultimaActualizacion: z.string(),
});

export const reorderSuggestionSchema = z.object({
  id: z.string(),
  materialId: z.string(),
  materialNombre: z.string(),
  proyectoId: z.string(),
  proyectoNombre: z.string(),
  stockActual: z.number(),
  stockMinimo: z.number(),
  stockMaximo: z.number().optional(),
  puntoReorden: z.number(),
  cantidadSugerida: z.number(),
  urgencia: z.enum(['critica', 'alta', 'media', 'baja'] as const).default('media'),
  prioridad: z.number().default(0),
  fechaEstimadaAgotamiento: z.string(),
  leadTimeDias: z.number(),
  costoTotalEstimado: z.number(),
  proveedorSugeridoId: z.string().optional(),
  proveedorSugeridoNombre: z.string().optional(),
  patronConsumo: patronConsumoSchema.optional(),
  justificacion: z.string().optional(),
  ahorroPotencial: z.number().optional(),
  estado: z.enum(['pendiente', 'sugerida', 'aprobada', 'rechazada', 'ordenada'] as const).default('pendiente'),
  fechaSugerencia: z.string().default(() => new Date().toISOString()),
  fechaRevision: z.string().optional(),
  revisadoPor: z.string().optional(),
  notas: z.string().optional(),
});

export const reorderConfigSchema = z.object({
  id: z.string(),
  proyectoId: z.string().optional(),
  materialId: z.string().optional(),
  habilitado: z.boolean().default(true),
  metodoCalculo: z.enum(['eoq', 'consumo_promedio', 'manual', 'hbrp'] as const).default('consumo_promedio'),
  stockSeguridadDias: z.number().default(7),
  stockMaximoMultiplo: z.number().default(2),
  umbralUrgenciaCritica: z.number().default(3),
  umbralUrgenciaAlta: z.number().default(7),
  umbralUrgenciaMedia: z.number().default(14),
  costoOrdenamiento: z.number().default(50),
  costoAlmacenamiento: z.number().default(0.1),
  autoaprobarUrgenciaCritica: z.boolean().default(false),
  proveedorPreferidoId: z.string().optional(),
  ultimaActualizacion: z.string().default(() => new Date().toISOString()),
});

export type ConsumoHistorico = z.infer<typeof consumoHistoricoSchema>;
export type PatronConsumo = z.infer<typeof patronConsumoSchema>;
export type ProveedorLeadTime = z.infer<typeof proveedorLeadTimeSchema>;
export type ReorderSuggestion = z.infer<typeof reorderSuggestionSchema>;
export type ReorderConfig = z.infer<typeof reorderConfigSchema>;

export type ReorderStore = {
  consumoHistorico: ConsumoHistorico[];
  patronConsumo: PatronConsumo[];
  proveedorLeadTime: ProveedorLeadTime[];
  reorderSuggestions: ReorderSuggestion[];
  reorderConfig: ReorderConfig[];
};

export const reorderStoreDefaults: ReorderStore = {
  consumoHistorico: [],
  patronConsumo: [],
  proveedorLeadTime: [],
  reorderSuggestions: [],
  reorderConfig: [],
};
