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
}

const Ctx = createContext<ErpState>({} as ErpState);
export const useErp = () => useContext(Ctx);
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
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
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
  const [notifiedEventos, setNotifiedEventos] = useState<string[]>(() => loadFromStorage(STORAGE_KEY + '_notified_eventos', []));

  const [mutationQueue, setMutationQueue] = useState<Mutation[]>(() => loadFromStorage(QUEUE_KEY, []));

  const fetchInitialData = useCallback(async () => {
    try {
      const [
        { data: p }, { data: m }, { data: e }, { data: mat }, { data: o }, { data: prov }, { data: evt }, { data: bit }
      ] = await Promise.all([
        supabase.from('erp_proyectos').select('*'),
        supabase.from('erp_movimientos').select('*').order('fecha', { ascending: false }),
        supabase.from('erp_empleados').select('*'),
        supabase.from('erp_materiales').select('*'),
        supabase.from('erp_ordenes_compra').select('*').order('created_at', { ascending: false }),
        supabase.from('erp_proveedores').select('*'),
        supabase.from('erp_eventos_calendario').select('*'),
        supabase.from('erp_bitacora').select('*').order('fecha', { ascending: false }),
      ]);

      const mapFromSnakeCase = (obj: any) => {
        const mapped: any = {};
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
    } catch (err) {
      console.error('Error fetching initial data:', err);
    }
  }, []);

  // Listen for Supabase auth state changes
  useEffect(() => {
    let mounted = true;

    const handleAuth = (session: any) => {
      if (!mounted) return;
      
      console.log('Handling Auth, session user:', session?.user?.email);
      
      if (session?.user) {
        const userData = session.user.user_metadata;
        setUser({
          id: session.user.id,
          nombre: userData?.full_name || userData?.name || userData?.nombre || session.user.email?.split('@')[0] || 'Usuario',
          rol: (userData?.rol || 'Residente') as Rol,
          avatar: userData?.avatar_url || userData?.picture || userData?.avatar,
        });
        setView('dashboard');
        setAuthError('');
        setInitializing(false);
        fetchInitialData();
      } else {
        setUser(null);
        // Detect if we are in an OAuth redirect flow
        const isAuthCallback = window.location.hash.includes('access_token=') || 
                             window.location.hash.includes('error=') ||
                             window.location.search.includes('code=');
        
        console.log('No user session. isAuthCallback:', isAuthCallback);

        if (!isAuthCallback) {
          setView('login');
          setInitializing(false);
        }
        // If it IS a callback, we stay in 'initializing' (true) until onAuthStateChange picks it up
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial getSession result:', session ? 'Session found' : 'No session');
      handleAuth(session);
    }).catch(err => {
      console.error('getSession error:', err);
      if (mounted) setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Supabase Auth Event Triggered:', event, 'Session user:', session?.user?.email);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        handleAuth(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setView('login');
        setInitializing(false);
      } else if (event === 'INITIAL_SESSION') {
        // INITIAL_SESSION can sometimes fire after we manually checked getSession
        if (session) handleAuth(session);
      }
    });

    // Timeout safety for initializing state - increased to 8s for slower OAuth processing
    const timeout = setTimeout(() => {
      if (mounted && initializing) {
        console.log('Auth initialization timeout reached');
        // If we're still stuck but have no session, go to login
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            setView('login');
          }
          setInitializing(false);
        });
      }
    }, 8000);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearTimeout(timeout);
    };
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

    const mapToSnakeCase = (obj: any) => {
      const mapped: any = {};
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
      }
    } catch (err) {
      console.error('Error processing mutation queue:', err);
      setMutationQueue(q => [next, ...q]);
    }
  }, [isOnline, mutationQueue, user]);

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
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setAuthError(err.message || 'Error al conectar con Google');
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
    }}>
      {children}
    </Ctx.Provider>
  );
};


