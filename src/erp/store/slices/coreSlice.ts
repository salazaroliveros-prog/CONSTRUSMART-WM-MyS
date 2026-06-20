import { create } from 'zustand';
import { sanitizarObjeto } from '@/lib/security';
import { setEmpresaInfo, APP_SETTINGS_DEFAULTS } from '../utils';
import type { AppSettings, Mutation } from '../types';

const RATE_LIMIT_MS = 100;
const lastMutationCall: Record<string, number> = {};

function checkRateLimit(type: string): boolean {
  const now = Date.now();
  const last = lastMutationCall[type];
  if (last && now - last < RATE_LIMIT_MS) { console.warn(`[RateLimit] ${type} bloqueada`); return false; }
  lastMutationCall[type] = now;
  return true;
}

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random()*16|0>>(c==='x'?0:1)).toString(16));
}

export interface CoreState {
  mutationQueue: Mutation[];
  syncMessage: string;
  syncCooldown: boolean;
  notificaciones: any[];
  isOnline: boolean;
  selectedProyectoId: string | null;
  appSettings: AppSettings;
  setMutationQueue: (v: Mutation[] | ((prev: Mutation[]) => Mutation[])) => void;
  setSyncMessage: (v: string) => void;
  setSyncCooldown: (v: boolean) => void;
  setNotificaciones: (v: any[] | ((prev: any[]) => any[])) => void;
  setIsOnline: (v: boolean) => void;
  setSelectedProyectoId: (v: string | null) => void;
  setAppSettings: (v: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  enqueueMutation: (type: string, payload: Record<string, any>) => string;
  addNotificacion: (tipo: string, titulo: string, mensaje: string, proyectoId?: string | null, referenciaId?: string) => void;
  markNotificacionLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
}

export const createCoreSlice = (set: any, get: any): CoreState => ({
  mutationQueue: [],
  syncMessage: '',
  syncCooldown: false,
  notificaciones: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  selectedProyectoId: null,
  appSettings: APP_SETTINGS_DEFAULTS,

  setMutationQueue: (v) => set({ mutationQueue: typeof v === 'function' ? v(get().mutationQueue) : v }),
  setSyncMessage: (v) => set({ syncMessage: v }),
  setSyncCooldown: (v) => set({ syncCooldown: v }),
  setNotificaciones: (v) => set({ notificaciones: typeof v === 'function' ? v(get().notificaciones) : v }),
  setIsOnline: (v) => set({ isOnline: v }),
  setSelectedProyectoId: (v) => set({ selectedProyectoId: v }),
  setAppSettings: (v) => {
    const next = typeof v === 'function' ? v(get().appSettings) : v;
    if (next.empresaInfo) setEmpresaInfo(next.empresaInfo);
    set({ appSettings: next });
  },

  enqueueMutation: (type, payload) => {
    if (!checkRateLimit(type)) return '';
    const safePayload = sanitizarObjeto(payload);
    const mutation: Mutation = { id: uid(), type, payload: safePayload, timestamp: Date.now(), retryCount: 0 };
    get().setMutationQueue((q: Mutation[]) => { const trimmed = q.length >= 100 ? q.slice(1) : q; return [...trimmed, mutation]; });
    return mutation.id;
  },

  addNotificacion: (tipo, titulo, mensaje, proyectoId, referenciaId) => {
    get().setNotificaciones((prev: any[]) => {
      const existing = proyectoId ? prev.find((n: any) => n.proyectoId === proyectoId && n.titulo === titulo && !n.leido) : undefined;
      if (existing) return prev.map((n: any) => n.id === existing.id ? { ...n, mensaje: `${n.mensaje} (+1)`, createdAt: new Date().toISOString(), referenciaId: referenciaId || n.referenciaId } : n);
      const nueva = { id: uid(), tipo, titulo, mensaje, proyectoId, referenciaId, leido: false, createdAt: new Date().toISOString() };
      get().enqueueMutation('addNotificacion', nueva);
      return [nueva, ...prev];
    });
  },

  markNotificacionLeida: (id) => {
    get().setNotificaciones((prev: any[]) => prev.map((n: any) => n.id === id ? { ...n, leido: true } : n));
    get().enqueueMutation('markNotificacionLeida', { id, leido: true });
  },

  marcarTodasLeidas: () => {
    const unread = get().notificaciones.filter((n: any) => !n.leido);
    get().setNotificaciones((prev: any[]) => prev.map((n: any) => ({ ...n, leido: true })));
    unread.forEach((n: any) => get().enqueueMutation('markNotificacionLeida', { id: n.id, leido: true }));
  },
});
