import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'wm_filtro_proyecto_global';

/**
 * Hook de filtro global por proyecto.
 * Se sincroniza con localStorage y se puede usar desde cualquier pantalla.
 * Las pantallas que lo consumen filtran sus datos según el proyecto seleccionado.
 */
export function useFiltroProyectoGlobal() {
  const [proyectoId, setProyectoIdState] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY) || null; } catch { return null; }
  });

  const setProyectoId = useCallback((id: string | null) => {
    setProyectoIdState(id);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  // Escuchar cambios desde otras pestañas
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setProyectoIdState(e.newValue || null);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return { proyectoId, setProyectoId, isActive: !!proyectoId };
}

/**
 * Helper: filtra un array de items por proyectoId si el filtro está activo.
 * Soporta items con campo `proyectoId` directo o con `proyectoIds: string[]`.
 */
export function filterByProyecto<T extends Record<string, any>>(
  items: T[],
  filtroProyectoId: string | null
): T[] {
  if (!filtroProyectoId) return items;
  return items.filter(item => {
    if (item.proyectoId === filtroProyectoId) return true;
    if (Array.isArray(item.proyectoIds) && item.proyectoIds.includes(filtroProyectoId)) return true;
    return false;
  });
}