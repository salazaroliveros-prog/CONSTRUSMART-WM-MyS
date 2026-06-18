import { z } from 'zod';

export const valeSalidaItemSchema = z.object({
  materialId: z.string(),
  cantidad: z.number(),
});

export const valeSalidaSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  renglonId: z.string().optional(),
  fecha: z.string(),
  items: z.array(valeSalidaItemSchema),
  observaciones: z.string().optional(),
  solicitante: z.string(),
});

export const materialSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  unidad: z.string(),
  stock: z.number(),
  stockMinimo: z.number(),
  precio: z.number(),
  categoria: z.string(),
  proyectoIds: z.array(z.string()).default([]),
  cantidadPresupuestada: z.number().optional(),
  costoPresupuestado: z.number().optional(),
}).transform(d => ({
  ...d,
  critico: (d.stock ?? 0) <= (d.stockMinimo ?? 0),
  version: d.version ?? 1,
  ultimaActualizacionPresupuesto: d.ultimaActualizacionPresupuesto ?? new Date().toISOString(),
}));

export const ordenSchema = z.object({
  id: z.string(),
  proyectoId: z.string().nullable().optional(),
  proveedor: z.string().default(''),
  material: z.string().default(''),
  cantidad: z.number().default(0),
  monto: z.number().default(0),
  fecha: z.string(),
  estado: z.enum(['borrador', 'pendiente', 'aprobado', 'recibida', 'rechazada', 'cancelada'] as const).default('pendiente'),
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
  nombre: z.string(),
  contacto: z.string().nullable().optional().default(''),
  rubro: z.string().nullable().optional(),
  calificacion: z.number().nullable().optional(),
  telefono: z.string().optional().default(''),
  email: z.string().optional().default(''),
  categoria: z.string().optional().default('materiales'),
}).transform(d => ({
  ...d,
  contacto: d.contacto ?? '',
  telefono: d.telefono ?? '',
  email: d.email ?? '',
  categoria: (d.categoria ?? 'materiales') as import('@/erp/types').Categoria,
}));