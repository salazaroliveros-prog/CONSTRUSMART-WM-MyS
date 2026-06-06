/**
 * Utilidades de almacenamiento local con límites de tamaño,
 * limpieza automática y manejo de cuota excedida.
 */
const BASE_STORAGE_KEY = 'wm_erp_data';

const STORAGE_MAX_BYTES = 4.5 * 1024 * 1024;
const STORAGE_WARN_THRESHOLD = 3 * 1024 * 1024;
const MAX_KEY_SIZE = 500 * 1024;

export function loadFromStorage<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return initial;
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[Storage] Datos corruptos en localStorage para key: ${key}. Usando valores por defecto.`);
    return initial;
  }
}

function _estimarTamanoJSON<T>(data: T): number {
  return new Blob([JSON.stringify(data)]).size;
}

function verificarEspacioStorage(tamanoNuevo: number, _baseKey: string): boolean {
  let espacioUsado = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) espacioUsado += localStorage.getItem(key)?.length || 0;
  }
  if (espacioUsado + tamanoNuevo > STORAGE_MAX_BYTES) return false;
  if (espacioUsado + tamanoNuevo > STORAGE_WARN_THRESHOLD) {
    console.info(`[Storage] Almacenamiento al ${((espacioUsado + tamanoNuevo) / STORAGE_MAX_BYTES * 100).toFixed(0)}% de capacidad`);
  }
  return true;
}

function limpiarEspacio(baseKey: string) {
  const storageKeys = Object.keys(localStorage)
    .filter(k => k.startsWith(baseKey))
    .sort((a, b) => {
      const aTime = localStorage.getItem(a + '_timestamp') || '0';
      const bTime = localStorage.getItem(b + '_timestamp') || '0';
      return parseInt(aTime) - parseInt(bTime);
    });
  const keysToRemove = storageKeys.slice(0, Math.max(1, Math.floor(storageKeys.length * 0.3)));
  keysToRemove.forEach(k => { localStorage.removeItem(k); localStorage.removeItem(k + '_timestamp'); });
}

export function saveToStorage<T>(key: string, data: T, baseKey = BASE_STORAGE_KEY) {
  try {
    const jsonData = JSON.stringify(data);
    const tamano = new Blob([jsonData]).size;

    if (tamano === 0 || (Array.isArray(data) && data.length === 0) ||
        (typeof data === 'object' && data !== null && !Array.isArray(data) && Object.keys(data).length === 0)) {
      console.warn(`[Storage] Intento de guardar datos vacíos para key: ${key}`);
      return;
    }
    if (tamano > MAX_KEY_SIZE) {
      console.warn(`[Storage] Datos demasiado grandes para key ${key}: ${(tamano / 1024).toFixed(1)}KB (límite: ${MAX_KEY_SIZE / 1024}KB).`);
      return;
    }
    if (!verificarEspacioStorage(tamano, baseKey)) {
      limpiarEspacio(baseKey);
    }
    localStorage.setItem(key, jsonData);
    localStorage.setItem(key + '_timestamp', String(Date.now()));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn(`[Storage] Cuota excedida para key: ${key}`);
      const storageKeys = Object.keys(localStorage).filter(k => k.startsWith(baseKey)).sort();
      storageKeys.slice(0, Math.floor(storageKeys.length / 2)).forEach(k => localStorage.removeItem(k));
      try { localStorage.setItem(key, JSON.stringify(data)); } catch { console.error(`[Storage] Error crítico: no se pudo guardar "${key}"`); }
    } else console.error(`[Storage] Error al guardar "${key}":`, error);
  }
}

export { BASE_STORAGE_KEY };