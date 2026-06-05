/**
 * Mutation queue para sincronización offline → online
 */
import { supabase } from '@/lib/supabase';
import type { Mutation } from '../types';

export const toSnake = (obj: Record<string, unknown>) => {
  const mapped: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    mapped[snakeKey] = obj[key];
  }
  return mapped;
};

// Limpia campos que NO existen en DB para cada tabla
export const forProyecto = (p: Record<string, unknown>) => {
  const s = toSnake(p);
  if ('latitud' in s) { s.lat = s.latitud; delete s.latitud; }
  if ('longitud' in s) { s.lng = s.longitud; delete s.longitud; }
  delete s.factor_sobrecosto;
  delete s.presupuesto;
  return s;
};

export const forMovimiento = (m: Record<string, unknown>) => {
  const s = toSnake(m);
  if (!s.costo_total && s.monto) s.costo_total = s.monto;
  delete s.monto;
  delete s.proveedor;
  delete s.factura;
  return s;
};

export const forEmpleado = (e: Record<string, unknown>) => {
  const s = toSnake(e);
  if (Array.isArray(s.proyecto_ids) && s.proyecto_ids.length > 0) {
    s.proyecto_id = s.proyecto_ids[0];
  }
  delete s.proyecto_ids;
  delete s.activo;
  delete s.telefono;
  return s;
};

export const forMaterial = (m: Record<string, unknown>) => {
  const s = toSnake(m);
  delete s.categoria;
  delete s.proyecto_ids;
  return s;
};

export const forProveedor = (p: Record<string, unknown>) => {
  const s = toSnake(p);
  delete s.telefono;
  delete s.email;
  delete s.categoria;
  return s;
};

export const forEvento = (e: Record<string, unknown>) => {
  const s = toSnake(e);
  delete s.participantes;
  return s;
};

export const forBitacora = (b: Record<string, unknown>) => {
  const s = toSnake(b);
  if ('personal_presente' in s) { s.personal = s.personal_presente; delete s.personal_presente; }
  if ('tareas_realizadas' in s) { s.tareas = s.tareas_realizadas; delete s.tareas_realizadas; }
  delete s.fotos;
  delete s.firma;
  delete s.latitud;
  delete s.longitud;
  return s;
};

const MAX_RETRIES = 3;

export async function executeMutation(next: Mutation, userId?: string): Promise<void> {
  const u = { created_by: userId };

  switch (next.type) {
    case 'addProyecto': {
      const { error } = await supabase.from('erp_proyectos').insert(forProyecto({ ...next.payload, ...u }));
      if (error) throw new Error(`Failed to add proyecto: ${error.message}`);
      break;
    }
    case 'updateProyecto': {
      const { id, ...rest } = next.payload;
      const { error } = await supabase.from('erp_proyectos').update(forProyecto(rest)).eq('id', id);
      if (error) throw new Error(`Failed to update proyecto: ${error.message}`);
      break;
    }
    case 'deleteProyecto': {
      const { error } = await supabase.from('erp_proyectos').delete().eq('id', next.payload.id);
      if (error) throw new Error(`Failed to delete proyecto: ${error.message}`);
      break;
    }
    case 'addMovimiento': {
      const { error } = await supabase.from('erp_movimientos').insert(forMovimiento({ ...next.payload, ...u }));
      if (error) throw new Error(`Failed to add movimiento: ${error.message}`);
      break;
    }
    case 'deleteMovimiento': {
      const { error } = await supabase.from('erp_movimientos').delete().eq('id', next.payload.id);
      if (error) throw new Error(`Failed to delete movimiento: ${error.message}`);
      break;
    }
    case 'addEmpleado': {
      const { error } = await supabase.from('erp_empleados').insert(forEmpleado(next.payload));
      if (error) throw new Error(`Failed to add empleado: ${error.message}`);
      break;
    }
    case 'updateEmpleado': {
      const { id, ...rest } = next.payload;
      const { error } = await supabase.from('erp_empleados').update(forEmpleado(rest)).eq('id', id);
      if (error) throw new Error(`Failed to update empleado: ${error.message}`);
      break;
    }
    case 'deleteEmpleado': {
      const { error } = await supabase.from('erp_empleados').delete().eq('id', next.payload.id);
      if (error) throw new Error(`Failed to delete empleado: ${error.message}`);
      break;
    }
    case 'updateMaterial': {
      const { id, ...rest } = next.payload;
      const { error } = await supabase.from('erp_materiales').update(forMaterial(rest)).eq('id', id);
      if (error) throw new Error(`Failed to update material: ${error.message}`);
      break;
    }
    case 'addOrden': {
      const { error } = await supabase.from('erp_ordenes_compra').insert(toSnake(next.payload));
      if (error) throw new Error(`Failed to add orden: ${error.message}`);
      break;
    }
    case 'updateOrden': {
      const { error } = await supabase.from('erp_ordenes_compra').update({ estado: next.payload.estado }).eq('id', next.payload.id);
      if (error) throw new Error(`Failed to update orden: ${error.message}`);
      break;
    }
    case 'addProveedor': {
      const { error } = await supabase.from('erp_proveedores').insert(forProveedor(next.payload));
      if (error) throw new Error(`Failed to add proveedor: ${error.message}`);
      break;
    }
    case 'updateProveedor': {
      const { id, ...rest } = next.payload;
      const { error } = await supabase.from('erp_proveedores').update(forProveedor(rest)).eq('id', id);
      if (error) throw new Error(`Failed to update proveedor: ${error.message}`);
      break;
    }
    case 'deleteProveedor': {
      const { error } = await supabase.from('erp_proveedores').delete().eq('id', next.payload.id);
      if (error) throw new Error(`Failed to delete proveedor: ${error.message}`);
      break;
    }
    case 'addEvento': {
      const { error } = await supabase.from('erp_eventos_calendario').insert(forEvento(next.payload));
      if (error) throw new Error(`Failed to add evento: ${error.message}`);
      break;
    }
    case 'updateEvento': {
      const { id, ...rest } = next.payload;
      const { error } = await supabase.from('erp_eventos_calendario').update(forEvento(rest)).eq('id', id);
      if (error) throw new Error(`Failed to update evento: ${error.message}`);
      break;
    }
    case 'deleteEvento': {
      const { error } = await supabase.from('erp_eventos_calendario').delete().eq('id', next.payload.id);
      if (error) throw new Error(`Failed to delete evento: ${error.message}`);
      break;
    }
    case 'addBitacora': {
      const { error } = await supabase.from('erp_bitacora').insert(forBitacora(next.payload));
      if (error) throw new Error(`Failed to add bitacora: ${error.message}`);
      break;
    }
    case 'updateBitacora': {
      const { id, ...rest } = next.payload;
      const { error } = await supabase.from('erp_bitacora').update(forBitacora(rest)).eq('id', id);
      if (error) throw new Error(`Failed to update bitacora: ${error.message}`);
      break;
    }
    case 'deleteBitacora': {
      const { error } = await supabase.from('erp_bitacora').delete().eq('id', next.payload.id);
      if (error) throw new Error(`Failed to delete bitacora: ${error.message}`);
      break;
    }
    case 'addPresupuesto': {
      const { error } = await supabase.from('erp_presupuestos').insert(toSnake(next.payload));
      if (error) throw new Error(`Failed to add presupuesto: ${error.message}`);
      break;
    }
    case 'updatePresupuesto': {
      const { id, ...rest } = next.payload;
      const { error } = await supabase.from('erp_presupuestos').update(toSnake(rest)).eq('id', id);
      if (error) throw new Error(`Failed to update presupuesto: ${error.message}`);
      break;
    }
    case 'deletePresupuesto': {
      const { error } = await supabase.from('erp_presupuestos').delete().eq('id', next.payload.id);
      if (error) throw new Error(`Failed to delete presupuesto: ${error.message}`);
      break;
    }
    case 'addValeSalida':
      await supabase.from('erp_vales_salida').insert(toSnake(next.payload));
      break;
    case 'deleteValeSalida':
      await supabase.from('erp_vales_salida').delete().eq('id', next.payload.id);
      break;
    case 'addAvance': {
      const { error } = await supabase.from('erp_avances').insert([toSnake(next.payload)]);
      if (error) throw new Error(`Failed to add avance: ${error.message}`);
      break;
    }
    case 'deleteAvance': {
      const { error } = await supabase.from('erp_avances').delete().eq('id', next.payload.id);
      if (error) throw new Error(`Failed to delete avance: ${error.message}`);
      break;
    }
    case 'addLicitacion': {
      const { error } = await supabase.from('erp_licitaciones').insert([toSnake(next.payload)]);
      if (error) throw new Error(`Failed to add licitacion: ${error.message}`);
      break;
    }
    case 'updateLicitacion': {
      const { id, ...rest } = next.payload;
      const { error } = await supabase.from('erp_licitaciones').update(toSnake(rest)).eq('id', id);
      if (error) throw new Error(`Failed to update licitacion: ${error.message}`);
      break;
    }
    case 'deleteLicitacion': {
      const { error } = await supabase.from('erp_licitaciones').delete().eq('id', next.payload.id);
      if (error) throw new Error(`Failed to delete licitacion: ${error.message}`);
      break;
    }
  }
}

export async function processQueue(
  mutationQueue: Mutation[],
  setMutationQueue: React.Dispatch<React.SetStateAction<Mutation[]>>,
  isOnline: boolean,
  userId?: string
): Promise<void> {
  if (!isOnline || mutationQueue.length === 0) return;

  const [next, ...rest] = mutationQueue;

  try {
    await executeMutation(next, userId);
    setMutationQueue(rest);
  } catch (err) {
    console.error('Error processing mutation queue:', err);
    if (next.retryCount < MAX_RETRIES) {
      const retryMutation: Mutation = { ...next, retryCount: next.retryCount + 1 };
      setMutationQueue(q => [retryMutation, ...rest]);
    } else {
      console.error(`Mutation ${next.type} (${next.id}) falló tras ${MAX_RETRIES} intentos. Descartada.`);
      setMutationQueue(rest);
    }
  }
}