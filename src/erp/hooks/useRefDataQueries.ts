/**
 * React Query hooks para datos de referencia (catálogos).
 * Estos datos cambian poco y son leídos frecuentemente — ideales para SWR.
 *
 * Estrategia:
 * - staleTime: 5 min  → sirve caché sin refetch durante 5 min
 * - gcTime:    30 min → mantiene en memoria 30 min tras desmontar
 * - Fallback al store Zustand cuando Supabase no está disponible
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toCamel } from '@/erp/utils';
import { useErp } from '@/erp/store';
import type { InsumoBase, Material, Proveedor } from '@/erp/types';

const STALE_TIME = 5 * 60 * 1000;   // 5 min
const GC_TIME   = 30 * 60 * 1000;   // 30 min

function normalize<T>(rows: Record<string, any>[]): T[] {
  return rows.map(r => toCamel(r) as T);
}

async function fetchTable<T>(table: string): Promise<T[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw new Error(error.message);
  return normalize<T>(data ?? []);
}

// ─── Insumos Base ────────────────────────────────────────────────────────────

export const INSUMOS_QUERY_KEY = ['ref', 'insumos_base'] as const;

export function useInsumosBaseQuery() {
  const { insumosBase } = useErp();
  return useQuery<InsumoBase[]>({
    queryKey: INSUMOS_QUERY_KEY,
    queryFn: () => fetchTable<InsumoBase>('erp_insumos_base'),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: insumosBase,   // muestra datos del store mientras carga
    retry: 2,
  });
}

// ─── Materiales ──────────────────────────────────────────────────────────────

export const MATERIALES_QUERY_KEY = ['ref', 'materiales'] as const;

export function useMaterialesQuery() {
  const { materiales } = useErp();
  return useQuery<Material[]>({
    queryKey: MATERIALES_QUERY_KEY,
    queryFn: () => fetchTable<Material>('erp_materiales'),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: materiales,
    retry: 2,
  });
}

// ─── Proveedores ─────────────────────────────────────────────────────────────

export const PROVEEDORES_QUERY_KEY = ['ref', 'proveedores'] as const;

export function useProveedoresQuery() {
  const { proveedores } = useErp();
  return useQuery<Proveedor[]>({
    queryKey: PROVEEDORES_QUERY_KEY,
    queryFn: () => fetchTable<Proveedor>('erp_proveedores'),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: proveedores,
    retry: 2,
  });
}

// ─── Invalidación manual (llamar tras mutaciones) ────────────────────────────

export function useInvalidateRefData() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['ref'] });
}
