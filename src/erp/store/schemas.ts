import { z } from 'zod';

export const proyectoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  ubicacion: z.string(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']),
  presupuestoTotal: z.number().default(0),
  montoContrato: z.number().optional().default(0),
  cliente: z.string().optional().default(''),
  presupuestoActualId: z.string().nullable().optional(),
  fechaInicio: z.string().nullable().optional().default(''),
  fechaFin: z.string().nullable().optional().default(''),
  avanceFisico: z.number().default(0),
  avanceFinanciero: z.number().default(0),
  estado: z.enum(['planeacion', 'ejecucion', 'pausado', 'finalizado']).default('planeacion'),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  factorSobrecosto: z.object({
    indirectos: z.number(), administracion: z.number(),
    imprevistos: z.number(), utilidad: z.number(),
  }).optional(),
  presupuesto: z.number().nullable().optional(),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
}).transform(({ latitud, longitud, ...rest }) => ({
  ...rest,
  lat: rest.lat ?? latitud ?? undefined,
  lng: rest.lng ?? longitud ?? undefined,
  fechaInicio: rest.fechaInicio ?? '',
  fechaFin: rest.fechaFin ?? '',
  presupuestoActualId: rest.presupuestoActualId ?? undefined,
}));

export const movimientoSchema = z.object({
  id: z.string(),
  proyectoId: z.string().nullable().optional().default(''),
  tipo: z.enum(['ingreso', 'gasto', 'egreso']),
  categoria: z.string().default('otros'),
  descripcion: z.string().default(''),
  cantidad: z.number().nullable().optional().default(1),
  unidad: z.string().nullable().optional().default(''),
  costoUnitario: z.number().nullable().optional().default(0),
  costoTotal: z.number().nullable().optional().default(0),
  monto: z.number().optional().default(0),
  fecha: z.string(),
  proveedor: z.string().optional(),
  factura: z.string().nullable().optional(),
}).transform(d => ({
  ...d, proyectoId: d.proyectoId ?? '',
  monto: d.monto || d.costoTotal || 0,
  categoria: (d.categoria as string) || 'otros',
}));

export const empleadoSchema = z.object({
  id: z.string(), nombre: z.string(), puesto: z.string().default(''),
  salarioDiario: z.number().default(0),
  tipo: z.enum(['planilla', 'destajo']).default('planilla'),
  activo: z.boolean().optional().default(true),
  proyectoId: z.string().nullable().optional(),
  proyectoIds: z.array(z.string()).optional().default([]),
  telefono: z.string().nullable().optional(),
  diasTrabajados: z.number().nullable().optional().default(0),
}).transform(d => ({
  ...d, activo: d.activo ?? true,
  proyectoIds: d.proyectoIds?.length ? d.proyectoIds : (d.proyectoId ? [d.proyectoId] : []),
  diasTrabajados: d.diasTrabajados ?? 0,
}));

export const materialSchema = z.object({
  id: z.string(), nombre: z.string(), unidad: z.string().default(''),
  stock: z.number().default(0), stockMinimo: z.number().default(0),
  precio: z.number().default(0),
  critico: z.boolean().nullable().optional().default(false),
  categoria: z.string().optional().default('general'),
  proyectoIds: z.array(z.string()).optional().default([]),
}).transform(d => ({ ...d, critico: d.critico ?? false, categoria: d.categoria ?? 'general', proyectoIds: d.proyectoIds ?? [] }));

export const ordenCompraSchema = z.object({
  id: z.string(),
  proyectoId: z.string().nullable().optional(),
  proveedor: z.string().default(''), material: z.string().default(''),
  cantidad: z.number().default(0), monto: z.number().default(0),
  fecha: z.string(),
  estado: z.string().default('pendiente').transform(e => {
    if (e === 'recibida') return 'aprobado' as const;
    if (e === 'cancelada') return 'cancelada' as const;
    return e as 'pendiente' | 'aprobado' | 'recibida' | 'cancelada';
  }),
  proveedorId: z.string().nullable().optional(),
  total: z.number().optional(),
  items: z.array(z.object({ materialId: z.string(), cantidad: z.number(), precioUnitario: z.number() })).optional(),
});

export const proveedorSchema = z.object({
  id: z.string(), nombre: z.string(),
  contacto: z.string().nullable().optional().default(''),
  rubro: z.string().nullable().optional(),
  calificacion: z.number().nullable().optional(),
  telefono: z.string().optional().default(''),
  email: z.string().optional().default(''),
  categoria: z.string().optional().default('materiales'),
}).transform(d => ({
  ...d, contacto: d.contacto ?? '', telefono: d.telefono ?? '',
  email: d.email ?? '', categoria: (d.categoria ?? 'materiales') as import('../types').Categoria,
}));

export const eventoCalendarioSchema = z.object({
  id: z.string(), proyectoId: z.string().nullable().optional().default(''),
  titulo: z.string().default(''), fecha: z.string(),
  hora: z.string().nullable().optional().default(''),
  tipo: z.string().nullable().optional().default('otros').transform(t => {
    const map: Record<string, string> = { 'Recordatorio': 'otros', 'Actividad': 'otros', 'Reunión': 'reunion', 'Visita': 'inspeccion' };
    return (map[t ?? ''] ?? t ?? 'otros') as 'reunion' | 'inspeccion' | 'entrega' | 'pago' | 'otros';
  }),
  descripcion: z.string().nullable().optional(),
  completado: z.boolean().nullable().optional(),
  participantes: z.array(z.string()).optional().default([]),
}).transform(d => ({ ...d, proyectoId: d.proyectoId ?? '', hora: d.hora ?? '', participantes: d.participantes ?? [] }));

export const bitacoraEntrySchema = z.object({
  id: z.string(), proyectoId: z.string(), fecha: z.string(),
  clima: z.string().nullable().optional().default('soleado').transform(c => (c ?? 'soleado') as 'soleado' | 'nublado' | 'lluvia'),
  personal: z.number().nullable().optional().default(0),
  personalPresente: z.number().optional().default(0),
  maquinaria: z.string().nullable().optional().default(''),
  tareas: z.string().nullable().optional().default(''),
  tareasRealizadas: z.string().optional().default(''),
  observaciones: z.string().nullable().optional().default(''),
  fotos: z.array(z.string()).optional().default([]),
  firma: z.string().nullable().optional(),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
}).transform(d => ({
  ...d, personalPresente: d.personalPresente || d.personal || 0,
  tareasRealizadas: d.tareasRealizadas || d.tareas || '',
  maquinaria: d.maquinaria ?? '', observaciones: d.observaciones ?? '', fotos: d.fotos ?? [],
}));

export const presupuestoSchema = z.object({
  id: z.string(), proyectoId: z.string(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']),
  renglones: z.array(z.record(z.unknown())).default([]),
  estado: z.string().default('borrador').transform(e =>
    (['borrador', 'aprobado', 'revisado', 'rechazado'].includes(e) ? e : 'borrador') as
    'borrador' | 'aprobado' | 'revisado' | 'rechazado'),
  totalCalculado: z.number().default(0),
  costoDirectoTotal: z.number().default(0),
  fechaCreacion: z.string().default(new Date().toISOString()),
  fechaActualizacion: z.string().default(new Date().toISOString()),
  versionPresupuesto: z.number().optional().default(1),
  notas: z.string().nullable().optional(),
});

export const mapFromSnakeCase = <T extends z.ZodType<any, any, any>>(schema: T, obj: Record<string, unknown>): z.infer<T> | null => {
  try {
    const mapped: Record<string, unknown> = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
      mapped[camelKey] = obj[key];
    }
    return schema.parse(mapped);
  } catch (error) {
    console.error('Validation error:', error);
    return null;
  }
};

export const schemas = {
  proyectoSchema, movimientoSchema, empleadoSchema, materialSchema,
  ordenCompraSchema, proveedorSchema, eventoCalendarioSchema,
  bitacoraEntrySchema, presupuestoSchema,
};