import { z } from 'zod';

const nitRegex = /^[0-9]+(-[0-9kK])?$/;
const telefonoGTRegex = /^[+]?(502)?[0-9]{8}$/;
const dpiRegex = /^[0-9]{4}[0-9]{5}[0-9]{4}$/;

export const clienteSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, 'Nombre requerido'),
  nit: z.string().regex(nitRegex, 'NIT inválido (formato: 123456-7)'),
  telefono: z.string().regex(telefonoGTRegex, 'Teléfono inválido (8 dígitos)').optional().default(''),
  email: z.string().email('Email inválido').optional().default(''),
  direccion: z.string().optional().default(''),
  ciudad: z.string().optional().default(''),
});

export const clienteFormSchema = clienteSchema.omit({ id: true });

export const proveedorSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, 'Nombre requerido'),
  nit: z.string().regex(nitRegex, 'NIT inválido (formato: 123456-7)'),
  telefono: z.string().regex(telefonoGTRegex, 'Teléfono inválido (8 dígitos)').optional().default(''),
  email: z.string().email('Email inválido').optional().default(''),
  direccion: z.string().optional().default(''),
  contacto: z.string().optional().default(''),
  plazoPago: z.number().min(0).max(365).optional(),
});

export const proveedorFormSchema = proveedorSchema.omit({ id: true });

export const empleadoFormSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  dpi: z.string().regex(dpiRegex, 'DPI inválido (13 dígitos)').optional().default(''),
  telefono: z.string().regex(telefonoGTRegex, 'Teléfono inválido (8 dígitos)').optional().default(''),
  cargo: z.string().optional().default(''),
  salarioBase: z.number().min(0, 'Salario no puede ser negativo').default(0),
  fechaIngreso: z.string().optional().default(''),
  activo: z.boolean().default(true),
});

export const ordenCambioSchema = z.object({
  id: z.string(),
  proyectoId: z.string().min(1, 'Proyecto requerido'),
  descripcion: z.string().min(1, 'Descripción requerida'),
  monto: z.number().min(0.01, 'Monto debe ser mayor a 0'),
  fechaSolicitud: z.string().min(1, 'Fecha requerida'),
  fechaAprobacion: z.string().optional().default(''),
  estado: z.enum(['pendiente', 'aprobado', 'rechazado', 'ejecutado'] as const).default('pendiente'),
  solicitante: z.string().optional().default(''),
  motivo: z.string().optional().default(''),
});

export const ordenCambioFormSchema = ordenCambioSchema.omit({ id: true });

export const nitSchema = z.string().regex(nitRegex, 'NIT inválido (formato: 123456-7)');
export const telefonoGTSchema = z.string().regex(telefonoGTRegex, 'Teléfono inválido (8 dígitos)');
export const dpiSchema = z.string().regex(dpiRegex, 'DPI inválido (13 dígitos)');