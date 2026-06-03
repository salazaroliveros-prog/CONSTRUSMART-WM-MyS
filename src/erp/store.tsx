import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';
import {
  Proyecto, Movimiento, Empleado, Material, OrdenCompra, Proveedor, EventoCalendario, BitacoraEntry, Presupuesto, Licitacion, AvanceObra, ValeSalida, Notificacion, OrdenCambio,
} from './types';
import {
  SEED_PROYECTOS, SEED_MOVIMIENTOS, SEED_EMPLEADOS, SEED_MATERIALES, SEED_OC, SEED_PROVEEDORES,
} from './data';

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

const STORAGE_KEY = 'wm_erp_data';
const QUEUE_KEY = 'wm_erp_queue';

function loadFromStorage<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : initial;
    } catch { return initial; }
}

function saveToStorage<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<ErpState['user']>(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const [proyectos, setProyectos] = useState<Proyecto[]>(() => loadFromStorage(STORAGE_KEY + '_proyectos', SEED_PROYECTOS));
  const [movimientos, setMovimientos] = useState<Movimiento[]>(() => loadFromStorage(STORAGE_KEY + '_movimientos', SEED_MOVIMIENTOS));
  const [empleados, setEmpleados] = useState<Empleado[]>(() => loadFromStorage(STORAGE_KEY + '_empleados', SEED_EMPLEADOS));
  const [materiales, setMateriales] = useState<Material[]>(() => loadFromStorage(STORAGE_KEY + '_materiales', SEED_MATERIALES));
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>(() => loadFromStorage(STORAGE_KEY + '_ordenes', SEED_OC));
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => loadFromStorage(STORAGE_KEY + '_proveedores', SEED_PROVEEDORES));
  const [eventos, setEventos] = useState<EventoCalendario[]>(() => loadFromStorage(STORAGE_KEY + '_eventos', []));
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>(() => loadFromStorage(STORAGE_KEY + '_bitacora', []));
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(() => loadFromStorage(STORAGE_KEY + '_presupuestos', []));
  const [selectedProyectoId, setSelectedProyectoId] = useState<string | null>(() => loadFromStorage(STORAGE_KEY + '_selected_proyecto_id', null));
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>(() => loadFromStorage(STORAGE_KEY + '_licitaciones', []));
  const [avances, setAvances] = useState<AvanceObra[]>(() => loadFromStorage(STORAGE_KEY + '_avances', []));
  const [valesSalida, setValesSalida] = useState<ValeSalida[]>(() => loadFromStorage(STORAGE_KEY + '_vales_salida', []));
  const [notifiedEventos, setNotifiedEventos] = useState<string[]>(() => loadFromStorage(STORAGE_KEY + '_notified_eventos', []));

  const [mutationQueue, setMutationQueue] = useState<Mutation[]>(() => loadFromStorage(QUEUE_KEY, []));

  const NOTIF_KEY = STORAGE_KEY + '_notificaciones';
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(() => loadFromStorage(NOTIF_KEY, []));
  useEffect(() => { saveToStorage(NOTIF_KEY, notificaciones); }, [notificaciones]);
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
    const ordenesCambio = loadFromStorage<OrdenCambio[]>(STORAGE_KEY + '_ordenes_cambio', []);
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
    try {
      const [
        { data: p }, { data: m }, { data: e }, { data: mat }, { data: o }, { data: prov }, { data: evt }, { data: bit }, { data: presup }
      ] = await Promise.all([
        supabase.from('erp_proyectos').select('*'),
        supabase.from('erp_movimientos').select('*').order('fecha', { ascending: false }),
        supabase.from('erp_empleados').select('*'),
        supabase.from('erp_materiales').select('*'),
        supabase.from('erp_ordenes_compra').select('*').order('created_at', { ascending: false }),
        supabase.from('erp_proveedores').select('*'),
        supabase.from('erp_eventos_calendario').select('*'),
        supabase.from('erp_bitacora').select('*').order('fecha', { ascending: false }),
        supabase.from('erp_presupuestos').select('*'),
      ]);

      const mapFromSnakeCase = (obj: Record<string, unknown>) => {
        const mapped: Record<string, unknown> = {};
        for (const key in obj) {
          const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
          mapped[camelKey] = obj[key];
        }
        return mapped;
      };

      if (p) setProyectos(p.map(mapFromSnakeCase));
      if (m) setMovimientos(m.map(mapFromSnakeCase));
      if (e) setEmpleados(e.map(mapFromSnakeCase));
      if (mat) setMateriales(mat.map(mapFromSnakeCase));
      if (o) setOrdenes(o.map(mapFromSnakeCase));
      if (prov) setProveedores(prov.map(mapFromSnakeCase));
      if (evt) setEventos(evt.map(mapFromSnakeCase));
      if (bit) setBitacora(bit.map(mapFromSnakeCase));
      if (presup) setPresupuestos(presup.map(mapFromSnakeCase));
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    console.log('[Auth] Mount, URL:', window.location.href);
    const params = new URL(window.location.href).searchParams;
    console.log('[Auth] URL params:', Object.fromEntries(params.entries()));
    console.log('[Auth] URL hash:', window.location.hash);
    const sbKeys = Object.keys(localStorage).filter(k => k.includes('sb-') || k.includes('supabase'));
    console.log('[Auth] localStorage sb- keys:', sbKeys);
    sbKeys.forEach(k => console.log('[Auth] localStorage', k, '=', localStorage.getItem(k)?.substring(0, 60)));

    const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

    const mapRol = (dbRol: string): Rol => {
      if (dbRol === 'usuario' || !dbRol) return 'Residente';
      return dbRol as Rol;
    };

    const loadProfile = async (id: string, email?: string, metadata?: { nombre?: string; avatar_url?: string; picture?: string }) => {
      console.log('[Auth] loadProfile', id, email);
      const defaultRol: Rol = email === ADMIN_EMAIL ? 'Administrador' : 'Residente';
      const avatarFromMeta = metadata?.avatar_url || metadata?.picture;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('nombre,rol,avatar_url')
          .eq('id', id)
          .single();
        console.log('[Auth] profile query:', data, error);
        if (error || !data) {
          const name = metadata?.nombre || email?.split('@')[0] || 'Usuario';
          await supabase.from('profiles').insert({ id, nombre: name, rol: defaultRol, avatar_url: avatarFromMeta }).maybeSingle();
          setUser({ id, nombre: name, rol: defaultRol, avatar: avatarFromMeta });
        } else {
          setUser({ id, nombre: data.nombre, rol: mapRol(data.rol), avatar: data.avatar_url || avatarFromMeta });
        }
        if (mounted) { setView('dashboard'); setInitializing(false); fetchInitialData(); }
      } catch {
        const name = email?.split('@')[0] || 'Usuario';
        if (mounted) { setUser({ id, nombre: name, rol: defaultRol, avatar: avatarFromMeta }); setView('dashboard'); setInitializing(false); fetchInitialData(); }
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Event:', event, session?.user?.email);
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
      console.log('[Auth] OAuth PKCE code detected, exchanging...');
      supabase.auth.exchangeCodeForSession(urlParams.get('code')!).then(({ data, error }) => {
        if (error) {
          console.error('[Auth] Code exchange failed:', error.message);
          setInitializing(false);
        } else if (data.session) {
          console.log('[Auth] Code exchange successful for:', data.session.user.email);
          const meta = data.session.user.user_metadata || {};
          loadProfile(data.session.user.id, data.session.user.email || undefined, { nombre: meta.full_name || meta.nombre, avatar_url: meta.picture || meta.avatar_url });
        }
      });
    } else {
      supabase.auth.getSession().then(({ data }) => {
        console.log('[Auth] getSession result:', data.session ? 'SESSION: ' + data.session.user.email : 'NO SESSION');
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

  useEffect(() => { saveToStorage(STORAGE_KEY + '_proyectos', proyectos); }, [proyectos]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_movimientos', movimientos); }, [movimientos]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_empleados', empleados); }, [empleados]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_materiales', materiales); }, [materiales]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_ordenes', ordenes); }, [ordenes]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_proveedores', proveedores); }, [proveedores]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_eventos', eventos); }, [eventos]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_bitacora', bitacora); }, [bitacora]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_presupuestos', presupuestos); }, [presupuestos]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_selected_proyecto_id', selectedProyectoId); }, [selectedProyectoId]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_licitaciones', licitaciones); }, [licitaciones]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_avances', avances); }, [avances]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_vales_salida', valesSalida); }, [valesSalida]);
  useEffect(() => { saveToStorage(STORAGE_KEY + '_notified_eventos', notifiedEventos); }, [notifiedEventos]);
  useEffect(() => { saveToStorage(QUEUE_KEY, mutationQueue); }, [mutationQueue]);

  const enqueueMutation = useCallback((type: Mutation['type'], payload: Record<string, unknown>) => {
    const mutation: Mutation = { id: uid(), type, payload, timestamp: Date.now() };
    setMutationQueue(q => [...q, mutation]);
    return mutation.id;
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline || mutationQueue.length === 0) return;
    
    const [next, ...rest] = mutationQueue;

    const mapToSnakeCase = (obj: Record<string, unknown>) => {
      const mapped: Record<string, unknown> = {};
      for (const key in obj) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        mapped[snakeKey] = obj[key];
      }
      return mapped;
    };

    try {
      const payload = mapToSnakeCase(next.payload);
      if (['addProyecto', 'addMovimiento'].includes(next.type) && user?.id) {
        payload.created_by = user.id;
      }

      switch (next.type) {
        case 'addProyecto':
          await supabase.from('erp_proyectos').insert(payload);
          break;
        case 'updateProyecto':
          await supabase.from('erp_proyectos').update(payload).eq('id', next.payload.id);
          break;
        case 'deleteProyecto':
          await supabase.from('erp_proyectos').delete().eq('id', next.payload.id);
          break;
        case 'addMovimiento':
          await supabase.from('erp_movimientos').insert(payload);
          break;
        case 'deleteMovimiento':
          await supabase.from('erp_movimientos').delete().eq('id', next.payload.id);
          break;
        case 'addEmpleado':
          await supabase.from('erp_empleados').insert(payload);
          break;
        case 'updateEmpleado':
          await supabase.from('erp_empleados').update(payload).eq('id', next.payload.id);
          break;
        case 'deleteEmpleado':
          await supabase.from('erp_empleados').delete().eq('id', next.payload.id);
          break;
        case 'updateMaterial':
          await supabase.from('erp_materiales').update(payload).eq('id', next.payload.id);
          break;
        case 'addOrden':
          await supabase.from('erp_ordenes_compra').insert(payload);
          break;
        case 'updateOrden':
          await supabase.from('erp_ordenes_compra').update({ estado: next.payload.estado }).eq('id', next.payload.id);
          break;
        case 'addProveedor':
          await supabase.from('erp_proveedores').insert(payload);
          break;
        case 'updateProveedor':
          await supabase.from('erp_proveedores').update(payload).eq('id', next.payload.id);
          break;
        case 'deleteProveedor':
          await supabase.from('erp_proveedores').delete().eq('id', next.payload.id);
          break;
        case 'addEvento':
          await supabase.from('erp_eventos_calendario').insert(payload);
          break;
        case 'updateEvento':
          await supabase.from('erp_eventos_calendario').update(payload).eq('id', next.payload.id);
          break;
        case 'deleteEvento':
          await supabase.from('erp_eventos_calendario').delete().eq('id', next.payload.id);
          break;
        case 'addBitacora':
          await supabase.from('erp_bitacora').insert(payload);
          break;
        case 'updateBitacora':
          await supabase.from('erp_bitacora').update(payload).eq('id', next.payload.id);
          break;
        case 'deleteBitacora':
          await supabase.from('erp_bitacora').delete().eq('id', next.payload.id);
          break;
        case 'addPresupuesto':
          await supabase.from('erp_presupuestos').insert(payload);
          break;
        case 'updatePresupuesto':
          await supabase.from('erp_presupuestos').update(payload).eq('id', next.payload.id);
          break;
        case 'deletePresupuesto':
          await supabase.from('erp_presupuestos').delete().eq('id', next.payload.id);
          break;
        case 'addValeSalida':
          await supabase.from('erp_vales_salida').insert(payload);
          break;
        case 'deleteValeSalida':
          await supabase.from('erp_vales_salida').delete().eq('id', next.payload.id);
          break;
        case 'addAvance':
          await supabase.from('erp_avances').insert(payload);
          break;
        case 'deleteAvance':
          await supabase.from('erp_avances').delete().eq('id', next.payload.id);
          break;
        case 'addLicitacion':
          await supabase.from('erp_licitaciones').insert(payload);
          break;
        case 'updateLicitacion':
          await supabase.from('erp_licitaciones').update(payload).eq('id', next.payload.id);
          break;
        case 'deleteLicitacion':
          await supabase.from('erp_licitaciones').delete().eq('id', next.payload.id);
          break;
      }
      setMutationQueue(rest);
    } catch (err) {
      console.error('Error processing mutation queue:', err);
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
        console.log('[Auth] Redirecting to:', data.url);
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


