import { z } from 'zod';

export const valeSalidaItemSchema = z.object({
  materialId: z.string(),
  cantidad: z.number(),
});

export const valeSalidaSchema = z.object({
  id: z.string(),
  proyectoId: z.string().min(1, 'proyectoId es requerido'),
  renglonId: z.string().optional(),
  fecha: z.string(),
  items: z.array(valeSalidaItemSchema),
  observaciones: z.string().optional(),
  solicitante: z.string(),
});

export const materialSchema = z.object({
  id: z.string(),
  proyectoId: z.string().optional().default(''),
  nombre: z.string(),
  unidad: z.string(),
  stock: z.number(),
  stockMinimo: z.number(),
  precio: z.number(),
  categoria: z.string(),
  proyectoIds: z.array(z.string()).default([]),
  cantidadPresupuestada: z.number().optional(),
  costoPresupuestado: z.number().optional(),
  version: z.number().optional(),
  ultimaActualizacionPresupuesto: z.string().optional(),
}).transform(d => ({
  ...d,
  version: d.version ?? 1,
  critico: (d.stock ?? 0) <= (d.stockMinimo ?? 0),
}));

export const ordenSchema = z.object({
  id: z.string(),
  proyectoId: z.string().min(1, 'proyectoId es requerido'),
  proveedor: z.string().default(''),
  material: z.string().default(''),
  cantidad: z.number().default(0),
  monto: z.number().default(0),
  fecha: z.string(),
  estado: z.enum(['borrador', 'pendiente', 'aprobado', 'recibida', 'rechazada', 'rechazado', 'cancelada'] as const).default('pendiente'),
  proveedorId: z.string().nullable().optional(),
  total: z.number().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    cantidad: z.number(),
    precioUnitario: z.number(),
  })).optional(),
  stockActualizado: z.boolean().optional(),
  version: z.number().optional(),
});

export const proveedorSchema = z.object({
  id: z.string(),
  proyectoId: z.string().optional().default(''),
  nombre: z.string(),
  contacto: z.string().nullable().optional().default(''),
  rubro: z.string().nullable().optional(),
  calificacion: z.number().nullable().optional(),
  telefono: z.string().optional().default(''),
  email: z.string().optional().default(''),
  categoria: z.preprocess(v => {
    if (typeof v === 'string' && !['materiales','mano_obra','equipo','subcontrato','administracion','transporte','imprevistos','marketing','licencias','seguros','otros'].includes(v)) return 'otros';
    return v;
  }, z.enum(['materiales','mano_obra','equipo','subcontrato','administracion','transporte','imprevistos','marketing','licencias','seguros','otros'] as const)).default('materiales'),
}).transform(d => ({
  ...d,
  contacto: d.contacto ?? '',
  telefono: d.telefono ?? '',
  email: d.email ?? '',
}));