import { useCallback } from 'react';
import { supabase, hasSupabase } from '@/lib/supabase';
import { log } from '@/lib/auto-logger';

type MutationType = 
  | 'addProyecto' | 'updateProyecto' | 'deleteProyecto'
  | 'addMovimiento' | 'updateMovimiento' | 'deleteMovimiento'
  | 'addEmpleado' | 'updateEmpleado' | 'deleteEmpleado'
  | 'addMaterial' | 'updateMaterial' | 'deleteMaterial';

interface Mutation {
  id: string;
  type: MutationType;
  payload: Record<string, unknown>;
  retryCount: number;
}

const TABLE_MAP: Record<string, string> = {
  addProyecto: 'erp_proyectos',
  updateProyecto: 'erp_proyectos',
  deleteProyecto: 'erp_proyectos',
  addMovimiento: 'erp_movimientos',
  updateMovimiento: 'erp_movimientos',
  deleteMovimiento: 'erp_movimientos',
  addEmpleado: 'erp_empleados',
  updateEmpleado: 'erp_empleados',
  deleteEmpleado: 'erp_empleados',
  addMaterial: 'erp_materiales',
  updateMaterial: 'erp_materiales',
  deleteMaterial: 'erp_materiales',
};

/**
 * Sincroniza una mutación con Supabase
 */
async function syncMutation(mutation: Mutation): Promise<boolean> {
  if (!hasSupabase) return false;
  
  const table = TABLE_MAP[mutation.type];
  if (!table) return false;

  try {
    if (mutation.type.startsWith('add')) {
      const { error } = await supabase.from(table).insert(mutation.payload);
      if (error) throw error;
    } else if (mutation.type.startsWith('update')) {
      const { id, ...data } = mutation.payload;
      const { error } = await supabase.from(table).update(data).eq('id', id);
      if (error) throw error;
    } else if (mutation.type.startsWith('delete')) {
      const { error } = await supabase.from(table).delete().eq('id', mutation.payload.id);
      if (error) throw error;
    }
    return true;
  } catch (err) {
    log('error', 'SyncSupabase', `Error sincronizando ${mutation.type}`, { error: String(err) });
    return false;
  }
}

/**
 * Procesa la cola completa de mutaciones contra Supabase
 */
export async function processMutationQueue(
  queue: Mutation[],
  onProgress: (current: number, total: number, type: string) => void,
  onComplete: (success: number, fail: number) => void
): Promise<void> {
  let success = 0;
  let fail = 0;
  
  for (let i = 0; i < queue.length; i++) {
    onProgress(i + 1, queue.length, queue[i].type);
    const ok = await syncMutation(queue[i]);
    if (ok) success++; else fail++;
  }
  
  onComplete(success, fail);
}

export default processMutationQueue;