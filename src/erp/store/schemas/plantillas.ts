import { z } from 'zod';

const renglonTemplateSchema = z.object({
  codigo: z.string().default(''),
  nombre: z.string().default(''),
  unidad: z.string().default(''),
  cantidad: z.number().default(0),
  costoMateriales: z.number().default(0),
  costoManoObra: z.number().default(0),
  costoEquipo: z.number().default(0),
  costoSubcontrato: z.number().default(0),
  descripcion: z.string().optional().default(''),
});

const hitoTemplateSchema = z.object({
  nombre: z.string().default(''),
  descripcion: z.string().optional().default(''),
  diasDesdeInicio: z.number().default(0),
  estado: z.enum(['pendiente', 'en_proceso', 'completado', 'retrasado']).default('pendiente'),
});

const riesgoTemplateSchema = z.object({
  categoria: z.string().default(''),
  descripcion: z.string().default(''),
  nivel: z.enum(['bajo', 'medio', 'alto']).default('medio'),
  mitigation: z.string().optional().default(''),
});

const checklistItemSchema = z.object({
  categoria: z.string().default(''),
  item: z.string().default(''),
  requerido: z.boolean().default(true),
});

const plantillaMetricasSchema = z.object({
  proyectoIds: z.array(z.string()).default([]),
  proyectosCompletados: z.number().default(0),
  proyectosActivos: z.number().default(0),
  proyectosPausados: z.number().default(0),
  avgAvanceProyectos: z.number().default(0),
  avgMargenProyectos: z.number().default(0),
  ultimaUso: z.string().optional().default(''),
  exitoPromedio: z.number().min(0).max(100).default(50),
});

const versionHistorialSchema = z.object({
  version: z.number(),
  fecha: z.string(),
  usuario: z.string().default('sistema'),
  cambios: z.string(),
  snapshot: z.any().optional(),
});

export const plantillaSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, 'Nombre requerido').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().max(500).optional().default(''),
  categoria: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']).default('residencial'),
  proyectoOrigenId: z.string().optional().default(''),
  clienteId: z.string().optional().default(''),
  clienteNombre: z.string().optional().default(''),
  activa: z.boolean().default(true),
  favorita: z.boolean().default(false),
  configuracion: z.object({
    tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']).default('residencial'),
    tipoObra: z.enum(['nueva', 'remodelacion', 'ampliacion']).default('nueva'),
    factorSobrecosto: z.object({
      indirectos: z.number().default(0),
      administracion: z.number().default(0),
      imprevistos: z.number().default(0),
      utilidad: z.number().default(0),
    }).optional(),
    moneda: z.enum(['GTQ', 'USD']).default('GTQ'),
  }).optional(),
  estructuraPresupuesto: z.array(renglonTemplateSchema).default([]),
  hitosTemplate: z.array(hitoTemplateSchema).default([]),
  riesgosTemplate: z.array(riesgoTemplateSchema).default([]),
  checklistCalidad: z.array(checklistItemSchema).default([]),
  usosCount: z.number().default(0),
  metricas: plantillaMetricasSchema.optional(),
  version: z.number().default(1),
  versionHistorial: z.array(versionHistorialSchema).default([]),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
  creadoPor: z.string().optional().default(''),
});

export type Plantilla = z.infer<typeof plantillaSchema>;
export type PlantillaStore = Plantilla[];
