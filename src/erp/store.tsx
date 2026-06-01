import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';
import {
  Proyecto, Movimiento, Empleado, Material, OrdenCompra, Proveedor, EventoCalendario, BitacoraEntry,
} from './types';
import {
  SEED_PROYECTOS, SEED_MOVIMIENTOS, SEED_EMPLEADOS, SEED_MATERIALES, SEED_OC, SEED_PROVEEDORES,
} from './data';

export type View = 'login' | 'dashboard' | 'proyectos' | 'presupuestos' | 'seguimiento' | 'financiero' | 'rrhh' | 'bodega';
export type Rol = 'Administrador' | 'Gerente' | 'Residente' | 'Compras' | 'Bodeguero';

export const ALLOWED: Record<Rol, View[]> = {
  Administrador: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero', 'rrhh', 'bodega'],
  Gerente: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero', 'rrhh', 'bodega'],
  Residente: ['dashboard', 'proyectos', 'presupuestos', 'seguimiento'],
  Compras: ['dashboard', 'bodega', 'proyectos'],
  Bodeguero: ['dashboard', 'bodega'],
};

interface Mutation {
  id: string;
  type: 'addProyecto' | 'updateProyecto' | 'deleteProyecto' | 'addMovimiento' | 'deleteMovimiento' |
         'addEmpleado' | 'updateEmpleado' | 'deleteEmpleado' | 'updateMaterial' |
         'addOrden' | 'updateOrden' | 'addProveedor' | 'updateProveedor' | 'deleteProveedor' |
         'addEvento' | 'updateEvento' | 'deleteEvento' | 'addBitacora' | 'updateBitacora' | 'deleteBitacora';
  payload: Record<string, unknown>;
  timestamp: number;
}

interface ErpState {
  view: View;
  setView: (v: View) => void;
  user: { nombre: string; rol: Rol; avatar?: string } | null;
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
}

const Ctx = createContext<ErpState>({} as ErpState);
export const useErp = () => useContext(Ctx);
export const uid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
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
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<ErpState['user']>(null);
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
  const [notifiedEventos, setNotifiedEventos] = useState<string[]>(() => loadFromStorage(STORAGE_KEY + '_notified_eventos', []));

  const [mutationQueue, setMutationQueue] = useState<Mutation[]>(() => loadFromStorage(QUEUE_KEY, []));

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userData = session.user.user_metadata;
        setUser({
          nombre: userData?.nombre || session.user.email?.split('@')[0] || 'Usuario',
          rol: (userData?.rol || 'Residente') as Rol,
          avatar: session.user.user_metadata?.avatar_url,
        });
        setView('dashboard');
        setAuthError('');
      } else {
        setUser(null);
        setView('login');
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

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
    setMutationQueue(rest);

    try {
      switch (next.type) {
        case 'addProyecto':
          await supabase.from('erp_proyectos').insert(next.payload);
          break;
        case 'updateProyecto':
          await supabase.from('erp_proyectos').update(next.payload).eq('id', next.payload.id);
          break;
        case 'deleteProyecto':
          await supabase.from('erp_proyectos').delete().eq('id', next.payload.id);
          break;
        case 'addMovimiento':
          await supabase.from('erp_movimientos').insert(next.payload);
          break;
        case 'deleteMovimiento':
          await supabase.from('erp_movimientos').delete().eq('id', next.payload.id);
          break;
        case 'addEmpleado':
          await supabase.from('erp_empleados').insert(next.payload);
          break;
        case 'updateEmpleado':
          await supabase.from('erp_empleados').update(next.payload).eq('id', next.payload.id);
          break;
        case 'deleteEmpleado':
          await supabase.from('erp_empleados').delete().eq('id', next.payload.id);
          break;
        case 'updateMaterial':
          await supabase.from('erp_materiales').update(next.payload).eq('id', next.payload.id);
          break;
        case 'addOrden':
          await supabase.from('erp_ordenes_compra').insert(next.payload);
          break;
        case 'updateOrden':
          await supabase.from('erp_ordenes_compra').update({ estado: next.payload.estado }).eq('id', next.payload.id);
          break;
        case 'addProveedor':
          await supabase.from('erp_proveedores').insert(next.payload);
          break;
        case 'updateProveedor':
          await supabase.from('erp_proveedores').update(next.payload).eq('id', next.payload.id);
          break;
        case 'deleteProveedor':
          await supabase.from('erp_proveedores').delete().eq('id', next.payload.id);
          break;
        case 'addEvento':
          await supabase.from('erp_eventos_calendario').insert(next.payload);
          break;
        case 'updateEvento':
          await supabase.from('erp_eventos_calendario').update(next.payload).eq('id', next.payload.id);
          break;
        case 'deleteEvento':
          await supabase.from('erp_eventos_calendario').delete().eq('id', next.payload.id);
          break;
        case 'addBitacora':
          await supabase.from('erp_bitacora').insert(next.payload);
          break;
        case 'updateBitacora':
          await supabase.from('erp_bitacora').update(next.payload).eq('id', next.payload.id);
          break;
        case 'deleteBitacora':
          await supabase.from('erp_bitacora').delete().eq('id', next.payload.id);
          break;
      }
    } catch (err) {
      setMutationQueue(q => [next, ...q]);
    }
  }, [isOnline, mutationQueue]);

  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(processQueue, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, mutationQueue, processQueue]);

  const ADMIN_EMAIL = 'salazaroliveros@gmail.com';

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
  const signUp = async (email: string, pass: string, nombre: string, rol: Rol) => {
    setAuthError('');
    const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { nombre, rol } } });
    if (error) setAuthError(error.message);
  };
  const logout = async () => { await supabase.auth.signOut(); setUser(null); setView('login'); };

  const signInWithGoogle = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) setAuthError(error.message);
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

  return (
    <Ctx.Provider value={{
      view, setView, user, allowedViews, authError, signIn, signUp, signInWithGoogle, logout,
      isOnline,
      proyectos, addProyecto, updateProyecto, deleteProyecto,
      movimientos, addMovimiento, deleteMovimiento,
      empleados, addEmpleado, updateEmpleado, deleteEmpleado,
      materiales, updateMaterial,
      ordenes, updateOrden, addOrden,
      proveedores, addProveedor, updateProveedor, deleteProveedor,
      eventos, addEvento, updateEvento, deleteEvento,
      bitacora, addBitacora, updateBitacora, deleteBitacora,
    }}>
      {children}
    </Ctx.Provider>
  );
};


