import { Categoria, Tipologia } from './types';

export type AppSettings = {
  uiMode: 'shadcn' | 'antd';
  appTheme: 'light' | 'dark' | 'high-contrast' | 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism';
  primaryColor: string;
  language: 'es' | 'en';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currency: 'GTQ' | 'USD';
  sidebarCollapsed: boolean;
  animationsEnabled: boolean;
  compactMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
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
  animationsEnabled: true,
  compactMode: false,
  fontSize: 'medium',
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
        } catch {}
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
        if (k) try { localStorage.removeItem(k); } catch {}
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
        } catch {}
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
  return transformKeys(obj, (key) => key.replace(/[A-Z]/g, c => '_' + c.toLowerCase()), visited) as Record<string, any>;
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
  const moConHerramienta = mo * (1 + HERRAMIENTA_MENOR);
  return mat + moConHerramienta + eq;
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
