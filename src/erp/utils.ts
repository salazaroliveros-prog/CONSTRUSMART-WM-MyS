import { Categoria, Tipologia } from './types';

/**
 * UTILIDADES ESPECÍFICAS DE LA ERP CONSTRUSMART
 * 
 * Este archivo contiene funciones de utilidad específicas para la ERP:
 * - Formateo de moneda (fmtQ, fmtPct)
 * - Constantes de negocio (TIPOLOGIA_LABEL, CATEGORIA_LABEL)
 * - Configuración de la aplicación (AppSettings, APP_SETTINGS_DEFAULTS)
 * - Funciones de cálculo (costoDirectoUnitario, precioUnitarioVenta)
 * - Utilidades de fecha (todayISO)
 * - Utilidades de datos (safeParseArray, toSnake, toCamel)
 * 
 * NOTA: No confundir con src/lib/utils.ts que solo contiene la función cn() para shadcn/ui
 */

export const safeParseArray = <T>(value: unknown, schema: { safeParse: (data: unknown) => { success: boolean; data?: T } }): T[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => schema.safeParse(item))
    .filter((result): result is { success: true; data: T } => result.success === true)
    .map(result => result.data as T);
};

export type AppSettings = {
  uiMode: 'shadcn' | 'antd';
  appTheme: 'light' | 'dark' | 'high-contrast' | 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism';
  primaryColor: string;
  language: 'es' | 'en';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currency: 'GTQ' | 'USD';
  sidebarCollapsed: boolean;
  sidebarPosition: 'left' | 'right' | 'overlay';
  sidebarMode: 'expanded' | 'collapsed' | 'hover-expand' | 'mini';
  sidebarWidth: 240 | 280 | 320;
  sidebarMiniWidth: 64 | 72 | 80;
  animationsEnabled: boolean;
  animationType: 'fade' | 'slide' | 'scale' | 'none';
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'system-ui' | 'inter' | 'roboto' | 'open-sans' | 'poppins';
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  spacingScale: 'compact' | 'normal' | 'spacious';
  densityTable: 'compact' | 'normal' | 'comfortable';
  breadcrumbsEnabled: boolean;
  footerEnabled: boolean;
  touchMode: boolean;
  notificationSounds: boolean;
  toastPosition: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  empresaInfo?: {
    nombre: string;
    nit: string;
    telefono: string;
    email: string;
    direccion: string;
    ciudad: string;
    pais: string;
  };
};

export const TIPOLOGIA_LABEL: Record<Tipologia, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  industrial: 'Industrial',
  civil: 'Civil',
  publica: 'Pública',
};

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  materiales: 'Materiales',
  mano_obra: 'Mano de Obra',
  equipo: 'Equipo',
  subcontrato: 'Subcontrato',
  administracion: 'Administración',
  transporte: 'Transporte',
  imprevistos: 'Imprevistos',
  marketing: 'Marketing',
  licencias: 'Licencias',
  seguros: 'Seguros',
  otros: 'Otros',
};

export const ESTADO_COLORS = {
  // Estados generales
  activo: { bg: 'bg-emerald-50 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  inactivo: { bg: 'bg-slate-50 dark:bg-slate-900/40', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: 'text-slate-500' },
  pendiente: { bg: 'bg-amber-50 dark:bg-amber-900/40', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
  completado: { bg: 'bg-emerald-50 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  en_proceso: { bg: 'bg-blue-50 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
  cancelado: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  rechazado: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  aprobado: { bg: 'bg-emerald-50 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  vencido: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  borrador: { bg: 'bg-slate-50 dark:bg-slate-900/40', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: 'text-slate-500' },
  
  // Estados de proyectos
  planeacion: { bg: 'bg-purple-50 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-500' },
  ejecucion: { bg: 'bg-blue-50 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
  pausado: { bg: 'bg-amber-50 dark:bg-amber-900/40', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
  finalizado: { bg: 'bg-emerald-50 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  anulado: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  
  // Estados de órdenes
  orden_pendiente: { bg: 'bg-amber-50 dark:bg-amber-900/40', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
  orden_aprobada: { bg: 'bg-emerald-50 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  orden_recibida: { bg: 'bg-blue-50 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
  orden_rechazada: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  
  // Estados de cotizaciones
  cotizacion_borrador: { bg: 'bg-slate-50 dark:bg-slate-900/40', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: 'text-slate-500' },
  cotizacion_enviada: { bg: 'bg-blue-50 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
  cotizacion_aprobada: { bg: 'bg-emerald-50 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  cotizacion_rechazada: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  cotizacion_vencida: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  
  // Estados de licitaciones
  licitacion_activa: { bg: 'bg-blue-50 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
  licitacion_adjudicada: { bg: 'bg-emerald-50 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  licitacion_perdida: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  licitacion_cerrada: { bg: 'bg-slate-50 dark:bg-slate-900/40', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: 'text-slate-500' },
  
  // Estados de activos
  activo_disponible: { bg: 'bg-emerald-50 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  activo_asignado: { bg: 'bg-blue-50 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
  activo_mantenimiento: { bg: 'bg-amber-50 dark:bg-amber-900/40', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
  activo_baja: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  activo_dado_baja: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  
  // Estados de cuadros comparativos
  cuadro_abierto: { bg: 'bg-blue-50 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
  cuadro_cerrado: { bg: 'bg-slate-50 dark:bg-slate-900/40', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: 'text-slate-500' },
  cuadro_adjudicado: { bg: 'bg-emerald-50 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  
  // Estados de riesgos
  riesgo_identificado: { bg: 'bg-amber-50 dark:bg-amber-900/40', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
  riesgo_en_proceso: { bg: 'bg-blue-50 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
  riesgo_mitigado: { bg: 'bg-emerald-50 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  riesgo_materializado: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
  
  // Estados de hitos
  hito_pendiente: { bg: 'bg-amber-50 dark:bg-amber-900/40', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-600 dark:text-amber-400', icon: 'text-amber-500' },
  hito_en_proceso: { bg: 'bg-blue-50 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-500' },
  hito_completado: { bg: 'bg-emerald-50 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-500' },
  hito_retrasado: { bg: 'bg-red-50 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700', text: 'text-red-600 dark:text-red-400', icon: 'text-red-500' },
};

export const getEstadoColor = (estado: string) => {
  return ESTADO_COLORS[estado as keyof typeof ESTADO_COLORS] || ESTADO_COLORS.pendiente;
};

export const EMPRESA_DEFAULT = {
  nombre: 'CONSTRUCTORA WM / M&S',
  eslogan: 'Edificando el Futuro',
  nit: '1234567-8',
  telefono: '(502) 1234-5678',
  email: 'info@construsmart.gt',
  direccion: 'Ciudad de Guatemala, Guatemala',
  ciudad: 'Guatemala',
  pais: 'Guatemala',
};

let _empresaOverrides: Partial<typeof EMPRESA_DEFAULT> | null = null;

export function setEmpresaInfo(info: Partial<typeof EMPRESA_DEFAULT>) {
  _empresaOverrides = info;
}

export function getEmpresaInfo() {
  if (_empresaOverrides) return { ...EMPRESA_DEFAULT, ..._empresaOverrides };
  return EMPRESA_DEFAULT;
}

export const EMPRESA = EMPRESA_DEFAULT;

export const APP_SETTINGS_DEFAULTS: AppSettings = {
  uiMode: 'antd',
  appTheme: 'ant-design',
  primaryColor: '#ff8c42',
  language: 'es',
  dateFormat: 'DD/MM/YYYY',
  currency: 'GTQ',
  sidebarCollapsed: false,
  sidebarPosition: 'left',
  sidebarMode: 'expanded',
  sidebarWidth: 240,
  sidebarMiniWidth: 64,
  animationsEnabled: true,
  animationType: 'fade',
  compactMode: false,
  fontSize: 'medium',
  fontFamily: 'system-ui',
  borderRadius: 'medium',
  spacingScale: 'normal',
  densityTable: 'normal',
  breadcrumbsEnabled: true,
  footerEnabled: true,
  touchMode: false,
  notificationSounds: true,
  toastPosition: 'bottom-right',
  empresaInfo: EMPRESA_DEFAULT,
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function sanitizeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const escaped = str.replace(/"/g, '""');
  const needsQuote = /[;"\n\r]/.test(escaped) || /^[=+\-@\t]/.test(escaped);
  if (needsQuote) return `"${escaped}"`;
  return escaped;
}

export function esFormulaInjection(value: string): boolean {
  return /^[=+\-@\t]/.test(value);
}

import LZString from 'lz-string';

const COMPRESSION_THRESHOLD = 10000;
const QUOTA_WARN_THRESHOLD = 0.85;

export function compressData(data: unknown): string {
  const json = JSON.stringify(data);
  if (json.length < COMPRESSION_THRESHOLD) return json;
  return 'lz:' + LZString.compressToUTF16(json);
}

export function decompressData(data: string): unknown {
  if (data.startsWith('lz:')) {
    try {
      const json = LZString.decompressFromUTF16(data.slice(3));
      return json ? JSON.parse(json) : null;
    } catch { return null; }
  }
  try { return JSON.parse(data); } catch { return null; }
}
export async function compressDataAsync(data: unknown): Promise<string> {
  try {
    const worker = new Worker(new URL('../workers/compression.worker.ts', import.meta.url), { type: 'module' });
    const payload = JSON.stringify(data);
    const result = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => { worker.terminate(); resolve(payload); }, 3000);
      worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); if (e.data.success) resolve(e.data.result); else reject(new Error(e.data.error)); };
      worker.onerror = (err) => { clearTimeout(timer); worker.terminate(); reject(err); };
      worker.postMessage({ type: 'compress', payload });
    });
    return result;
  } catch { return compressData(data); }
}

export async function decompressDataAsync(data: string): Promise<unknown> {
  try {
    const worker = new Worker(new URL('../workers/compression.worker.ts', import.meta.url), { type: 'module' });
    const result = await new Promise<string | null>((resolve, reject) => {
      const timer = setTimeout(() => { worker.terminate(); resolve(null); }, 3000);
      worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); if (e.data.success) resolve(e.data.result); else resolve(null); };
      worker.onerror = () => { clearTimeout(timer); worker.terminate(); resolve(null); };
      worker.postMessage({ type: 'decompress', payload: data });
    });
    return result ?? decompressData(data);
  } catch { return decompressData(data); }
}

export function isStorageQuotaCritical(): boolean {
  try {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) used += (localStorage.getItem(key)?.length || 0) * 2;
    }
    const quota = QUOTA_WARN_THRESHOLD * 5 * 1024 * 1024;
    return used > quota;
  } catch { return false; }
}

export function safeSetItem(key: string, value: string, fallbackKey?: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      if (fallbackKey) {
        try {
          const existing = localStorage.getItem(fallbackKey);
          if (existing && existing.length > value.length) {
            localStorage.removeItem(fallbackKey);
          }
        } catch (error) {
          console.error('Error removing fallback key:', error);
        }
      }
      const oldestKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('wm_erp_data_')) oldestKeys.push(k);
      }
      oldestKeys.sort((a, b) => {
        try { return (localStorage.getItem(a)?.length || 0) - (localStorage.getItem(b)?.length || 0); } catch { return 0; }
      });
      while (oldestKeys.length > 3) {
        const k = oldestKeys.shift();
        if (k) try { localStorage.removeItem(k); } catch (error) {
          console.error('Error removing old key:', error);
        }
      }
      if (oldestKeys.length > 0) {
        const k = oldestKeys[0];
        try {
          const raw = localStorage.getItem(k);
          if (raw && raw.length > 0) {
            if (!raw.startsWith('lz:')) {
              const compressed = 'lz:' + LZString.compressToUTF16(raw);
              localStorage.setItem(k, compressed);
            }
          }
        } catch (error) {
          console.error('Error compressing data:', error);
        }
      }
      try {
        localStorage.setItem(key, value);
        return true;
      } catch { return false; }
    }
    return false;
  }
}

function transformKeys(obj: unknown, transform: (key: string) => string, visited: WeakSet<object>): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (visited.has(obj)) return obj;
  visited.add(obj);
  if (Array.isArray(obj)) return obj.map(item => transformKeys(item, transform, visited));
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[transform(key)] = transformKeys(value, transform, visited);
  }
  return result;
}

export const toSnake = (obj: Record<string, any>): Record<string, any> => {
  const visited = new WeakSet<object>();
  return transformKeys(obj, (key) => key
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase(), visited) as Record<string, any>;
};

export const toCamel = (obj: Record<string, any>): Record<string, any> => {
  const visited = new WeakSet<object>();
  return transformKeys(obj, (key) => key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), visited) as Record<string, any>;
};

export const FSR_PRESTACIONES = 0.4317;
export const HERRAMIENTA_MENOR = 0.05;
export const COSTOS_INDIRECTOS = 0.12;
export const ADMINISTRACION = 0.08;
export const IMPREVISTOS = 0.03;
export const UTILIDAD = 0.10;
export const IVA = 0.12;

export const factorSalarioReal = (salarioBase: number) => salarioBase * (1 + FSR_PRESTACIONES);

export const costoDirectoUnitario = (mat: number, mo: number, eq: number) => {
  const m = mat || 0;
  const mo_ = mo || 0;
  const e = eq || 0;
  const moConHerramienta = mo_ * (1 + HERRAMIENTA_MENOR);
  return m + moConHerramienta + e;
};

export const precioUnitarioVenta = (costoDirecto: number) => {
  const indirectos = costoDirecto * COSTOS_INDIRECTOS;
  const admin = (costoDirecto + indirectos) * ADMINISTRACION;
  const imprev = (costoDirecto + indirectos + admin) * IMPREVISTOS;
  const base = costoDirecto + indirectos + admin + imprev;
  return base * (1 + UTILIDAD);
};

export const duracionPorRendimiento = (cantidad: number, rendimiento: number) =>
  rendimiento > 0 ? Math.ceil(cantidad / rendimiento) : 0;

export const precioUnitarioVentaConFactores = (
  costoDirecto: number,
  factors: { indirectos: number; administracion: number; imprevistos: number; utilidad: number }
) => {
  const indirectos = costoDirecto * factors.indirectos;
  const admin = (costoDirecto + indirectos) * factors.administracion;
  const imprev = (costoDirecto + indirectos + admin) * factors.imprevistos;
  const base = costoDirecto + indirectos + admin + imprev;
  return base * (1 + factors.utilidad);
};

export const fmtQ = (n: number) =>
  'Q ' + (n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtNum = (n: number) =>
  (n || 0).toLocaleString('es-GT', { maximumFractionDigits: 2 });

export const fmtPct = (n: number) => `${(n || 0).toFixed(1)}%`;

export interface SupplierPerformanceMetrics {
  proveedorId: string;
  proveedorNombre: string;
  puntajeEntrega: number;
  puntajeCalidad: number;
  puntajeCosto: number;
  puntajeRespuesta: number;
  puntajeGeneral: number;
  tendencia: 'mejorando' | 'estable' | 'empeorando';
  totalOrdenes: number;
  ordenesTiempo: number;
  ordenesRetraso: number;
  montoTotal: number;
  avgTiempoEntrega: number;
  categoria: string;
}

export interface SupplierPerformanceHistory {
  fecha: string;
  puntajeGeneral: number;
  puntajeEntrega: number;
  puntajeCalidad: number;
  puntajeCosto: number;
}

export function calculateSupplierPerformance(
  proveedor: { id: string; nombre: string; categoria: string; calificacion?: number },
  ordenes: Array<{ proveedorId?: string; estado: string; fecha: string; monto: number; cantidad: number }>,
  historial: SupplierPerformanceHistory[] = []
): SupplierPerformanceMetrics {
  const proveedorOrdenes = ordenes.filter(o => o.proveedorId === proveedor.id);
  const totalOrdenes = proveedorOrdenes.length;

  if (totalOrdenes === 0) {
    return {
      proveedorId: proveedor.id,
      proveedorNombre: proveedor.nombre,
      puntajeEntrega: 0,
      puntajeCalidad: proveedor.calificacion ? proveedor.calificacion * 20 : 50,
      puntajeCosto: 50,
      puntajeRespuesta: 50,
      puntajeGeneral: proveedor.calificacion ? proveedor.calificacion * 20 : 50,
      tendencia: 'estable',
      totalOrdenes: 0,
      ordenesTiempo: 0,
      ordenesRetraso: 0,
      montoTotal: 0,
      avgTiempoEntrega: 0,
      categoria: proveedor.categoria,
    };
  }

  const ordenesCompletadas = proveedorOrdenes.filter(o => ['recibida', 'aprobado'].includes(o.estado));
  const ordenesTiempo = ordenesCompletadas.length;
  const ordenesRetraso = totalOrdenes - ordenesTiempo;
  const montoTotal = proveedorOrdenes.reduce((sum, o) => sum + (o.monto || 0), 0);

  const puntajeEntrega = totalOrdenes > 0 ? (ordenesTiempo / totalOrdenes) * 100 : 0;
  const puntajeCalidad = proveedor.calificacion ? proveedor.calificacion * 20 : 70;
  const puntajeCosto = 60;
  const puntajeRespuesta = 65;

  const puntajeGeneral = (puntajeEntrega * 0.35) + (puntajeCalidad * 0.25) + (puntajeCosto * 0.2) + (puntajeRespuesta * 0.2);

  let tendencia: 'mejorando' | 'estable' | 'empeorando' = 'estable';
  if (historial.length >= 2) {
    const recent = historial.slice(-3);
    const avgRecent = recent.reduce((sum, h) => sum + h.puntajeGeneral, 0) / recent.length;
    const older = historial.slice(0, -3);
    if (older.length > 0) {
      const avgOlder = older.reduce((sum, h) => sum + h.puntajeGeneral, 0) / older.length;
      if (avgRecent > avgOlder + 5) tendencia = 'mejorando';
      else if (avgRecent < avgOlder - 5) tendencia = 'empeorando';
    }
  }

  return {
    proveedorId: proveedor.id,
    proveedorNombre: proveedor.nombre,
    puntajeEntrega: Math.round(puntajeEntrega),
    puntajeCalidad: Math.round(puntajeCalidad),
    puntajeCosto: Math.round(puntajeCosto),
    puntajeRespuesta: Math.round(puntajeRespuesta),
    puntajeGeneral: Math.round(puntajeGeneral),
    tendencia,
    totalOrdenes,
    ordenesTiempo,
    ordenesRetraso,
    montoTotal,
    avgTiempoEntrega: 0,
    categoria: proveedor.categoria,
  };
}

export function getSupplierRecommendations(
  metrics: SupplierPerformanceMetrics[],
  categoria?: string
): Array<{ proveedor: string; razon: string; puntaje: number }> {
  const filtered = categoria ? metrics.filter(m => m.categoria === categoria) : metrics;
  const topPerformers = filtered
    .filter(m => m.puntajeGeneral >= 70)
    .sort((a, b) => b.puntajeGeneral - a.puntajeGeneral)
    .slice(0, 3);

  return topPerformers.map(m => ({
    proveedor: m.proveedorNombre,
    razon: m.puntajeGeneral >= 90 ? 'Excelente desempeño integral' : 
           m.puntajeEntrega >= 85 ? 'Alta confiabilidad de entrega' : 
           m.puntajeCalidad >= 80 ? 'Buena calidad de servicio' : 'Desempeño sólido',
    puntaje: m.puntajeGeneral,
  }));
}

export function validateForeignKey(foreignKeyId: string | null | undefined, entityArray: Array<{ id: string }>, entityName: string): boolean {
  if (!foreignKeyId) return false;
  return entityArray.some(e => e.id === foreignKeyId);
}

export function identifySupplierRisks(metrics: SupplierPerformanceMetrics[]): Array<{ proveedor: string; riesgo: string; nivel: 'alto' | 'medio' | 'bajo' }> {
  return metrics
    .filter(m => m.puntajeGeneral < 60 || m.puntajeEntrega < 50)
    .map(m => ({
      proveedor: m.proveedorNombre,
      riesgo: m.puntajeEntrega < 50 ? 'Baja confiabilidad de entrega' : 
              m.puntajeCalidad < 50 ? 'Problemas de calidad' : 'Desempeño general bajo',
      nivel: m.puntajeGeneral < 40 ? 'alto' : m.puntajeGeneral < 50 ? 'medio' : 'bajo',
    }))
    .sort((a, b) => (b.nivel === 'alto' ? 1 : b.nivel === 'medio' ? 0 : -1) - (a.nivel === 'alto' ? 1 : b.nivel === 'medio' ? 0 : -1));
}

// Safe numeric conversions for potentially undefined/null values
export function safeNum(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function safePct(value: unknown): string {
  return fmtPct(safeNum(value));
}

// Seguimiento tab identifiers
export type SeguimientoTab = 'resumen' | 'evm' | 'bitacora' | 'avances' | 'cronograma';
