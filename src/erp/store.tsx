import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
         'addEvento' | 'updateEvento' | 'deleteEvento' | 'addBitacora';
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

  const [mutationQueue, setMutationQueue] = useState<Mutation[]>(() => loadFromStorage(QUEUE_KEY, []));

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
  const ADMIN_NOMBRE = 'Oliver Salazar';

  const loadProfile = async (id: string, email?: string, userName?: string | null, avatarUrl?: string | null) => {
    let profileErr: unknown = null;
    let profileData: { nombre?: string; rol?: string } | null = null;
    try {
      const result = await supabase.from('profiles').select('nombre,rol').eq('id', id).maybeSingle();
      profileData = result.data;
      profileErr = result.error;
    } catch (e) {
      profileErr = e;
    }

    const fallbackNombre = (() => {
      const name = userName || email?.split('@')[0] || 'Usuario';
      return name.trim() || 'Usuario';
    })();
    const isAdmin = email === ADMIN_EMAIL;
    const rol = isAdmin ? 'Administrador' : ((profileData?.rol as Rol) || 'Administrador');
    const nombre = profileData?.nombre || fallbackNombre;

    setUser({ nombre, rol, avatar: avatarUrl ?? undefined });
    setView('dashboard');

    if (!profileData || profileErr || isAdmin) {
      const upsertPayload: Record<string, unknown> = { id, rol, nombre };
      try {
        await supabase.from('profiles').upsert(upsertPayload);
      } catch {}
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const metadata = data.session.user.user_metadata as Record<string, unknown> | null;
        const name = metadata?.full_name as string | null;
        const avatarUrl = (metadata?.picture || metadata?.avatar_url || metadata?.photo_url) as string | null;
        loadProfile(data.session.user.id, data.session.user.email || undefined, name, avatarUrl);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        const metadata = session.user.user_metadata as Record<string, unknown> | null;
        const name = metadata?.full_name as string | null;
        const avatarUrl = (metadata?.picture || metadata?.avatar_url || metadata?.photo_url) as string | null;
        loadProfile(session.user.id, session.user.email || undefined, name, avatarUrl);
      } else { setUser(null); setView('login'); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

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
  const updateProyecto = (id: string, patch: Partial<Proyecto>) => {
    setProyectos(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateProyecto', { id, ...patch });
  };
  const deleteProyecto = (id: string) => {
    setProyectos(s => s.filter(p => p.id !== id));
    enqueueMutation('deleteProyecto', { id });
  };

  const addMovimiento = async (m: Omit<Movimiento, 'id'>) => {
    const newMov = { ...m, id: uid() };
    setMovimientos(s => [newMov, ...s]);
    enqueueMutation('addMovimiento', newMov);
  };
  const deleteMovimiento = (id: string) => {
    setMovimientos(s => s.filter(m => m.id !== id));
    enqueueMutation('deleteMovimiento', { id });
  };

  const addEmpleado = async (e: Omit<Empleado, 'id'>) => {
    const newEmp = { ...e, id: uid() };
    setEmpleados(s => [...s, newEmp]);
    enqueueMutation('addEmpleado', newEmp);
  };
  const updateEmpleado = (id: string, patch: Partial<Empleado>) => {
    setEmpleados(s => s.map(e => e.id === id ? { ...e, ...patch } : e));
    enqueueMutation('updateEmpleado', { id, ...patch });
  };
  const deleteEmpleado = (id: string) => {
    setEmpleados(s => s.filter(e => e.id !== id));
    enqueueMutation('deleteEmpleado', { id });
  };

  const updateMaterial = (id: string, patch: Partial<Material>) => {
    setMateriales(s => s.map(m => m.id === id ? { ...m, ...patch } : m));
    enqueueMutation('updateMaterial', { id, ...patch });
  };

  const addOrden = (o: Omit<OrdenCompra, 'id'>) => {
    const newOrd = { ...o, id: uid() };
    setOrdenes(s => [newOrd, ...s]);
    enqueueMutation('addOrden', newOrd);
  };
  const updateOrden = (id: string, estado: OrdenCompra['estado']) => {
    setOrdenes(s => s.map(o => o.id === id ? { ...o, estado } : o));
    enqueueMutation('updateOrden', { id, estado });
  };

  const addProveedor = async (p: Omit<Proveedor, 'id'>) => {
    const newProv = { ...p, id: uid() };
    setProveedores(s => [...s, newProv]);
    enqueueMutation('addProveedor', newProv);
  };
  const updateProveedor = (id: string, patch: Partial<Proveedor>) => {
    setProveedores(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
    enqueueMutation('updateProveedor', { id, ...patch });
  };
  const deleteProveedor = (id: string) => {
    setProveedores(s => s.filter(p => p.id !== id));
    enqueueMutation('deleteProveedor', { id });
  };

  const addEvento = async (e: Omit<EventoCalendario, 'id'>) => {
    const newEvt = { ...e, id: uid() };
    setEventos(s => [...s, newEvt]);
    enqueueMutation('addEvento', newEvt);
  };
  const updateEvento = (id: string, patch: Partial<EventoCalendario>) => {
    setEventos(s => s.map(e => e.id === id ? { ...e, ...patch } : e));
    enqueueMutation('updateEvento', { id, ...patch });
  };
  const deleteEvento = (id: string) => {
    setEventos(s => s.filter(e => e.id !== id));
    enqueueMutation('deleteEvento', { id });
  };

  const addBitacora = (b: Omit<BitacoraEntry, 'id'>) => {
    const newBit = { ...b, id: uid() };
    setBitacora(s => [newBit, ...s]);
    enqueueMutation('addBitacora', newBit);
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
      bitacora, addBitacora,
    }}>
      {children}
    </Ctx.Provider>
  );
};


