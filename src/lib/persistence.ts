const DB_NAME = 'CONSTRUSMART_ERP_DB';
const DB_VERSION = 1;

const ENTITY_STORES = [
  'proyectos', 'movimientos', 'materiales', 'empleados', 'ordenes',
  'proveedores', 'eventos', 'presupuestos', 'avances',
  'cuentas_cobrar', 'cuentas_pagar', 'ordenes_cambio', 'hitos', 'riesgos',
  'licitaciones', 'cotizaciones', 'bitacora', 'pruebas', 'no_conformidades',
  'vales_salida', 'seguimiento_evm', 'incidentes', 'publicaciones_muro',
  'liberaciones', 'planos', 'rfis', 'submittals', 'activos', 'cuadros',
  'pagos_proveedor', 'destajos', 'recepciones',
] as const;

const KV_STORE = 'kv';
const META_STORE = 'meta';

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') { resolve(null); return; }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        ENTITY_STORES.forEach(name => {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
        });
        if (!db.objectStoreNames.contains(KV_STORE)) db.createObjectStore(KV_STORE, { keyPath: 'key' });
        if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: 'key' });
      };
      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };
      request.onerror = () => { initPromise = null; resolve(null); };
    } catch { initPromise = null; resolve(null); }
  });
  return initPromise;
}

function dbTransaction(storeName: StoreNames, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore | null> {
  return openDB().then(db => {
    if (!db) return null;
    return db.transaction(storeName, mode).objectStore(storeName);
  });
}

export function isStorageAvailable(type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean {
  try {
    const storage = window[type];
    const testKey = '__storage_test__';
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch { return false; }
}

export function isQuotaExceeded(error: unknown): boolean {
  return error instanceof DOMException && (
    error.code === 22 || error.code === 1014 ||
    error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
  );
}

export async function getItem<T = unknown>(key: string): Promise<T | null> {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw) as T;
  } catch { /* fall through */ }

  try {
    const store = await dbTransaction(KV_STORE, 'readonly');
    if (!store) return null;
    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

export async function getEntityData<T = unknown>(entityName: string): Promise<T[]> {
  const storeName = entityName as StoreNames;
  if (!ENTITY_STORES.includes(storeName as any)) return [];

  try {
    const raw = localStorage.getItem(`wm_erp_data_${entityName}`);
    if (raw !== null) return JSON.parse(raw) as T[];
  } catch { /* fall through */ }

  try {
    const store = await dbTransaction(storeName, 'readonly');
    if (!store) return [];
    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => resolve([]);
    });
  } catch { return []; }
}

export async function setItem(key: string, value: unknown): Promise<boolean> {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    if (!isQuotaExceeded(err)) return false;
  }

  try {
    const store = await dbTransaction(KV_STORE, 'readwrite');
    if (!store) return false;
    return new Promise((resolve) => {
      const req = store.put({ key, value });
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch { return false; }
}

export async function setEntityData(entityName: string, data: unknown[]): Promise<boolean> {
  const storeName = entityName as StoreNames;
  if (!ENTITY_STORES.includes(storeName as any)) return false;

  try {
    localStorage.setItem(`wm_erp_data_${entityName}`, JSON.stringify(data));
    return true;
  } catch (err) {
    if (!isQuotaExceeded(err)) return false;
  }

  try {
    const store = await dbTransaction(storeName, 'readwrite');
    if (!store) return false;
    return new Promise((resolve) => {
      const tx = store.transaction;
      store.clear();
      data.forEach(item => {
        if (item && typeof item === 'object' && 'id' in (item as any)) {
          store.put(item);
        }
      });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
}

export async function removeItem(key: string): Promise<boolean> {
  try { localStorage.removeItem(key); } catch { /* ignore */ }

  try {
    const store = await dbTransaction(KV_STORE, 'readwrite');
    if (!store) return true;
    return new Promise((resolve) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(true);
    });
  } catch { return true; }
}

export async function removeEntityData(entityName: string): Promise<boolean> {
  const storeName = entityName as StoreNames;
  if (!ENTITY_STORES.includes(storeName as any)) return false;

  try { localStorage.removeItem(`wm_erp_data_${entityName}`); } catch { /* ignore */ }

  try {
    const store = await dbTransaction(storeName, 'readwrite');
    if (!store) return true;
    return new Promise((resolve) => {
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(true);
    });
  } catch { return true; }
}

export async function getAllKeys(): Promise<string[]> {
  const keys = new Set<string>();

  // localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) keys.add(k);
  }

  // IndexedDB keys
  try {
    const store = await dbTransaction(KV_STORE, 'readonly');
    if (store) {
      const kvKeys = await new Promise<string[]>((resolve) => {
        const req = store.getAllKeys();
        req.onsuccess = () => resolve(req.result as string[]);
        req.onerror = () => resolve([]);
      });
      kvKeys.forEach(k => keys.add(k));
    }
  } catch { /* ignore */ }

  return Array.from(keys);
}

export async function clear(): Promise<boolean> {
  try { localStorage.clear(); } catch { /* ignore */ }

  try {
    const db = await openDB();
    if (!db) return true;
    const storeNames = Array.from(db.objectStoreNames);
    storeNames.forEach(name => {
      const tx = db.transaction(name, 'readwrite');
      tx.objectStore(name).clear();
    });
    return true;
  } catch { return true; }
}

export function clearSync(): void {
  try { localStorage.clear(); } catch { /* ignore */ }
}

export async function getStorageInfo(): Promise<{ localStorageUsed: number; localStorageTotal: number; indexedDBKeys: number }> {
  let localStorageUsed = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) localStorageUsed += (localStorage.getItem(k)?.length || 0) + k.length;
  }

  const localStorageTotal = 5 * 1024 * 1024; // ~5MB per browser standard

  let indexedDBKeys = 0;
  try {
    const entityStoreKeys = await Promise.all(
      ENTITY_STORES.map(async (name) => {
        const store = await dbTransaction(name, 'readonly');
        if (!store) return 0;
        return new Promise<number>((resolve) => {
          const req = store.count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(0);
        });
      })
    );
    indexedDBKeys = entityStoreKeys.reduce((a, b) => a + b, 0);
  } catch { indexedDBKeys = -1; }

  return { localStorageUsed, localStorageTotal, indexedDBKeys };
}