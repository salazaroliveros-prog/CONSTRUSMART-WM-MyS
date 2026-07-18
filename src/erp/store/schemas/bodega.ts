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
  proyectoId: z.string().min(1, 'proyectoId es requerido'),
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
  estado: z.enum(['borrador', 'pendiente', 'aprobado', 'recibida', 'rechazado', 'cancelada'] as const).default('pendiente'),
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

export const ordenFormSchema = ordenSchema.omit({ id: true, fecha: true, estado: true, total: true, items: true, stockActualizado: true, version: true }).extend({
  proveedor: z.string().min(1, 'Proveedor requerido'),
  proveedorId: z.string().optional().default(''),
  material: z.string().min(1, 'Material requerido'),
  categoria: z.string().optional().default('materiales'),
  cantidad: z.coerce.number().min(1, 'Cantidad requerida'),
  monto: z.coerce.number().min(0, 'Monto requerido'),
  proyectoId: z.string().optional().default(''),
});