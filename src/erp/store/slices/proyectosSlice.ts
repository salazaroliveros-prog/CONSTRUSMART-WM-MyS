import { create } from 'zustand';
import type { Proyecto, Presupuesto, Hito, AvanceObra, Material, OrdenCompra, ValeSalida, Notificacion } from '../types';

export interface ProyectosState {
  proyectos: Proyecto[];
  presupuestos: Presupuesto[];
  hitos: Hito[];
  avances: AvanceObra[];
  materiales: Material[];
  ordenes: OrdenCompra[];
  valesSalida: ValeSalida[];
  setProyectos: (v: Proyecto[] | ((prev: Proyecto[]) => Proyecto[])) => void;
  setPresupuestos: (v: Presupuesto[] | ((prev: Presupuesto[]) => Presupuesto[])) => void;
  setHitos: (v: Hito[] | ((prev: Hito[]) => Hito[])) => void;
  setAvances: (v: AvanceObra[] | ((prev: AvanceObra[]) => AvanceObra[])) => void;
  setMateriales: (v: Material[] | ((prev: Material[]) => Material[])) => void;
  setOrdenes: (v: OrdenCompra[] | ((prev: OrdenCompra[]) => OrdenCompra[])) => void;
  setValesSalida: (v: ValeSalida[] | ((prev: ValeSalida[]) => ValeSalida[])) => void;
  addProyecto: (p: Omit<Proyecto, 'id' | 'version'>) => void;
  updateProyecto: (id: string, patch: Partial<Proyecto>) => void;
  deleteProyecto: (id: string) => void;
  addPresupuesto: (p: Presupuesto) => void;
  updatePresupuesto: (id: string, patch: Partial<Presupuesto>) => void;
  deletePresupuesto: (id: string) => void;
  addHito: (h: Omit<Hito, 'id'>) => void;
  updateHito: (id: string, patch: Partial<Hito>) => void;
  deleteHito: (id: string) => void;
  addAvance: (a: Omit<AvanceObra, 'id'>) => void;
  deleteAvance: (id: string) => void;
  addMaterial: (m: Omit<Material, 'id'>) => void;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  addOrden: (o: Omit<OrdenCompra, 'id'>) => void;
  updateOrden: (id: string, estado: OrdenCompra['estado']) => void;
  addValeSalida: (v: Omit<ValeSalida, 'id'>) => void;
  deleteValeSalida: (id: string) => void;
}

export const createProyectosSlice = (set: any, get: any): ProyectosState => ({
  proyectos: [],
  presupuestos: [],
  hitos: [],
  avances: [],
  materiales: [],
  ordenes: [],
  valesSalida: [],

  setProyectos: (v) => set({ proyectos: typeof v === 'function' ? v(get().proyectos) : v }),
  setPresupuestos: (v) => set({ presupuestos: typeof v === 'function' ? v(get().presupuestos) : v }),
  setHitos: (v) => set({ hitos: typeof v === 'function' ? v(get().hitos) : v }),
  setAvances: (v) => set({ avances: typeof v === 'function' ? v(get().avances) : v }),
  setMateriales: (v) => set({ materiales: typeof v === 'function' ? v(get().materiales) : v }),
  setOrdenes: (v) => set({ ordenes: typeof v === 'function' ? v(get().ordenes) : v }),
  setValesSalida: (v) => set({ valesSalida: typeof v === 'function' ? v(get().valesSalida) : v }),

  addProyecto: (p) => {
    const n = { ...p, id: uid(), version: 1 } as Proyecto;
    get().setProyectos((prev: Proyecto[]) => [n, ...prev]);
    get().enqueueMutation('addProyecto', n);
  },
  updateProyecto: (id, patch) => {
    const proyecto = get().proyectos.find((p: Proyecto) => p.id === id);
    if (!proyecto) return;
    const oldEstado = proyecto.estado;
    const newEstado = patch.estado || oldEstado;
    const transicionesValidas: Record<string, string[]> = { planeacion: ['ejecucion'], ejecucion: ['pausado','finalizado'], pausado: ['ejecucion'], finalizado: [] };
    if (oldEstado !== newEstado && !transicionesValidas[oldEstado]?.includes(newEstado)) { console.warn(`[StateMachine] Transición inválida: ${oldEstado} → ${newEstado}`); return; }
    if (newEstado === 'ejecucion' && oldEstado === 'planeacion') {
      const tienePresupuesto = get().presupuestos.some((p: Presupuesto) => p.proyectoId === id && p.estado === 'aprobado');
      const tieneHitos = get().hitos.some((h: Hito) => h.proyectoId === id);
      if (!tienePresupuesto) { console.warn('[StateMachine] Requiere presupuesto aprobado'); return; }
      if (!tieneHitos) { console.warn('[StateMachine] Requiere al menos un hito definido'); return; }
    }
    if (newEstado === 'pausado' && !(patch as any).motivoPausa) { console.warn('[StateMachine] motivoPausa es requerido para pausar'); return; }
    if (newEstado === 'finalizado' && oldEstado === 'ejecucion') {
      const current = get().proyectos.find((p: Proyecto) => p.id === id);
      if (current && (current.avanceFisico < 100 || current.avanceFinanciero < 100)) { console.warn('[StateMachine] Requiere avance 100% para finalizar'); return; }
    }
    const etapaValida: Record<string, string[]> = { planeacion: ['planificacion','diseno','preconstruccion'], ejecucion: ['construccion'], pausado: ['planificacion','diseno','preconstruccion','construccion','cierre'], finalizado: ['cierre'] };
    if (newEstado && (patch as any).etapa && !etapaValida[newEstado]?.includes((patch as any).etapa)) { console.warn(`[StateMachine] Inconsistencia: estado=${newEstado} no permite etapa=${(patch as any).etapa}`); return; }
    if (oldEstado === 'planeacion' && (patch as any).avanceFisico && (patch as any).avanceFisico > 0) { console.warn('[StateMachine] Proyecto en planeación no puede tener avance físico > 0'); return; }
    if (oldEstado === 'planeacion' && (patch as any).avanceFinanciero && (patch as any).avanceFinanciero > 0) { console.warn('[StateMachine] Proyecto en planeación no puede tener avance financiero > 0'); return; }
    if (newEstado === 'finalizado') (patch as any).avanceFisico = 100;
    (patch as any).avanceFinanciero = (patch as any).avanceFinanciero ?? ((patch as any).avanceFisico);
    const expectedVersion = proyecto.version || 1;
    if ((patch as any).version !== undefined && (patch as any).version < expectedVersion) { console.warn(`[OptimisticLock] ${id}: v${expectedVersion}`); return; }
    (patch as any).version = expectedVersion + 1;
    get().setProyectos((prev: Proyecto[]) => prev.map((p: Proyecto) => p.id === id ? { ...p, ...patch } : p));
    get().enqueueMutation('updateProyecto', { id, ...patch });
  },
  deleteProyecto: (id) => {
    get().setProyectos((prev: Proyecto[]) => prev.filter((p: Proyecto) => p.id !== id));
    get().enqueueMutation('deleteProyecto', { id });
  },

  addPresupuesto: (p) => {
    const n = { ...p, id: uid() };
    get().setPresupuestos((prev: Presupuesto[]) => [n, ...prev]);
    get().enqueueMutation('addPresupuesto', n);
  },
  updatePresupuesto: (id, patch) => {
    get().setPresupuestos((prev: Presupuesto[]) => prev.map((p: Presupuesto) => p.id === id ? { ...p, ...patch } : p));
    get().enqueueMutation('updatePresupuesto', { id, ...patch });
  },
  deletePresupuesto: (id) => {
    get().setPresupuestos((prev: Presupuesto[]) => prev.filter((p: Presupuesto) => p.id !== id));
    get().enqueueMutation('deletePresupuesto', { id });
  },
  getPresupuestoByProyecto: (proyectoId: string) => get().presupuestos.find((p: Presupuesto) => p.proyectoId === proyectoId),

  addHito: (h) => {
    const n = { ...h, id: uid() };
    get().setHitos((prev: Hito[]) => [n, ...prev]);
    get().enqueueMutation('addHito', n);
  },
  updateHito: (id, patch) => {
    get().setHitos((prev: Hito[]) => prev.map((h: Hito) => h.id === id ? { ...h, ...patch } : h));
    get().enqueueMutation('updateHito', { id, ...patch });
  },
  deleteHito: (id) => {
    get().setHitos((prev: Hito[]) => prev.filter((h: Hito) => h.id !== id));
    get().enqueueMutation('deleteHito', { id });
  },

  addAvance: (a) => {
    const n = { ...a, id: uid() };
    get().setAvances((prev: AvanceObra[]) => [n, ...prev]);
    get().enqueueMutation('addAvance', n);
  },
  deleteAvance: (id) => {
    get().setAvances((prev: AvanceObra[]) => prev.filter((a: AvanceObra) => a.id !== id));
    get().enqueueMutation('deleteAvance', { id });
  },

  addMaterial: (m) => {
    const n = { ...m, id: uid() };
    get().setMateriales((prev: Material[]) => [n, ...prev]);
    get().enqueueMutation('addMaterial', n);
  },
  updateMaterial: (id, patch) => {
    get().setMateriales((prev: Material[]) => prev.map((m: Material) => m.id === id ? { ...m, ...patch } : m));
    get().enqueueMutation('updateMaterial', { id, ...patch });
  },
  deleteMaterial: (id) => {
    get().setMateriales((prev: Material[]) => prev.filter((m: Material) => m.id !== id));
    get().enqueueMutation('deleteMaterial', { id });
  },

  addOrden: (o) => {
    const n = { ...o, id: uid() };
    get().setOrdenes((prev: OrdenCompra[]) => [n, ...prev]);
    get().enqueueMutation('addOrden', n);
  },
  updateOrden: (id, estado) => {
    const orden = get().ordenes.find((o: OrdenCompra) => o.id === id);
    get().setOrdenes((prev: OrdenCompra[]) => prev.map((o: OrdenCompra) => o.id === id ? { ...o, estado } : o));
    if ((estado === 'aprobado' || estado === 'recibida') && orden?.items) {
      const ids = orden.items.map((i: any) => i.materialId).filter(Boolean);
      if (ids.length) get().setMateriales((prev: Material[]) => prev.map((m: Material) => {
        if (!ids.includes(m.id)) return m;
        const linea = orden.items.find((it: any) => it.materialId === m.id);
        return { ...m, stock: m.stock + (linea?.cantidad ?? 0), ultimaActualizacionPresupuesto: new Date().toISOString() };
      }));
    }
    get().enqueueMutation('updateOrden', { id, estado });
  },

  addValeSalida: (v) => {
    const n = { ...v, id: uid() };
    get().setValesSalida((prev: ValeSalida[]) => [n, ...prev]);
    get().enqueueMutation('addValeSalida', n);
  },
  deleteValeSalida: (id) => {
    get().setValesSalida((prev: ValeSalida[]) => prev.filter((v: ValeSalida) => v.id !== id));
    get().enqueueMutation('deleteValeSalida', { id });
  },
});
