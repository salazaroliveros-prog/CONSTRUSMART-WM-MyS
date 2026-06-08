import { z } from 'zod';

export const movimientoSchema = z.object({
  id: z.string(),
  proyectoId: z.string().nullable().optional(),
  tipo: z.enum(['ingreso','gasto','egreso'] as const).default('gasto'),
  categoria: z.string().default('materiales'),
  monto: z.number().default(0),
  costoTotal: z.number().nullable().optional(),
  costoUnitario: z.number().nullable().optional(),
  cantidad: z.number().nullable().optional(),
  unidad: z.string().nullable().optional(),
  descripcion: z.string().default(''),
  fecha: z.string(),
  proveedor: z.string().nullable().optional(),
  proveedorNit: z.string().nullable().optional(),
  factura: z.string().nullable().optional(),
  formaPago: z.enum(['efectivo','transferencia','cheque','tarjeta','otro'] as const).nullable().optional(),
  referenciaBancaria: z.string().nullable().optional(),
  retencionIsr: z.number().nullable().optional(),
  retencionIva: z.number().nullable().optional(),
  notas: z.string().nullable().optional(),
}).transform(d => ({ ...d, proveedor: d.proveedor ?? undefined }));

export const cuentaCobrarSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  cliente: z.string().default(''),
  concepto: z.string().default(''),
  monto: z.number().default(0),
  saldoPendiente: z.number().default(0),
  fechaEmision: z.string().default(new Date().toISOString().split('T')[0]),
  fechaVencimiento: z.string(),
  fechaCobro: z.string().nullable().optional(),
  estado: z.enum(['pendiente','parcial','cobrado','vencido','incobrable'] as const).default('pendiente'),
  notas: z.string().nullable().optional(),
});

export const cuentaPagarSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  proveedor: z.string().default(''),
  concepto: z.string().default(''),
  monto: z.number().default(0),
  saldoPendiente: z.number().default(0),
  fechaEmision: z.string().default(new Date().toISOString().split('T')[0]),
  fechaVencimiento: z.string(),
  fechaPago: z.string().nullable().optional(),
  estado: z.enum(['pendiente','parcial','pagado','vencido'] as const).default('pendiente'),
  facturaUrl: z.string().nullable().optional(),
});

export const ordenCambioSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  titulo: z.string().default(''),
  descripcion: z.string().default(''),
  impactoCosto: z.number().default(0),
  impactoPlazo: z.number().default(0),
  estado: z.enum(['solicitud','revision','aprobado','rechazado'] as const).default('solicitud'),
  solicitante: z.string().default(''),
  solicitanteRol: z.string().default(''),
  aprobador: z.string().nullable().optional(),
  fechaAprobacion: z.string().nullable().optional(),
  createdAt: z.string().default(new Date().toISOString()),
});