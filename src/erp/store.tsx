import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { sanitizarObjeto } from '@/lib/security';
import { getServerRole } from '@/lib/security';
import { z } from 'zod';
import { toast } from '@/components/ui/sonner';
import {
  Proyecto, Movimiento, Empleado, Material, OrdenCompra, Proveedor, EventoCalendario, BitacoraEntry, Presupuesto, Licitacion, AvanceObra, ValeSalida, Notificacion, OrdenCambio,
} from './types';
import {
  SEED_PROYECTOS, SEED_MOVIMIENTOS, SEED_EMPLEADOS, SEED_MATERIALES, SEED_OC, SEED_PROVEEDORES,
} from './data';

// Zod schemas for validation — alineados con esquema real de Supabase
const proyectoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  ubicacion: z.string(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']),
  // presupuesto_total → presupuestoTotal
  presupuestoTotal: z.number().default(0),
  // monto_contrato → montoContrato
  montoContrato: z.number().optional().default(0),
  cliente: z.string().optional().default(''),
  // presupuesto_actual_id → presupuestoActualId
  presupuestoActualId: z.string().nullable().optional(),
  // fecha_inicio / fecha_fin → fechaInicio / fechaFin
  fechaInicio: z.string().nullable().optional().default(''),
  fechaFin: z.string().nullable().optional().default(''),
  // avance_fisico / avance_financiero
  avanceFisico: z.number().default(0),
  avanceFinanciero: z.number().default(0),
  estado: z.enum(['planeacion', 'ejecucion', 'pausado', 'finalizado']).default('planeacion'),
  // lat / lng (no latitud/longitud en DB)
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  // campos solo locales, no en DB
  factorSobrecosto: z.object({
    indirectos: z.number(),
    administracion: z.number(),
    imprevistos: z.number(),
    utilidad: z.number(),
  }).optional(),
  presupuesto: z.number().nullable().optional(),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
}).transform(d => ({
  ...d,
  // normalizar lat/lng → latitud/longitud para el tipo Proyecto
  latitud: d.latitud ?? d.lat ?? undefined,
  longitud: d.longitud ?? d.lng ?? undefined,
  fechaInicio: d.fechaInicio ?? '',
  fechaFin: d.fechaFin ?? '',
  presupuestoActualId: d.presupuestoActualId ?? undefined,
}));

// erp_movimientos: tipo solo 'ingreso'|'gasto' en DB, monto = costo_total
const movimientoSchema = z.object({
  id: z.string(),
  // proyecto_id → proyectoId (nullable en DB)
  proyectoId: z.string().nullable().optional().default(''),
  tipo: z.enum(['ingreso', 'gasto', 'egreso']),
  categoria: z.string().default('otros'),
  descripcion: z.string().default(''),
  cantidad: z.number().nullable().optional().default(1),
  unidad: z.string().nullable().optional().default(''),
  // costo_unitario → costoUnitario
  costoUnitario: z.number().nullable().optional().default(0),
  // costo_total → se mapea como monto para compatibilidad interna
  costoTotal: z.number().nullable().optional().default(0),
  // monto no existe en DB: se deriva de costoTotal
  monto: z.number().optional().default(0),
  fecha: z.string(),
  proveedor: z.string().optional(),
  factura: z.string().nullable().optional(),
}).transform(d => ({
  ...d,
  proyectoId: d.proyectoId ?? '',
  // monto = costoTotal si no viene explícito
  monto: d.monto || d.costoTotal || 0,
  categoria: (d.categoria as string) || 'otros',
}));

// erp_empleados: proyecto_id single (no array), sin activo en DB
const empleadoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  puesto: z.string().default(''),
  // salario_diario → salarioDiario
  salarioDiario: z.number().default(0),
  tipo: z.enum(['planilla', 'destajo']).default('planilla'),
  // activo no existe en DB — default true
  activo: z.boolean().optional().default(true),
  // proyecto_id → proyectoIds (adaptamos single → array)
  proyectoId: z.string().nullable().optional(),
  proyectoIds: z.array(z.string()).optional().default([]),
  telefono: z.string().nullable().optional(),
  // dias_trabajados → diasTrabajados
  diasTrabajados: z.number().nullable().optional().default(0),
}).transform(d => ({
  ...d,
  activo: d.activo ?? true,
  // DB tiene proyecto_id single; lo convertimos a array para el frontend
  proyectoIds: d.proyectoIds?.length ? d.proyectoIds : (d.proyectoId ? [d.proyectoId] : []),
  diasTrabajados: d.diasTrabajados ?? 0,
}));

// erp_materiales: sin categoria ni proyectoIds en DB
const materialSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  unidad: z.string().default(''),
  stock: z.number().default(0),
  // stock_minimo → stockMinimo
  stockMinimo: z.number().default(0),
  precio: z.number().default(0),
  critico: z.boolean().nullable().optional().default(false),
  // categoria y proyectoIds no existen en DB — defaults
  categoria: z.string().optional().default('general'),
  proyectoIds: z.array(z.string()).optional().default([]),
}).transform(d => ({
  ...d,
  critico: d.critico ?? false,
  categoria: d.categoria ?? 'general',
  proyectoIds: d.proyectoIds ?? [],
}));

// erp_ordenes_compra: estados DB = borrador|pendiente|aprobado|rechazado
const ordenCompraSchema = z.object({
  id: z.string(),
  // proyecto_id → proyectoId
  proyectoId: z.string().nullable().optional(),
  proveedor: z.string().default(''),
  material: z.string().default(''),
  cantidad: z.number().default(0),
  monto: z.number().default(0),
  fecha: z.string(),
  // estados reales en DB (recibida/cancelada no existen — mapeamos)
  estado: z.string().default('pendiente').transform(e => {
    if (e === 'recibida') return 'aprobado' as const;
    if (e === 'cancelada') return 'cancelada' as const;
    return e as 'pendiente' | 'aprobado' | 'recibida' | 'cancelada';
  }),
  proveedorId: z.string().nullable().optional(),
  total: z.number().optional(),
  items: z.array(z.object({
    materialId: z.string(),
    cantidad: z.number(),
    precioUnitario: z.number(),
  })).optional(),
});

// erp_proveedores: sin telefono, email, categoria en DB
const proveedorSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  contacto: z.string().nullable().optional().default(''),
  rubro: z.string().nullable().optional(),
  calificacion: z.number().nullable().optional(),
  // campos no en DB — defaults
  telefono: z.string().optional().default(''),
  email: z.string().optional().default(''),
  categoria: z.string().optional().default('materiales'),
}).transform(d => ({
  ...d,
  contacto: d.contacto ?? '',
  telefono: d.telefono ?? '',
  email: d.email ?? '',
  categoria: (d.categoria ?? 'materiales') as import('./types').Categoria,
}));

// erp_eventos_calendario: sin participantes en DB
const eventoCalendarioSchema = z.object({
  id: z.string(),
  // proyecto_id → proyectoId
  proyectoId: z.string().nullable().optional().default(''),
  titulo: z.string().default(''),
  fecha: z.string(),
  hora: z.string().nullable().optional().default(''),
  // tipo DB = Recordatorio|Actividad|Reunión|Visita (distinto al tipo TS)
  tipo: z.string().nullable().optional().default('otros').transform(t => {
    const map: Record<string, string> = {
      'Recordatorio': 'otros', 'Actividad': 'otros',
      'Reunión': 'reunion', 'Visita': 'inspeccion',
    };
    return (map[t ?? ''] ?? t ?? 'otros') as 'reunion' | 'inspeccion' | 'entrega' | 'pago' | 'otros';
  }),
  descripcion: z.string().nullable().optional(),
  completado: z.boolean().nullable().optional(),
  // participantes no existe en DB
  participantes: z.array(z.string()).optional().default([]),
}).transform(d => ({
  ...d,
  proyectoId: d.proyectoId ?? '',
  hora: d.hora ?? '',
  participantes: d.participantes ?? [],
}));

// erp_bitacora: personal (no personalPresente), tareas (no tareasRealizadas), sin fotos
const bitacoraEntrySchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  fecha: z.string(),
  clima: z.string().nullable().optional().default('soleado').transform(c =>
    (c ?? 'soleado') as 'soleado' | 'nublado' | 'lluvia'
  ),
  // personal → personalPresente
  personal: z.number().nullable().optional().default(0),
  personalPresente: z.number().optional().default(0),
  maquinaria: z.string().nullable().optional().default(''),
  // tareas → tareasRealizadas
  tareas: z.string().nullable().optional().default(''),
  tareasRealizadas: z.string().optional().default(''),
  observaciones: z.string().nullable().optional().default(''),
  // fotos no existe en DB
  fotos: z.array(z.string()).optional().default([]),
  firma: z.string().nullable().optional(),
  latitud: z.number().nullable().optional(),
  longitud: z.number().nullable().optional(),
}).transform(d => ({
  ...d,
  personalPresente: d.personalPresente || d.personal || 0,
  tareasRealizadas: d.tareasRealizadas || d.tareas || '',
  maquinaria: d.maquinaria ?? '',
  observaciones: d.observaciones ?? '',
  fotos: d.fotos ?? [],
}));

const presupuestoSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']),
  // renglones es JSONB en DB — aceptar cualquier array
  renglones: z.array(z.record(z.unknown())).default([]),
  // DB solo tiene borrador|aprobado|rechazado (no 'revisado')
  estado: z.string().default('borrador').transform(e =>
    (['borrador','aprobado','revisado','rechazado'].includes(e) ? e : 'borrador') as
    'borrador' | 'aprobado' | 'revisado' | 'rechazado'
  ),
  // total_calculado → totalCalculado
  totalCalculado: z.number().default(0),
  // costo_directo_total → costoDirectoTotal
  costoDirectoTotal: z.number().default(0),
  // fecha_creacion / fecha_actualizacion
  fechaCreacion: z.string().default(new Date().toISOString()),
  fechaActualizacion: z.string().default(new Date().toISOString()),
  // version_presupuesto → versionPresupuesto
  versionPresupuesto: z.number().optional().default(1),
  notas: z.string().nullable().optional(),
});

function loadFromStorage<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return sanitizarObjeto(parsed) as T;
  } catch { return initial; }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn(`Storage quota exceeded for key: ${key}`);
      // Try to clear some space by removing oldest entries
      const storageKeys = Object.keys(localStorage).sort((a, b) => {
        const aTime = localStorage.getItem(a + '_timestamp') || '0';
        const bTime = localStorage.getItem(b + '_timestamp') || '0';
        return parseInt(aTime) - parseInt(bTime);
      });
      
      // Remove oldest 50% of entries
      const keysToRemove = storageKeys.slice(0, Math.floor(storageKeys.length / 2));
      keysToRemove.forEach(k => {
        localStorage.removeItem(k);
        localStorage.removeItem(k + '_timestamp');
      });
      
      // Try saving again after clearing space
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        console.error(`Failed to save to storage even after clearing space for key: ${key}`);
      }
    }
  }
}

const mapFromSnakeCase = <T extends z.ZodType<any, any, any>>(schema: T, obj: Record<string, unknown>): z.infer<T> | null => {
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

export type View = 'login' | 'dashboard' | 'proyectos' | 'presupuestos' | 'seguimiento' | 'financiero' | 'rrhh' | 'bodega' | 'crm' | 'apu' | 'curvas' | 'rendimientos' | 'baseprecios' | 'reportes' | 'muro' | 'ordenes-cambio' | 'notificaciones' | 'sso-calidad' | 'documentos' | 'visor-bim' | 'predictivo' | 'exportacion' | 'logistica' | 'rendimiento-campo' | 'comercial-fin' | 'admin-sistema' | 'planilla-destajos' | 'impuestos' | 'entradas-almacen';
export type Rol = 'Administrador' | 'Gerente' | 'Residente' | 'Compras' | 'Bodeguero';

// eslint-disable-next-line react-refresh/only-export-components
export const ALLOWED: Record<Rol, View[]> = {
  Administrador: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero', 'rrhh', 'bodega', 'crm', 'apu', 'curvas', 'rendimientos', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos', 'visor-bim', 'predictivo', 'exportacion', 'logistica', 'rendimiento-campo', 'comercial-fin', 'admin-sistema', 'planilla-destajos', 'impuestos', 'entradas-almacen'],
  Gerente: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero', 'rrhh', 'bodega', 'crm', 'apu', 'curvas', 'rendimientos', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos', 'visor-bim', 'predictivo', 'exportacion', 'logistica', 'rendimiento-campo', 'comercial-fin', 'admin-sistema', 'planilla-destajos', 'impuestos', 'entradas-almacen'],
  Residente: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'apu', 'curvas', 'rendimientos', 'baseprecios', 'reportes', 'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos'],
  Compras: ['dashboard', 'bodega', 'proyectos'],
  Bodeguero: ['dashboard', 'bodega'],
};

interface Mutation {
  id: string;
  type: 'addProyecto' | 'updateProyecto' | 'deleteProyecto' | 'addMovimiento' | 'deleteMovimiento' |
         'addEmpleado' | 'updateEmpleado' | 'deleteEmpleado' | 'updateMaterial' |
         'addOrden' | 'updateOrden' | 'addProveedor' | 'updateProveedor' | 'deleteProveedor' |
         'addEvento' | 'updateEvento' | 'deleteEvento' | 'addBitacora' | 'updateBitacora' | 'deleteBitacora' |
  'addPresupuesto' | 'updatePresupuesto' | 'deletePresupuesto' |
  'addLicitacion' | 'updateLicitacion' | 'deleteLicitacion' |
  'addValeSalida' | 'deleteValeSalida' |
  'addAvance' | 'deleteAvance';
  payload: Record<string, unknown>;
  timestamp: number;
}

export type Reporte = 'cubicacion' | 'rendimientos' | 'ejecutivo';

interface ErpState {
  view: View;
  setView: (v: View) => void;
  user: { id: string; nombre: string; rol: Rol; avatar?: string } | null;
  initializing: boolean;
  allowedViews: View[];
  authError: string;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, nombre: string, rol: Rol) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  isOnline: boolean;

  proyectos: Proyecto[];
  addProyecto: (p: Omit<Proyecto, 'id'>) => Promise<void>;
  updateProyecto: (id: string, patch: Partial<Proyecto>) => Promise<void>;
  deleteProyecto: (id: string) => Promise<void>;
  movimientos: Movimiento[];
  addMovimiento: (m: Omit<Movimiento, 'id'>) => Promise<void>;
  deleteMovimiento: (id: string) => Promise<void>;
  empleados: Empleado[];
  addEmpleado: (e: Omit<Empleado, 'id'>) => Promise<void>;
  updateEmpleado: (id: string, patch: Partial<Empleado>) => Promise<void>;
  deleteEmpleado: (id: string) => Promise<void>;
  materiales: Material[];
  updateMaterial: (id: string, patch: Partial<Material>) => Promise<void>;
  ordenes: OrdenCompra[];
  updateOrden: (id: string, estado: OrdenCompra['estado']) => Promise<void>;
  addOrden: (o: Omit<OrdenCompra, 'id'>) => Promise<void>;
  proveedores: Proveedor[];
  addProveedor: (p: Omit<Proveedor, 'id'>) => Promise<void>;
  updateProveedor: (id: string, patch: Partial<Proveedor>) => Promise<void>;
  deleteProveedor: (id: string) => Promise<void>;
  eventos: EventoCalendario[];
  addEvento: (e: Omit<EventoCalendario, 'id'>) => Promise<void>;
  updateEvento: (id: string, patch: Partial<EventoCalendario>) => Promise<void>;
  deleteEvento: (id: string) => Promise<void>;
  bitacora: BitacoraEntry[];
  addBitacora: (b: Omit<BitacoraEntry, 'id'>) => Promise<void>;
  updateBitacora: (id: string, patch: Partial<BitacoraEntry>) => Promise<void>;
  deleteBitacora: (id: string) => Promise<void>;
  presupuestos: Presupuesto[];
  addPresupuesto: (p: Omit<Presupuesto, 'id'>) => Promise<void>;
  updatePresupuesto: (id: string, patch: Partial<Presupuesto>) => Promise<void>;
  deletePresupuesto: (id: string) => Promise<void>;
  getPresupuestoByProyecto: (proyectoId: string) => Presupuesto | undefined;
  selectedProyectoId: string | null;
  setSelectedProyectoId: (id: string | null) => void;
  licitaciones: Licitacion[];
  addLicitacion: (l: Omit<Licitacion, 'id'>) => Promise<void>;
  updateLicitacion: (id: string, patch: Partial<Licitacion>) => Promise<void>;
  deleteLicitacion: (id: string) => Promise<void>;
  avances: AvanceObra[];
  addAvance: (a: Omit<AvanceObra, 'id'>) => Promise<void>;
  deleteAvance: (id: string) => Promise<void>;
  valesSalida: ValeSalida[];
  addValeSalida: (v: Omit<ValeSalida, 'id'>) => Promise<void>;
  deleteValeSalida: (id: string) => Promise<void>;
  mutationQueue: Mutation[];
  syncMessage: string;
  forceSync: () => Promise<void>;
  notificaciones: Notificacion[];
  notificacionesNoLeidas: number;
  addNotificacion: (tipo: Notificacion['tipo'], titulo: string, mensaje: string, proyectoId?: string, referenciaId?: string) => Promise<void>;
  markNotificacionLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
  verificarStockCritico: () => void;
  verificarOrdenesCambioPendientes: () => void;
  verificarChecklistRechazado: (proyectoId: string) => void;
  notifyAvanceRegistrado: (proyectoId: string, renglonNombre: string, avance: number) => void;
  notifyDesviacionRendimiento: (actividad: string, eficiencia: number, proyectoId: string) => void;
}

const Ctx = createContext<ErpState>({} as ErpState);
// eslint-disable-next-line react-refresh/only-export-components
export const useErp = () => useContext(Ctx);
// eslint-disable-next-line react-refresh/only-export-components
export const uid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const BASE_STORAGE_KEY = 'wm_erp_data';
const QUEUE_KEY = 'wm_erp_queue';

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<ErpState['user']>(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const [proyectos, setProyectos] = useState<Proyecto[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_proyectos', SEED_PROYECTOS));
  const [movimientos, setMovimientos] = useState<Movimiento[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_movimientos', SEED_MOVIMIENTOS));
  const [empleados, setEmpleados] = useState<Empleado[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_empleados', SEED_EMPLEADOS));
  const [materiales, setMateriales] = useState<Material[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_materiales', SEED_MATERIALES));
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_ordenes', SEED_OC));
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_proveedores', SEED_PROVEEDORES));
  const [eventos, setEventos] = useState<EventoCalendario[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_eventos', []));
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_bitacora', []));
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_presupuestos', []));
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(() => loadFromStorage(BASE_STORAGE_KEY + '_selected_proyecto_id', null));
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_licitaciones', []));
  const [avances, setAvances] = useState<AvanceObra[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_avances', []));
  const [valesSalida, setValesSalida] = useState<ValeSalida[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_vales_salida', []));
  const [notifiedEventos, setNotifiedEventos] = useState<string[]>(() => loadFromStorage(BASE_STORAGE_KEY + '_notified_eventos', []));

  const [mutationQueue, setMutationQueue] = useState<Mutation[]>(() => loadFromStorage(QUEUE_KEY, []));

  const NOTIF_KEY = BASE_STORAGE_KEY + '_notificaciones';
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(() => loadFromStorage(NOTIF_KEY, []));
  useEffect(() => { saveToStorage(NOTIF_KEY, notificaciones); }, [notificaciones, NOTIF_KEY]);
  const notificacionesNoLeidas = notificaciones.filter(n => !n.leido).length;

  const addNotificacion = useCallback(async (tipo: Notificacion['tipo'], titulo: string, mensaje: string, proyectoId?: string, referenciaId?: string) => {
    const nueva: Notificacion = {
      id: uid(),
      tipo,
      titulo,
      mensaje,
      proyectoId,
      referenciaId,
      leido: false,
      createdAt: new Date().toISOString(),
    };
    setNotificaciones(prev => [nueva, ...prev]);
    // Browser notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, {
        body: mensaje,
        icon: '/logo.png',
      });
    }
    // In-app toast
    toast(titulo, { description: mensaje });
  }, []);

  const markNotificacionLeida = useCallback((id: string) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
  }, []);

  const verificarStockCritico = useCallback(() => {
    materiales.forEach(mat => {
      if (mat.stock <= mat.stockMinimo && mat.stock >= 0) {
        const yaNotificado = notificaciones.some(
          n => n.tipo === 'stock_critico' && n.referenciaId === mat.id && n.leido === false
        );
        if (!yaNotificado) {
          addNotificacion('stock_critico', `Stock crítico: ${mat.nombre}`, `Stock actual: ${mat.stock} ${mat.unidad} (mínimo: ${mat.stockMinimo})`);
        }
      }
    });
  }, [materiales, notificaciones, addNotificacion]);

  const verificarOrdenesCambioPendientes = useCallback(() => {
    const ordenesCambio = loadFromStorage<OrdenCambio[]>(BASE_STORAGE_KEY + '_ordenes_cambio', []);
    ordenesCambio.forEach(oc => {
      if (oc.estado === 'solicitud' || oc.estado === 'revision') {
        const yaNotificado = notificaciones.some(
          n => n.tipo === 'orden_cambio_pendiente' && n.referenciaId === oc.id && n.leido === false
        );
        if (!yaNotificado) {
          addNotificacion('orden_cambio_pendiente', `OC pendiente: ${oc.titulo}`, `Estado: ${oc.estado} · Costo: Q${oc.impactoCosto.toFixed(2)} · Solicitante: ${oc.solicitante}`, oc.proyectoId, oc.id);
        }
      }
    });
  }, [notificaciones, addNotificacion]);

  const verificarChecklistRechazado = useCallback((proyectoId: string) => {
    addNotificacion('checklist_rechazado', 'Checklist de calidad rechazado', 'Un checklist ha sido rechazado. Se requiere evidencia fotográfica y nueva revisión.', proyectoId);
  }, [addNotificacion]);

  const notifyAvanceRegistrado = useCallback((proyectoId: string, renglonNombre: string, avance: number) => {
    addNotificacion('avance_registrado', `Avance registrado: ${renglonNombre}`, `Se registró ${avance}% de avance físico en ${renglonNombre}`, proyectoId);
  }, [addNotificacion]);

  const notifyDesviacionRendimiento = useCallback((actividad: string, eficiencia: number, proyectoId: string) => {
    addNotificacion('desviacion_rendimiento', `Rendimiento bajo: ${actividad}`, `Eficiencia: ${eficiencia.toFixed(0)}% (umbral: 80%)`, proyectoId);
  }, [addNotificacion]);

  const fetchInitialData = useCallback(async () => {
    // Fetch individual para que un error en una tabla no bloquee las demás
    const safeFrom = async (table: string, query?: (q: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>) => {
      try {
        const q = supabase.from(table);
        const { data, error } = await (query ? query(q) : q.select('*'));
        if (error) {
          console.warn(`[Supabase] ${table}:`, error.message);
          return null;
        }
        if (!Array.isArray(data)) return data;
        return data.map((row) => sanitizarObjeto(row));
      } catch (err) {
        console.warn(`[Supabase] ${table} fetch failed:`, err);
        return null;
      }
    };

    const [p, m, e, mat, o, prov, evt, bit, presup] = await Promise.all([
      safeFrom('erp_proyectos'),
      safeFrom('erp_movimientos', q => q.select('*').order('fecha', { ascending: false })),
      safeFrom('erp_empleados'),
      safeFrom('erp_materiales'),
      safeFrom('erp_ordenes_compra', q => q.select('*').order('created_at', { ascending: false })),
      safeFrom('erp_proveedores'),
      safeFrom('erp_eventos_calendario'),
      safeFrom('erp_bitacora', q => q.select('*').order('fecha', { ascending: false })),
      safeFrom('erp_presupuestos'),
    ]);

    if (p?.length) setProyectos(p.map(obj => mapFromSnakeCase(proyectoSchema, obj)).filter(Boolean) as Proyecto[]);
    if (m?.length) setMovimientos(m.map(obj => mapFromSnakeCase(movimientoSchema, obj)).filter(Boolean) as Movimiento[]);
    if (e?.length) setEmpleados(e.map(obj => mapFromSnakeCase(empleadoSchema, obj)).filter(Boolean) as Empleado[]);
    if (mat?.length) setMateriales(mat.map(obj => mapFromSnakeCase(materialSchema, obj)).filter(Boolean) as Material[]);
    if (o?.length) setOrdenes(o.map(obj => mapFromSnakeCase(ordenCompraSchema, obj)).filter(Boolean) as OrdenCompra[]);
    if (prov?.length) setProveedores(prov.map(obj => mapFromSnakeCase(proveedorSchema, obj)).filter(Boolean) as Proveedor[]);
    if (evt?.length) setEventos(evt.map(obj => mapFromSnakeCase(eventoCalendarioSchema, obj)).filter(Boolean) as EventoCalendario[]);
    if (bit?.length) setBitacora(bit.map(obj => mapFromSnakeCase(bitacoraEntrySchema, obj)).filter(Boolean) as BitacoraEntry[]);
    if (presup?.length) setPresupuestos(presup.map(obj => mapFromSnakeCase(presupuestoSchema, obj)).filter(Boolean) as Presupuesto[]);
  }, []);

  useEffect(() => {
    let mounted = true;


    const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined)?.trim() || 'salazaroliveros@gmail.com';

    const mapRol = (dbRol: string, email?: string): Rol => {
      if (email === 'salazaroliveros@gmail.com') return 'Administrador';
      if (dbRol === 'Administrador') return 'Gerente';
      if (dbRol === 'usuario' || !dbRol) return 'Residente';
      return dbRol as Rol;
    };

    const loadProfile = async (id: string, email?: string, metadata?: { nombre?: string; avatar_url?: string; picture?: string }) => {
      const defaultRol: Rol = email === 'salazaroliveros@gmail.com' ? 'Administrador' : 'Residente';
      const avatarFromMeta = metadata?.avatar_url || metadata?.picture;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nombre,rol,avatar_url')
          .eq('id', id)
          .maybeSingle();
        if (error || !data) {
          const name = metadata?.nombre || email?.split('@')[0] || 'Usuario';
          await supabase.from('profiles').upsert(
            { id, nombre: name, rol: defaultRol, avatar_url: avatarFromMeta },
            { onConflict: 'id', ignoreDuplicates: false }
          );
          setUser({ id, nombre: name, rol: defaultRol, avatar: avatarFromMeta });
        } else {
          setUser({ id, nombre: data.nombre, rol: mapRol(data.rol, email), avatar: data.avatar_url || avatarFromMeta });
        }

        const serverRole = await getServerRole();
        if (serverRole?.rol && mounted) {
          setUser(prev => prev ? { ...prev, rol: mapRol(serverRole.rol, email) as Rol } : prev);
        }
        if (mounted) { setView('dashboard'); setInitializing(false); fetchInitialData(); }
      } catch {
        const name = email?.split('@')[0] || 'Usuario';
        if (mounted) { setUser({ id, nombre: name, rol: defaultRol, avatar: avatarFromMeta }); setView('dashboard'); setInitializing(false); fetchInitialData(); }
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        const meta = session.user.user_metadata || {};
        loadProfile(session.user.id, session.user.email || undefined, { nombre: meta.full_name || meta.nombre, avatar_url: meta.picture || meta.avatar_url });
      } else if (event === 'SIGNED_OUT') {
        setUser(null); setView('login'); setInitializing(false);
      }
    });

    // OAuth PKCE code exchange
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('code')) {
      supabase.auth.exchangeCodeForSession(urlParams.get('code')!).then(({ data, error }) => {
        if (error) {
          console.error('[Auth] Code exchange failed:', error.message);
          setInitializing(false);
        } else if (data.session) {
          const meta = data.session.user.user_metadata || {};
          loadProfile(data.session.user.id, data.session.user.email || undefined, { nombre: meta.full_name || meta.nombre, avatar_url: meta.picture || meta.avatar_url });
        }
      });
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return;
        if (data.session?.user) loadProfile(data.session.user.id, data.session.user.email || undefined);
        else setInitializing(false);
      });
    }

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [fetchInitialData]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    let active = true;
    const check = async () => {
      if (!active || !user?.id) return;
      try {
        const serverRole = await getServerRole();
        if (!active) return;
        if (serverRole?.rol && serverRole.rol !== user.rol) {
          setUser(prev => prev ? { ...prev, rol: serverRole.rol as Rol } : prev);
        }
      } catch {
        // keep current role until next check
      }
    };
    const id = window.setInterval(check, 30000);
    return () => { active = false; window.clearInterval(id); };
  }, [isOnline, user?.id, user?.rol]);

  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_proyectos', proyectos); }, [proyectos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_movimientos', movimientos); }, [movimientos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_empleados', empleados); }, [empleados]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_materiales', materiales); }, [materiales]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_ordenes', ordenes); }, [ordenes]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_proveedores', proveedores); }, [proveedores]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_eventos', eventos); }, [eventos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_bitacora', bitacora); }, [bitacora]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_presupuestos', presupuestos); }, [presupuestos]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_selected_proyecto_id', selectedProyectoId); }, [selectedProyectoId]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_licitaciones', licitaciones); }, [licitaciones]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_avances', avances); }, [avances]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_vales_salida', valesSalida); }, [valesSalida]);
  useEffect(() => { saveToStorage(BASE_STORAGE_KEY + '_notified_eventos', notifiedEventos); }, [notifiedEventos]);
  useEffect(() => { saveToStorage(QUEUE_KEY, mutationQueue); }, [mutationQueue]);

  const enqueueMutation = useCallback((type: Mutation['type'], payload: Record<string, unknown>) => {
    const safePayload = sanitizarObjeto(payload);
    const mutation: Mutation = { id: uid(), type, payload: safePayload, timestamp: Date.now() };
    setMutationQueue(q => [...q, mutation]);
    return mutation.id;
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline || mutationQueue.length === 0) return;
    
    const [next, ...rest] = mutationQueue;

    const toSnake = (obj: Record<string, unknown>) => {
      const mapped: Record<string, unknown> = {};
      for (const key in obj) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        mapped[snakeKey] = obj[key];
      }
      return mapped;
    };

    // Limpia campos que NO existen en DB para cada tabla
    const forProyecto = (p: Record<string, unknown>) => {
      const s = toSnake(p);
      // latitud/longitud en TS pero lat/lng en DB
      if ('latitud' in s) { s.lat = s.latitud; delete s.latitud; }
      if ('longitud' in s) { s.lng = s.longitud; delete s.longitud; }
      // campos solo locales
      delete s.factor_sobrecosto;
      delete s.presupuesto;
      return s;
    };

    const forMovimiento = (m: Record<string, unknown>) => {
      const s = toSnake(m);
      // monto en TS -> costo_total en DB
      if (!s.costo_total && s.monto) s.costo_total = s.monto;
      delete s.monto;
      // proveedor/factura no en DB
      delete s.proveedor;
      delete s.factura;
      return s;
    };

    const forEmpleado = (e: Record<string, unknown>) => {
      const s = toSnake(e);
      // proyectoIds no en DB (la DB tiene proyecto_id single)
      if (Array.isArray(s.proyecto_ids) && s.proyecto_ids.length > 0) {
        s.proyecto_id = s.proyecto_ids[0];
      }
      delete s.proyecto_ids;
      // activo no en DB
      delete s.activo;
      delete s.telefono; // no en DB
      return s;
    };

    const forMaterial = (m: Record<string, unknown>) => {
      const s = toSnake(m);
      // categoria y proyectoIds no en DB
      delete s.categoria;
      delete s.proyecto_ids;
      return s;
    };

    const forProveedor = (p: Record<string, unknown>) => {
      const s = toSnake(p);
      // telefono, email, categoria no en DB
      delete s.telefono;
      delete s.email;
      delete s.categoria;
      return s;
    };

    const forEvento = (e: Record<string, unknown>) => {
      const s = toSnake(e);
      // participantes no en DB
      delete s.participantes;
      return s;
    };

    const forBitacora = (b: Record<string, unknown>) => {
      const s = toSnake(b);
      // personalPresente -> personal en DB
      if ('personal_presente' in s) { s.personal = s.personal_presente; delete s.personal_presente; }
      // tareasRealizadas -> tareas en DB
      if ('tareas_realizadas' in s) { s.tareas = s.tareas_realizadas; delete s.tareas_realizadas; }
      // fotos no en DB
      delete s.fotos;
      delete s.firma;
      delete s.latitud;
      delete s.longitud;
      return s;
    };

    try {
      switch (next.type) {
        case 'addProyecto': {
          const p = forProyecto({ ...next.payload, created_by: user?.id });
          const { data, error } = await supabase.from('erp_proyectos').insert(p);
          if (error) throw new Error(`Failed to add proyecto: ${error.message}`);
          break;
        }
        case 'updateProyecto': {
          const { id, ...rest2 } = next.payload;
          const { data, error } = await supabase.from('erp_proyectos').update(forProyecto(rest2)).eq('id', id);
          if (error) throw new Error(`Failed to update proyecto: ${error.message}`);
          break;
        }
        case 'deleteProyecto': {
          const { error } = await supabase.from('erp_proyectos').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete proyecto: ${error.message}`);
          break;
        }
        case 'addMovimiento': {
          const m = forMovimiento({ ...next.payload, created_by: user?.id });
          const { data, error } = await supabase.from('erp_movimientos').insert(m);
          if (error) throw new Error(`Failed to add movimiento: ${error.message}`);
          break;
        }
        case 'deleteMovimiento': {
          const { error } = await supabase.from('erp_movimientos').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete movimiento: ${error.message}`);
          break;
        }
                case 'addEmpleado': {
          const { error } = await supabase.from('erp_empleados').insert(forEmpleado(next.payload));
          if (error) throw new Error(`Failed to add empleado: ${error.message}`);
          break;
        }
        case 'updateEmpleado': {
          const { id, ...rest3 } = next.payload;
          const { error } = await supabase.from('erp_empleados').update(forEmpleado(rest3)).eq('id', id);
          if (error) throw new Error(`Failed to update empleado: ${error.message}`);
          break;
        }
        case 'deleteEmpleado': {
          const { error } = await supabase.from('erp_empleados').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete empleado: ${error.message}`);
          break;
        }
        case 'updateMaterial': {
          const { id, ...rest4 } = next.payload;
          const { error } = await supabase.from('erp_materiales').update(forMaterial(rest4)).eq('id', id);
          if (error) throw new Error(`Failed to update material: ${error.message}`);
          break;
        }
        case 'addOrden': {
          const { error } = await supabase.from('erp_ordenes_compra').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add orden: ${error.message}`);
          break;
        }
        case 'updateOrden': {
          const { error } = await supabase.from('erp_ordenes_compra').update({ estado: next.payload.estado }).eq('id', next.payload.id);
          if (error) throw new Error(`Failed to update orden: ${error.message}`);
          break;
        }
        case 'addProveedor': {
          const { error } = await supabase.from('erp_proveedores').insert(forProveedor(next.payload));
          if (error) throw new Error(`Failed to add proveedor: ${error.message}`);
          break;
        }
        case 'updateProveedor': {
          const { id, ...rest5 } = next.payload;
          const { error } = await supabase.from('erp_proveedores').update(forProveedor(rest5)).eq('id', id);
          if (error) throw new Error(`Failed to update proveedor: ${error.message}`);
          break;
        }
        case 'deleteProveedor': {
          const { error } = await supabase.from('erp_proveedores').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete proveedor: ${error.message}`);
          break;
        }
        case 'addEvento': {
          const { error } = await supabase.from('erp_eventos_calendario').insert(forEvento(next.payload));
          if (error) throw new Error(`Failed to add evento: ${error.message}`);
          break;
        }
        case 'updateEvento': {
          const { id, ...rest6 } = next.payload;
          const { error } = await supabase.from('erp_eventos_calendario').update(forEvento(rest6)).eq('id', id);
          if (error) throw new Error(`Failed to update evento: ${error.message}`);
          break;
        }
        case 'deleteEvento': {
          const { error } = await supabase.from('erp_eventos_calendario').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete evento: ${error.message}`);
          break;
        }
        case 'addBitacora': {
          const { error } = await supabase.from('erp_bitacora').insert(forBitacora(next.payload));
          if (error) throw new Error(`Failed to add bitacora: ${error.message}`);
          break;
        }
        case 'updateBitacora': {
          const { id, ...rest7 } = next.payload;
          const { error } = await supabase.from('erp_bitacora').update(forBitacora(rest7)).eq('id', id);
          if (error) throw new Error(`Failed to update bitacora: ${error.message}`);
          break;
        }
        case 'deleteBitacora': {
          const { error } = await supabase.from('erp_bitacora').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete bitacora: ${error.message}`);
          break;
        }
        case 'addPresupuesto': {
          const { error } = await supabase.from('erp_presupuestos').insert(toSnake(next.payload));
          if (error) throw new Error(`Failed to add presupuesto: ${error.message}`);
          break;
        }
        case 'updatePresupuesto': {
          const { id, ...rest8 } = next.payload;
          const { error } = await supabase.from('erp_presupuestos').update(toSnake(rest8)).eq('id', id);
          if (error) throw new Error(`Failed to update presupuesto: ${error.message}`);
          break;
        }
        case 'deletePresupuesto': {
          const { error } = await supabase.from('erp_presupuestos').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete presupuesto: ${error.message}`);
          break;
        }
        case 'addValeSalida':
          await supabase.from('erp_vales_salida').insert(toSnake(next.payload));
          break;
        case 'deleteValeSalida':
          await supabase.from('erp_vales_salida').delete().eq('id', next.payload.id);
          break;
        // Tablas en DB
        case 'addAvance': {
          const { error } = await supabase.from('erp_avances').insert([next.payload]);
          if (error) throw new Error(`Failed to add avance: ${error.message}`);
          break;
        }
        case 'deleteAvance': {
          const { error } = await supabase.from('erp_avances').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete avance: ${error.message}`);
          break;
        }
        case 'addLicitacion': {
          const { error } = await supabase.from('erp_licitaciones').insert([next.payload]);
          if (error) throw new Error(`Failed to add licitacion: ${error.message}`);
          break;
        }
        case 'updateLicitacion': {
          const { id, ...restL } = next.payload;
          const { error } = await supabase.from('erp_licitaciones').update(restL).eq('id', id);
          if (error) throw new Error(`Failed to update licitacion: ${error.message}`);
          break;
        }
        case 'deleteLicitacion': {
          const { error } = await supabase.from('erp_licitaciones').delete().eq('id', next.payload.id);
          if (error) throw new Error(`Failed to delete licitacion: ${error.message}`);
          break;
        }
      }
      setMutationQueue(rest);
    } catch (err) {
      console.error('Error processing mutation queue:', err);
      // Remover mutación fallida después de 3 intentos implícito por el timer
      setMutationQueue(rest);
    }
  }, [isOnline, mutationQueue, user]);

  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(processQueue, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, processQueue]);

  // Chequeo periódico de stock crítico y OC pendientes
  useEffect(() => {
    if (!user) return;
    const checkAll = () => {
      verificarStockCritico();
      verificarOrdenesCambioPendientes();
    };
    checkAll();
    const interval = setInterval(checkAll, 60 * 1000); // cada 60s
    return () => clearInterval(interval);
  }, [user, verificarStockCritico, verificarOrdenesCambioPendientes]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const sendReminderNotification = useCallback((evento: EventoCalendario) => {
    const title = `Recordatorio: ${evento.titulo}`;
    const description = evento.descripcion
      ? evento.descripcion
      : evento.proyectoId
        ? `Actividad asociada al proyecto ${proyectos.find(p => p.id === evento.proyectoId)?.nombre || evento.proyectoId}`
        : 'Revisa tu calendario para más detalles.';

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: description,
        icon: '/logo.png',
      });
    } else {
      toast(title, {
        description,
        action: {
          label: 'Ver calendario',
          onClick: () => setView('dashboard'),
        },
      });
    }
  }, [proyectos, setView]);

  useEffect(() => {
    requestNotificationPermission();

    const checkReminders = () => {
      if (typeof window === 'undefined') return;
      const now = new Date();
      const todayIso = now.toISOString().slice(0, 10);

      eventos.forEach(evento => {
        if (notifiedEventos.includes(evento.id) || evento.completado) return;

        const time = evento.hora || '09:00';
        const dateTime = new Date(`${evento.fecha}T${time}:00`);
        if (Number.isNaN(dateTime.getTime())) return;

        const diff = dateTime.getTime() - now.getTime();
        const shouldNotify = evento.fecha === todayIso
          ? diff <= 5 * 60 * 1000 && diff >= -15 * 60 * 1000
          : false;

        if (shouldNotify) {
          sendReminderNotification(evento);
          setNotifiedEventos(ids => ids.includes(evento.id) ? ids : [...ids, evento.id]);
        }
      });
    };

    checkReminders();
    const timer = setInterval(checkReminders, 30 * 1000);
    return () => clearInterval(timer);
  }, [eventos, notifiedEventos, requestNotificationPermission, sendReminderNotification]);

  const signIn = async (email: string, pass: string) => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) setAuthError(error.message);
  };
  const signUp = async (email: string, pass: string, nombre: string, _rol: Rol) => {
    setAuthError('');
    const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { full_name: nombre, nombre, rol: _rol } } });
    if (error) setAuthError(error.message);
  };
  const logout = async () => { await supabase.auth.signOut(); setUser(null); setView('login'); };

  const signInWithGoogle = async () => {
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account',
          },
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Google Sign In Error:', err);
      setAuthError(err instanceof Error ? err.message : 'Error al conectar con Google');
    }
  };

  const allowedViews = user ? ALLOWED[user.rol] : [];

  const addProyecto = async (p: Omit<Proyecto, 'id'>) => {
    const newProj = { ...p, id: uid() };
    setProyectos(s => [...s, newProj]);
    enqueueMutation('addProyecto', newProj);
  };
  const updateProyecto = async (id: string, patch: Partial<Proyecto>) => {
    setProyectos(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateProyecto', { id, ...patch });
  };
  const deleteProyecto = async (id: string) => {
    setProyectos(s => s.filter(p => p.id !== id));
    enqueueMutation('deleteProyecto', { id });
  };

  const addMovimiento = async (m: Omit<Movimiento, 'id'>) => {
    const newMov = { ...m, id: uid() };
    setMovimientos(s => [newMov, ...s]);
    enqueueMutation('addMovimiento', newMov);
  };
  const deleteMovimiento = async (id: string) => {
    setMovimientos(s => s.filter(m => m.id !== id));
    enqueueMutation('deleteMovimiento', { id });
  };

  const addEmpleado = async (e: Omit<Empleado, 'id'>) => {
    const newEmp = { ...e, id: uid() };
    setEmpleados(s => [...s, newEmp]);
    enqueueMutation('addEmpleado', newEmp);
  };
  const updateEmpleado = async (id: string, patch: Partial<Empleado>) => {
    setEmpleados(s => s.map(e => e.id === id ? { ...e, ...patch } : e));
    enqueueMutation('updateEmpleado', { id, ...patch });
  };
  const deleteEmpleado = async (id: string) => {
    setEmpleados(s => s.filter(e => e.id !== id));
    enqueueMutation('deleteEmpleado', { id });
  };

  const addPresupuesto = async (p: Omit<Presupuesto, 'id'>) => {
    const versionesExistentes = presupuestos.filter(pr => pr.proyectoId === p.proyectoId);
    const nextVersion = versionesExistentes.length > 0
      ? Math.max(...versionesExistentes.map(pr => pr.versionPresupuesto || 1)) + 1
      : (p.versionPresupuesto ?? 1);

    const newPresupuesto: Presupuesto = {
      ...p,
      id: uid(),
      versionPresupuesto: nextVersion,
    };

    enqueueMutation('addPresupuesto', newPresupuesto);
    setPresupuestos(s => [...s, newPresupuesto]);

    if (p.proyectoId) {
      try {
        await updateProyecto(p.proyectoId, {
          presupuestoActualId: newPresupuesto.id,
          presupuestoTotal: newPresupuesto.totalCalculado,
        });
      } catch (err) {
        console.error('Error actualizando proyecto con presupuesto:', err);
      }
    }
  };

  const updatePresupuesto = async (id: string, patch: Partial<Presupuesto>) => {
    const updated = presupuestos.map(p => p.id === id ? { ...p, ...patch, fechaActualizacion: new Date().toISOString() } : p);

    enqueueMutation('updatePresupuesto', { id, ...patch });
    setPresupuestos(updated);

    const presupuestoActualizado = updated.find(p => p.id === id);
    if (presupuestoActualizado) {
      const proyectoActual = proyectos.find(proy => proy.id === presupuestoActualizado.proyectoId);
      if (proyectoActual?.presupuestoActualId === id) {
        try {
          await updateProyecto(presupuestoActualizado.proyectoId, {
            presupuestoTotal: presupuestoActualizado.totalCalculado,
          });
        } catch (err) {
          console.error('Error actualizando proyecto tras editar presupuesto:', err);
        }
      }
    }
  };

  const deletePresupuesto = async (id: string) => {
    const presupuestoEliminado = presupuestos.find(p => p.id === id);
    enqueueMutation('deletePresupuesto', { id });

    const remainingPresupuestos = presupuestos.filter(p => p.id !== id);
    setPresupuestos(remainingPresupuestos);

    if (presupuestoEliminado?.proyectoId) {
      const proyectoActual = proyectos.find(proy => proy.id === presupuestoEliminado.proyectoId);
      if (proyectoActual?.presupuestoActualId === id) {
        const ultimoPresupuesto = remainingPresupuestos
          .filter(p => p.proyectoId === presupuestoEliminado.proyectoId)
          .sort((a, b) => new Date(b.fechaActualizacion).getTime() - new Date(a.fechaActualizacion).getTime())[0];

        try {
          await updateProyecto(presupuestoEliminado.proyectoId, {
            presupuestoActualId: ultimoPresupuesto?.id ?? null,
            presupuestoTotal: ultimoPresupuesto?.totalCalculado ?? 0,
          });
        } catch (err) {
          console.error('Error actualizando proyecto tras eliminar presupuesto:', err);
        }
      }
    }
  };

  const getPresupuestoByProyecto = useCallback((proyectoId: string) => {
    return presupuestos.find(p => p.proyectoId === proyectoId);
  }, [presupuestos]);

  const addLicitacion = async (l: Omit<Licitacion, 'id'>) => {
    const newLicitacion = { ...l, id: uid() };
    setLicitaciones(s => [newLicitacion, ...s]);
    enqueueMutation('addLicitacion', newLicitacion);
  };

  const updateLicitacion = async (id: string, patch: Partial<Licitacion>) => {
    setLicitaciones(s => s.map(l => l.id === id ? { ...l, ...patch } : l));
    enqueueMutation('updateLicitacion', { id, ...patch });
  };

  const deleteLicitacion = async (id: string) => {
    setLicitaciones(s => s.filter(l => l.id !== id));
    enqueueMutation('deleteLicitacion', { id });
  };

  const updateMaterial = async (id: string, patch: Partial<Material>) => {
    setMateriales(s => s.map(m => m.id === id ? { ...m, ...patch } : m));
    enqueueMutation('updateMaterial', { id, ...patch });
  };

  const addOrden = async (o: Omit<OrdenCompra, 'id'>) => {
    const newOrd = { ...o, id: uid() };
    setOrdenes(s => [newOrd, ...s]);
    enqueueMutation('addOrden', newOrd);
  };
  const updateOrden = async (id: string, estado: OrdenCompra['estado']) => {
    setOrdenes(s => s.map(o => o.id === id ? { ...o, estado } : o));
    enqueueMutation('updateOrden', { id, estado });
  };

  const addProveedor = async (p: Omit<Proveedor, 'id'>) => {
    const newProv = { ...p, id: uid() };
    setProveedores(s => [...s, newProv]);
    enqueueMutation('addProveedor', newProv);
  };
  const updateProveedor = async (id: string, patch: Partial<Proveedor>) => {
    setProveedores(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateProveedor', { id, ...patch });
  };
  const deleteProveedor = async (id: string) => {
    setProveedores(s => s.filter(p => p.id !== id));
    enqueueMutation('deleteProveedor', { id });
  };

  const addEvento = async (e: Omit<EventoCalendario, 'id'>) => {
    const newEvt = { ...e, id: uid() };
    setEventos(s => [...s, newEvt]);
    enqueueMutation('addEvento', newEvt);
  };
  const updateEvento = async (id: string, patch: Partial<EventoCalendario>) => {
    setEventos(s => s.map(e => e.id === id ? { ...e, ...patch } : e));
    enqueueMutation('updateEvento', { id, ...patch });
  };
  const deleteEvento = async (id: string) => {
    setEventos(s => s.filter(e => e.id !== id));
    enqueueMutation('deleteEvento', { id });
  };

  const addBitacora = async (b: Omit<BitacoraEntry, 'id'>) => {
    const newBit = { ...b, id: uid() };
    setBitacora(s => [newBit, ...s]);
    enqueueMutation('addBitacora', newBit);
  };

  const updateBitacora = async (id: string, patch: Partial<BitacoraEntry>) => {
    setBitacora(s => s.map(b => b.id === id ? { ...b, ...patch } : b));
    enqueueMutation('updateBitacora', { id, ...patch });
  };

  const deleteBitacora = async (id: string) => {
    setBitacora(s => s.filter(b => b.id !== id));
    enqueueMutation('deleteBitacora', { id });
  };

  const addAvance = async (a: Omit<AvanceObra, 'id'>) => {
    const newAvance: AvanceObra = { ...a, id: uid() };
    setAvances(s => [newAvance, ...s]);
    enqueueMutation('addAvance', newAvance);
    const todosAvances = [newAvance, ...avances].filter(av => av.proyectoId === a.proyectoId);
    const promedioAvance = todosAvances.length > 0
      ? todosAvances.reduce((sum, av) => sum + av.avanceFisico, 0) / todosAvances.length
      : 0;
    await updateProyecto(a.proyectoId, { avanceFisico: Math.round(promedioAvance) });
  };

  const deleteAvance = async (id: string) => {
    setAvances(s => s.filter(a => a.id !== id));
    enqueueMutation('deleteAvance', { id });
  };

  const addValeSalida = async (v: Omit<ValeSalida, 'id'>) => {
    const newVale = { ...v, id: uid() };
    setValesSalida(s => [newVale, ...s]);
    // Descontar stock de cada material
    newVale.items.forEach(item => {
      const mat = materiales.find(m => m.id === item.materialId);
      if (mat) {
        const nuevoStock = mat.stock - item.cantidad;
        setMateriales(prev => prev.map(m => m.id === item.materialId ? { ...m, stock: nuevoStock } : m));
      }
    });
    enqueueMutation('addValeSalida', newVale);
  };

  const deleteValeSalida = async (id: string) => {
    setValesSalida(s => s.filter(v => v.id !== id));
    enqueueMutation('deleteValeSalida', { id });
  };

  const [syncMessage, setSyncMessage] = useState('');

  const forceSync = useCallback(async () => {
    if (!isOnline) {
      setSyncMessage('Sin conexión');
      setTimeout(() => setSyncMessage(''), 3000);
      return;
    }
    if (mutationQueue.length === 0) {
      setSyncMessage('Todo sincronizado ✅');
      setTimeout(() => setSyncMessage(''), 3000);
      return;
    }
    setSyncMessage('Sincronizando...');
    await processQueue();
    const remaining = mutationQueue.length - 1;
    if (remaining <= 0) {
      setSyncMessage('Sincronizado ✅');
    } else {
      setSyncMessage(`${remaining} pendientes`);
    }
    setTimeout(() => setSyncMessage(''), 3000);
  }, [isOnline, mutationQueue, processQueue]);

  return (
    <Ctx.Provider value={{
      view, setView, user, initializing, allowedViews, authError, signIn, signUp, signInWithGoogle, logout,
      isOnline,
      proyectos, addProyecto, updateProyecto, deleteProyecto,
      movimientos, addMovimiento, deleteMovimiento,
      empleados, addEmpleado, updateEmpleado, deleteEmpleado,
      materiales, updateMaterial,
      ordenes, updateOrden, addOrden,
      proveedores, addProveedor, updateProveedor, deleteProveedor,
      eventos, addEvento, updateEvento, deleteEvento,
      bitacora, addBitacora, updateBitacora, deleteBitacora,
      presupuestos, addPresupuesto, updatePresupuesto, deletePresupuesto, getPresupuestoByProyecto,
      selectedProyectoId, setSelectedProyectoId,
      licitaciones, addLicitacion, updateLicitacion, deleteLicitacion,
      avances, addAvance, deleteAvance,
      valesSalida, addValeSalida, deleteValeSalida,
      notificaciones, notificacionesNoLeidas, addNotificacion, markNotificacionLeida, marcarTodasLeidas,
      verificarStockCritico, verificarOrdenesCambioPendientes, verificarChecklistRechazado,
      notifyAvanceRegistrado, notifyDesviacionRendimiento,
      mutationQueue, syncMessage, forceSync,
    }}>
      {children}
    </Ctx.Provider>
  );
};


