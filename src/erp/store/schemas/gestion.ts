import { z } from 'zod';

export const activoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  nombre: z.string().default(''),
  codigoInventario: z.string().default(''),
  tipo: z.enum(['herramienta','equipo','vehiculo','accesorio'] as const).default('herramienta'),
  estado: z.enum(['disponible','asignado','mantenimiento','dado_baja'] as const).default('disponible'),
  valorAdquisicion: z.number().default(0),
  fechaAdquisicion: z.string().default(new Date().toISOString().split('T')[0]),
  proveedorId: z.string().nullable().optional(),
  proveedorNombre: z.string().default(''),
  asignadoA: z.string().default(''),
  observaciones: z.string().default(''),
});

export const licitacionSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  cliente: z.string(),
  monto: z.number(),
  fechaLimite: z.string().optional().default(''),
  estado: z.enum(['activa','adjudicada','perdida','cerrada'] as const).default('activa'),
  probabilidad: z.number().default(50),
  documentos: z.array(z.object({ nombre: z.string(), url: z.string() })).optional().default([]),
  notas: z.string().optional(),
  createdAt: z.string().default(''),
});

export const cuadroSchema = z.object({
  id: z.string(),
  proyectoId: z.string().optional(),
  solicitud: z.string().default(''),
  fechaSolicitud: z.string().default(new Date().toISOString().split('T')[0]),
  fechaCierre: z.string().nullable().optional(),
  estado: z.enum(['abierto','cerrado','adjudicado'] as const).default('abierto'),
  adjudicadoA: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  cotizacionesNegocio: z.array(z.object({
    id: z.string(),
    proyectoId: z.string().optional().default(''),
    tipo: z.enum(['construccion','planos_registro','estudio_planificacion','diseno_urbanistico','anteproyecto_residencial'] as const),
    numero: z.string().default(''),
    fecha: z.string().default(''),
    fechaVencimiento: z.string().optional().default(''),
    clienteNombre: z.string().default(''),
    clienteNit: z.string().optional().default(''),
    clienteTelefono: z.string().optional().default(''),
    clienteEmail: z.string().optional().default(''),
    clienteDireccion: z.string().optional().default(''),
    descripcion: z.string().default(''),
    alcance: z.string().default(''),
    renglones: z.array(z.any()).default([]),
    costoDirectoTotal: z.number().default(0),
    precioVentaTotal: z.number().default(0),
    estado: z.enum(['borrador','enviada','aprobada','rechazada','vencida'] as const).default('borrador'),
    notas: z.string().optional().default(''),
    createdAt: z.string().default(''),
    updatedAt: z.string().default(''),
  })).default([]),
});

export const pagoProveedorSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  proveedorId: z.string().default(''),
  proveedorNombre: z.string().default(''),
  monto: z.number().default(0),
  concepto: z.string().default(''),
  fechaEmision: z.string().default(new Date().toISOString().split('T')[0]),
  fechaVencimiento: z.string().default(new Date().toISOString().split('T')[0]),
  fechaPago: z.string().nullable().optional(),
  estado: z.enum(['pendiente','pagado','vencido','cancelado'] as const).default('pendiente'),
  facturaUrl: z.string().nullable().optional(),
});

export const planoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  nombre: z.string().default(''),
  disciplina: z.enum(['arquitectura','estructura','instalaciones','electricas','sanitarias','mecanicas','otra'] as const).default('arquitectura'),
  version: z.string().default('1.0'),
  estado: z.enum(['borrador','vigente','obsoleto'] as const).default('borrador'),
  archivoUrl: z.string().default(''),
  subidoPor: z.string().default(''),
  fechaSubida: z.string().default(new Date().toISOString().split('T')[0]),
  revision: z.number().default(0),
});

export const rfiSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  numero: z.string().default(''),
  titulo: z.string().default(''),
  descripcion: z.string().default(''),
  solicitante: z.string().default(''),
  destino: z.string().default(''),
  estado: z.enum(['abierto','en_respuesta','cerrado'] as const).default('abierto'),
  fechaSolicitud: z.string().default(new Date().toISOString().split('T')[0]),
  respuesta: z.string().nullable().optional(),
  fechaRespuesta: z.string().nullable().optional(),
});

export const destajoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  renglonCodigo: z.string(),
  cuadrilla: z.string(),
  fecha: z.string(),
  cantidadEjecutada: z.number(),
  unidad: z.string(),
  horasTrabajadas: z.number(),
  rendimientoReal: z.number().default(0),
  rendimientoTeorico: z.number().default(0),
  observaciones: z.string().optional().default(''),
});

export const recepcionAlmacenSchema = z.object({
  id: z.string(),
  ocId: z.string(),
  fecha: z.string(),
  cantidadRecibida: z.number(),
  cantidadOC: z.number(),
  diferencia: z.number(),
  material: z.string(),
  proveedor: z.string(),
});

export const submittalSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  titulo: z.string().default(''),
  categoria: z.enum(['material','equipo','especificacion','otro'] as const).default('otro'),
  proveedor: z.string().default(''),
  fechaEnvio: z.string().default(new Date().toISOString().split('T')[0]),
  estado: z.enum(['pendiente','aprobado','rechazado','con_comentarios'] as const).default('pendiente'),
});