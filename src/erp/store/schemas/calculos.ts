import { z } from 'zod';

export const calculoProyectoSchema = z.object({
  id: z.string(),
  proyectoId: z.string().min(1),
  tipoCalcululo: z.enum(['apu', 'dosificacion', 'acero', 'movimiento_tierra', 'pavimento', 'red_infraestructura', 'muro_contencion', 'climaticos'] as const).default('apu'),
  fechaCalcululo: z.string().optional(),
  usuarioId: z.string().optional(),
  parametros: z.record(z.unknown()).default({}),
  resultados: z.record(z.unknown()).default({}),
  versionCalculculo: z.number().optional(),
  origenCalcululo: z.enum(['manual', 'automatico', 'importado'] as const).optional(),
  observaciones: z.string().optional(),
  validado: z.boolean().optional(),
  validadoPor: z.string().optional(),
  fechaValidacion: z.string().optional(),
  notasValidacion: z.string().optional(),
});

export const snapshotCalculoSchema = z.object({
  id: z.string(),
  calculoId: z.string(),
  nombre: z.string(),
  parametrosSnapshot: z.record(z.unknown()).default({}),
  resultadosSnapshot: z.record(z.unknown()).default({}),
  version: z.number().default(1),
  createdAt: z.string(),
});

export const comparacionCalculosSchema = z.object({
  id: z.string(),
  calculoBaseId: z.string(),
  calculoComparadoId: z.string(),
  fechaComparacion: z.string().optional(),
  diferencias: z.record(z.unknown()).default({}),
  tipoCambio: z.string().optional(),
  magnitudCambio: z.number().optional(),
  porcentajeCambio: z.number().optional(),
  aceptado: z.boolean().optional(),
  motivoRechazo: z.string().optional(),
});

export const historialAplicacionReglaSchema = z.object({
  id: z.string(),
  proyecto_id: z.string().optional(),
  renglon_id: z.string().optional(),
  regla_id: z.string(),
  valor_original: z.number(),
  valor_aplicado: z.number(),
  factor_aplicado: z.number(),
  contexto_aplicacion: z.record(z.unknown()).default({}),
  usuario_id: z.string().optional(),
  fecha_aplicacion: z.string().optional(),
  created_at: z.string().optional(),
});

export const reglaFactorSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string().optional(),
  tipo_factor: z.enum(['zona', 'tipologia', 'escalas', 'estacional', 'climatico', 'normativa', 'sobrecosto'] as const),
  prioridad: z.number(),
  condicion: z.record(z.unknown()).default({}),
  factor_aplicacion: z.number(),
  operador: z.enum(['multiplicar', 'sumar', 'restar', 'porcentaje'] as const),
  ambito: z.enum(['global', 'departamento', 'municipio', 'proyecto', 'renglon'] as const),
  departamento_id: z.string().optional(),
  municipio_id: z.string().optional(),
  tipologia: z.string().optional(),
  activo: z.boolean().default(true),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const normativaDepartamentalSchema = z.object({
  id: z.string(),
  departamento_codigo: z.string().optional(),
  tipo_norma: z.string().optional(),
  codigo_norma: z.string(),
  nombre_norma: z.string(),
  descripcion: z.string().optional(),
  ano_ultima_revision: z.number().optional(),
  organismo_emisor: z.string().optional(),
  requisitos_especificos: z.record(z.unknown()).default({}),
  aplicacion: z.string().optional(),
  activo: z.boolean().default(true),
});

export const escalaProduccionSchema = z.object({
  id: z.string(),
  tipo_proyecto: z.string(),
  rango_tamano: z.string(),
  tamano_minimo: z.number().optional(),
  tamano_maximo: z.number().optional(),
  factor_economia: z.number(),
  factor_administracion: z.number(),
  factor_imprevistos: z.number(),
  factor_logistica: z.number().optional(),
  factor_financiero: z.number().optional(),
  factor_total: z.number().optional(),
  descripcion: z.string().optional(),
  activo: z.boolean().default(true),
});

export const estacionalidadSchema = z.object({
  id: z.string(),
  departamento_codigo: z.string(),
  mes: z.number().min(1).max(12),
  temporada: z.string(),
  factor_disponibilidad: z.number(),
  factor_costo: z.number(),
  factor_productividad: z.number(),
  factor_especifico: z.number().optional(),
  condiciones_especiales: z.string().optional(),
  restricciones_especiales: z.array(z.unknown()).optional(),
  riesgos_estacionales: z.array(z.unknown()).optional(),
  activo: z.boolean().default(true),
});

export const ajusteEstacionalActividadSchema = z.object({
  id: z.string(),
  estacionalidad_id: z.string().min(1),
  tipo_actividad: z.string().min(1),
  factor_especifico: z.number().default(1.0),
  impacto_duracion: z.number().int().optional(),
  recomendaciones: z.array(z.string()).optional(),
  medidas_mitigacion: z.array(z.string()).optional(),
  activo: z.boolean().default(true),
});

export const aplicacionEscalaSchema = z.object({
  id: z.string(),
  proyecto_id: z.string().min(1),
  escala_id: z.string().min(1),
  tamano_proyecto: z.number().optional(),
  presupuesto_estimado: z.number().optional(),
  cantidad_renglones: z.number().int().optional(),
  factor_economia_aplicado: z.number().optional(),
  factor_administracion_aplicado: z.number().optional(),
  factor_imprevistos_aplicado: z.number().optional(),
  factor_logistica_aplicado: z.number().optional(),
  factor_financiero_aplicado: z.number().optional(),
  factor_total: z.number().optional(),
  costo_ajustado: z.number().optional(),
  ahorro_estimado: z.number().optional(),
  usuario_aplicacion: z.string().optional(),
  fecha_aplicacion: z.string().optional(),
  observaciones: z.string().optional(),
});

export const cumplimientoNormativoSchema = z.object({
  id: z.string(),
  proyecto_id: z.string().min(1),
  norma_id: z.string().min(1),
  estado_cumplimiento: z.string().optional(),
  fecha_verificacion: z.string().optional(),
  responsable_verificacion: z.string().optional(),
  evidencias_cumplimiento: z.record(z.unknown()).default({}),
  observaciones: z.string().optional(),
  requiere_acciones_correctivas: z.boolean().default(false),
  acciones_correctivas: z.array(z.string()).optional(),
  fecha_limite_correccion: z.string().optional(),
});

export type AjusteEstacionalActividad = z.infer<typeof ajusteEstacionalActividadSchema>;
export type AplicacionEscala = z.infer<typeof aplicacionEscalaSchema>;
export type CumplimientoNormativo = z.infer<typeof cumplimientoNormativoSchema>;

export type CalculoProyecto = z.infer<typeof calculoProyectoSchema>;
export type SnapshotCalculo = z.infer<typeof snapshotCalculoSchema>;
export type ComparacionCalculos = z.infer<typeof comparacionCalculosSchema>;
export type HistorialAplicacionRegla = z.infer<typeof historialAplicacionReglaSchema>;
export type ReglaFactorSchema = z.infer<typeof reglaFactorSchema>;
export type NormativaDepartamentalSchema = z.infer<typeof normativaDepartamentalSchema>;
export type EscalaProduccionSchema = z.infer<typeof escalaProduccionSchema>;
export type EstacionalidadSchema = z.infer<typeof estacionalidadSchema>;
