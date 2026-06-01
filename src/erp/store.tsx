import React, { createContext, useContext, useState, useEffect } from 'react';
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

interface ErpState {
  view: View;
  setView: (v: View) => void;
  user: { nombre: string; rol: Rol } | null;
  allowedViews: View[];
  authError: string;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, nombre: string, rol: Rol) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;

  proyectos: Proyecto[];
  addProyecto: (p: Omit<Proyecto, 'id'>) => void;
  updateProyecto: (id: string, patch: Partial<Proyecto>) => void;
  deleteProyecto: (id: string) => void;
  movimientos: Movimiento[];
  addMovimiento: (m: Omit<Movimiento, 'id'>) => void;
  deleteMovimiento: (id: string) => void;
  empleados: Empleado[];
  addEmpleado: (e: Omit<Empleado, 'id'>) => void;
  updateEmpleado: (id: string, patch: Partial<Empleado>) => void;
  deleteEmpleado: (id: string) => void;
  materiales: Material[];
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  ordenes: OrdenCompra[];
  updateOrden: (id: string, estado: OrdenCompra['estado']) => void;
  addOrden: (o: Omit<OrdenCompra, 'id'>) => void;
  proveedores: Proveedor[];
  addProveedor: (p: Omit<Proveedor, 'id'>) => void;
  updateProveedor: (id: string, patch: Partial<Proveedor>) => void;
  deleteProveedor: (id: string) => void;
  eventos: EventoCalendario[];
  addEvento: (e: Omit<EventoCalendario, 'id'>) => void;
  updateEvento: (id: string, patch: Partial<EventoCalendario>) => void;
  deleteEvento: (id: string) => void;
  bitacora: BitacoraEntry[];
  addBitacora: (b: Omit<BitacoraEntry, 'id'>) => void;
}

const Ctx = createContext<ErpState>({} as ErpState);
export const useErp = () => useContext(Ctx);
export const uid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
};

function usePersist<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try { const raw = localStorage.getItem('wm_' + key); return raw ? JSON.parse(raw) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem('wm_' + key, JSON.stringify(state)); } catch {} }, [key, state]);
  return [state, setState];
}

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<ErpState['user']>(null);
  const [authError, setAuthError] = useState('');

  const [proyectos, setProyectos] = usePersist<Proyecto[]>('proyectos', SEED_PROYECTOS);
  const [movimientos, setMovimientos] = usePersist<Movimiento[]>('movimientos', SEED_MOVIMIENTOS);
  const [empleados, setEmpleados] = usePersist<Empleado[]>('empleados', SEED_EMPLEADOS);
  const [materiales, setMateriales] = usePersist<Material[]>('materiales', SEED_MATERIALES);
  const [ordenes, setOrdenes] = usePersist<OrdenCompra[]>('ordenes', SEED_OC);
  const [proveedores, setProveedores] = usePersist<Proveedor[]>('proveedores', SEED_PROVEEDORES);
  const [eventos, setEventos] = usePersist<EventoCalendario[]>('eventos', []);
  const [bitacora, setBitacora] = usePersist<BitacoraEntry[]>('bitacora', []);

  const ADMIN_EMAIL = 'salazaroliveros@gmail.com';
  const ADMIN_NOMBRE = 'Oliver Salazar';

  const loadProfile = async (id: string, email?: string, userName?: string | null) => {
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

    setUser({ nombre, rol });
    setView('dashboard');

    if (!profileData || profileErr || isAdmin) {
      const upsertPayload: Record<string, unknown> = {
        id,
        rol,
        nombre,
      };
      try {
        await supabase.from('profiles').upsert(upsertPayload);
      } catch {
        // ignore profile repair errors
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const name = (data.session.user.user_metadata as Record<string, unknown> | null)?.full_name as string | null;
        loadProfile(data.session.user.id, data.session.user.email || undefined, name);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        const name = (session.user.user_metadata as Record<string, unknown> | null)?.full_name as string | null;
        loadProfile(session.user.id, session.user.email || undefined, name);
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

  const addProyecto = (p: Omit<Proyecto, 'id'>) => setProyectos(s => [...s, { ...p, id: uid() }]);
  const updateProyecto = (id: string, patch: Partial<Proyecto>) => setProyectos(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
  const deleteProyecto = (id: string) => setProyectos(s => s.filter(p => p.id !== id));
  const addMovimiento = (m: Omit<Movimiento, 'id'>) => setMovimientos(s => [{ ...m, id: uid() }, ...s]);
  const deleteMovimiento = (id: string) => setMovimientos(s => s.filter(m => m.id !== id));
  const addEmpleado = (e: Omit<Empleado, 'id'>) => setEmpleados(s => [...s, { ...e, id: uid() }]);
  const updateEmpleado = (id: string, patch: Partial<Empleado>) => setEmpleados(s => s.map(e => e.id === id ? { ...e, ...patch } : e));
  const deleteEmpleado = (id: string) => setEmpleados(s => s.filter(e => e.id !== id));
  const updateMaterial = (id: string, patch: Partial<Material>) => setMateriales(s => s.map(m => m.id === id ? { ...m, ...patch } : m));
  const updateOrden = (id: string, estado: OrdenCompra['estado']) => setOrdenes(s => s.map(o => o.id === id ? { ...o, estado } : o));
  const addOrden = (o: Omit<OrdenCompra, 'id'>) => setOrdenes(s => [{ ...o, id: uid() }, ...s]);
  const addEvento = (e: Omit<EventoCalendario, 'id'>) => setEventos(s => [...s, { ...e, id: uid() }]);
  const updateEvento = (id: string, patch: Partial<EventoCalendario>) => setEventos(s => s.map(e => e.id === id ? { ...e, ...patch } : e));
  const deleteEvento = (id: string) => setEventos(s => s.filter(e => e.id !== id));
  const addProveedor = (p: Omit<Proveedor, 'id'>) => setProveedores(s => [...s, { ...p, id: uid() }]);
  const updateProveedor = (id: string, patch: Partial<Proveedor>) => setProveedores(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
  const deleteProveedor = (id: string) => setProveedores(s => s.filter(p => p.id !== id));
  const addBitacora = (b: Omit<BitacoraEntry, 'id'>) => setBitacora(s => [{ ...b, id: uid() }, ...s]);

  return (
    <Ctx.Provider value={{
      view, setView, user, allowedViews, authError, signIn, signUp, signInWithGoogle, logout,
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
