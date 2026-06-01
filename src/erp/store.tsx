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

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<ErpState['user']>(null);
  const [authError, setAuthError] = useState('');

  const [proyectos, setProyectos] = useState<Proyecto[]>(() => {
    try { const raw = localStorage.getItem('wm_proyectos'); return raw ? JSON.parse(raw) : SEED_PROYECTOS; } catch { return SEED_PROYECTOS; }
  });
  const [movimientos, setMovimientos] = useState<Movimiento[]>(() => {
    try { const raw = localStorage.getItem('wm_movimientos'); return raw ? JSON.parse(raw) : SEED_MOVIMIENTOS; } catch { return SEED_MOVIMIENTOS; }
  });
  const [empleados, setEmpleados] = useState<Empleado[]>(() => {
    try { const raw = localStorage.getItem('wm_empleados'); return raw ? JSON.parse(raw) : SEED_EMPLEADOS; } catch { return SEED_EMPLEADOS; }
  });
  const [materiales, setMateriales] = useState<Material[]>(() => {
    try { const raw = localStorage.getItem('wm_materiales'); return raw ? JSON.parse(raw) : SEED_MATERIALES; } catch { return SEED_MATERIALES; }
  });
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>(() => {
    try { const raw = localStorage.getItem('wm_ordenes'); return raw ? JSON.parse(raw) : SEED_OC; } catch { return SEED_OC; }
  });
  const [proveedores, setProveedores] = useState<Proveedor[]>(() => {
    try { const raw = localStorage.getItem('wm_proveedores'); return raw ? JSON.parse(raw) : SEED_PROVEEDORES; } catch { return SEED_PROVEEDORES; }
  });
  const [eventos, setEventos] = useState<EventoCalendario[]>(() => {
    try { const raw = localStorage.getItem('wm_eventos'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>(() => {
    try { const raw = localStorage.getItem('wm_bitacora'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  useEffect(() => { localStorage.setItem('wm_proyectos', JSON.stringify(proyectos)); }, [proyectos]);
  useEffect(() => { localStorage.setItem('wm_movimientos', JSON.stringify(movimientos)); }, [movimientos]);
  useEffect(() => { localStorage.setItem('wm_empleados', JSON.stringify(empleados)); }, [empleados]);
  useEffect(() => { localStorage.setItem('wm_materiales', JSON.stringify(materiales)); }, [materiales]);
  useEffect(() => { localStorage.setItem('wm_ordenes', JSON.stringify(ordenes)); }, [ordenes]);
  useEffect(() => { localStorage.setItem('wm_proveedores', JSON.stringify(proveedores)); }, [proveedores]);
  useEffect(() => { localStorage.setItem('wm_eventos', JSON.stringify(eventos)); }, [eventos]);
  useEffect(() => { localStorage.setItem('wm_bitacora', JSON.stringify(bitacora)); }, [bitacora]);

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

  const addProyecto = async (p: Omit<Proyecto, 'id'>) => {
    const newProj = { ...p, id: uid() };
    setProyectos(s => [...s, newProj]);
  };
  const updateProyecto = (id: string, patch: Partial<Proyecto>) => setProyectos(s => s.map(p => p.id === id ? { ...p, ...patch } : p));
  const deleteProyecto = (id: string) => setProyectos(s => s.filter(p => p.id !== id));
  const addMovimiento = async (m: Omit<Movimiento, 'id'>) => {
    const newMov = { ...m, id: uid() };
    setMovimientos(s => [{ ...newMov, id: uid() }, ...s]);
  };
  const deleteMovimiento = (id: string) => setMovimientos(s => s.filter(m => m.id !== id));
  const addEmpleado = async (e: Omit<Empleado, 'id'>) => {
    const newEmp = { ...e, id: uid() };
    setEmpleados(s => [...s, newEmp]);
  };
  const updateEmpleado = (id: string, patch: Partial<Empleado>) => setEmpleados(s => s.map(e => e.id === id ? { ...e, ...patch } : e));
  const deleteEmpleado = (id: string) => setEmpleados(s => s.filter(e => e.id !== id));
  const updateMaterial = (id: string, patch: Partial<Material>) => setMateriales(s => s.map(m => m.id === id ? { ...m, ...patch } : m));
  const updateOrden = (id: string, estado: OrdenCompra['estado']) => setOrdenes(s => s.map(o => o.id === id ? { ...o, estado } : o));
  const addOrden = (o: Omit<OrdenCompra, 'id'>) => setOrdenes(s => [{ ...o, id: uid() }, ...s]);
  const addEvento = async (e: Omit<EventoCalendario, 'id'>) => {
    const newEvt = { ...e, id: uid() };
    setEventos(s => [...s, newEvt]);
  };
  const updateEvento = (id: string, patch: Partial<EventoCalendario>) => setEventos(s => s.map(e => e.id === id ? { ...e, ...patch } : e));
  const deleteEvento = (id: string) => setEventos(s => s.filter(e => e.id !== id));
  const addProveedor = async (p: Omit<Proveedor, 'id'>) => {
    const newProv = { ...p, id: uid() };
    setProveedores(s => [...s, newProv]);
  };
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
