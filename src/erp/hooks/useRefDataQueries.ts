/**
 * Hooks para datos de referencia (catálogos) usando SOLO memoria local.
 * Estos datos cambian poco y ya están sincronizados con Supabase vía forceSync.
 * 
 * Estrategia offline-first:
 * - Usar directamente el store Zustand (ya tiene datos actualizados)
 * - No hacer llamadas directas a Supabase (evita duplicación de llamadas)
 * - Los datos se sincronizan automáticamente cuando hay conexión
 * - Funciona completamente offline
 */
import { useErp } from '@/erp/store';
import type { InsumoBase, Material, Proveedor } from '@/erp/types';

// ─── Insumos Base ────────────────────────────────────────────────────────────

export function useInsumosBase() {
  const { insumosBase } = useErp();
  return insumosBase;
}

// ─── Materiales ──────────────────────────────────────────────────────────────

export function useMateriales() {
  const { materiales } = useErp();
  return materiales;
}

// ─── Proveedores ─────────────────────────────────────────────────────────────

export function useProveedores() {
  const { proveedores } = useErp();
  return proveedores;
}
