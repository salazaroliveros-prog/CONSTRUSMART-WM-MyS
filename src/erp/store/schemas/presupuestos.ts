import { z } from 'zod';

export const insumoZ = z.object({
  id: z.string(),
  proyectoId: z.string().min(1, 'proyectoId es requerido'),
  nombre: z.string(),
  nombreMaterial: z.string().optional(),
  unidad: z.string(),
  cantidad: z.number(),
  cantidadUnitaria: z.number().optional(),
  precioUnitario: z.number(),
  precio: z.number().optional(),
  tipo: z.enum(['material', 'mano_obra', 'equipo', 'subcontrato'] as const),
  rendimiento: z.number().optional(),
});

export const subRenglonZ = z.object({
  id: z.string(),
  nombreMaterial: z.string(),
  nombre: z.string().optional(),
  unidad: z.string(),
  cantidadUnitaria: z.number(),
  cantidad: z.number().optional(),
  precioUnitario: z.number(),
  tipo: z.enum(['material', 'mano_obra', 'equipo', 'subcontrato'] as const).optional(),
  rendimiento: z.number().optional(),
});

export const factorSobrecostoZ = z.object({
  indirectos: z.number(),
  administracion: z.number(),
  imprevistos: z.number(),
  utilidad: z.number(),
});

export const renglonPresupuestoZ = z.object({
  id: z.string(),
  proyectoId: z.string().min(1, 'proyectoId es requerido'),
  codigo: z.string(),
  nombre: z.string(),
  unidad: z.string(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica'] as const),
  cantidad: z.number(),
  rendimientoCuadrilla: z.number().default(0),
  costoMateriales: z.number().default(0),
  costoManoObra: z.number().default(0),
  costoEquipo: z.number().default(0),
  insumos: z.array(insumoZ).default([]),
  subRenglones: z.array(subRenglonZ).optional().default([]),
  factorSobrecosto: factorSobrecostoZ.optional(),
  totalCD: z.number().optional(),
  totalPV: z.number().optional(),
  avanceFisico: z.number().optional(),
  avanceFinanciero: z.number().optional(),
  predecesores: z.array(z.string()).optional().default([]),
});

export const presupuestoSchema = z.object({
  id: z.string(),
  proyectoId: z.string().min(1, 'proyectoId es requerido'),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica'] as const),
  renglones: z.array(renglonPresupuestoZ).default([]),
  estado: z.enum(['borrador','aprobado','revisado','rechazado','anulado'] as const).default('borrador'),
  totalCalculado: z.number().default(0),
  costoDirectoTotal: z.number().default(0),
  fechaCreacion: z.string().default(new Date().toISOString()),
  fechaActualizacion: z.string().default(new Date().toISOString()),
  versionPresupuesto: z.number().optional().default(1),
  notas: z.string().nullable().optional(),
});

export const cotizacionSchema = z.object({
  id: z.string(),
  proyectoId: z.string().min(1, 'proyectoId es requerido'),
  tipo: z.enum(['construccion','planos_registro','estudio_planificacion','diseno_urbanistico','anteproyecto_residencial'] as const),
  numero: z.string().default(''),
  fecha: z.string().default(''),
  fechaVencimiento: z.string().nullable().optional().default(''),
  clienteNombre: z.string().default(''),
  clienteNit: z.string().nullable().optional().default(''),
  clienteTelefono: z.string().nullable().optional().default(''),
  clienteEmail: z.string().nullable().optional().default(''),
  clienteDireccion: z.string().nullable().optional().default(''),
  descripcion: z.string().default(''),
  alcance: z.string().default(''),
  renglones: z.array(renglonPresupuestoZ).default([]),
  costoDirectoTotal: z.number().default(0),
  precioVentaTotal: z.number().default(0),
  estado: z.enum(['borrador','enviada','aprobada','rechazada','vencida'] as const).default('borrador'),
  notas: z.string().nullable().optional(),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString()),
});