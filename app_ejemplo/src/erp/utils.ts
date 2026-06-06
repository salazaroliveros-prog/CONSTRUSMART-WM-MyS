import { Categoria, Tipologia } from './types';

export const fmtQ = (n: number) =>
  'Q ' + (n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtNum = (n: number) =>
  (n || 0).toLocaleString('es-GT', { maximumFractionDigits: 2 });

export const fmtPct = (n: number) => `${(n || 0).toFixed(1)}%`;

// Constantes del motor de cálculo (Guatemala)
export const FSR_PRESTACIONES = 0.4317; // 43.17% prestaciones de ley (IGSS, bono14, aguinaldo, vacaciones, indemnización)
export const HERRAMIENTA_MENOR = 0.05; // 5%
export const COSTOS_INDIRECTOS = 0.12; // 12%
export const ADMINISTRACION = 0.08; // 8%
export const IMPREVISTOS = 0.03; // 3%
export const UTILIDAD = 0.10; // 10%
export const IVA = 0.12;

export const factorSalarioReal = (salarioBase: number) =>
  salarioBase * (1 + FSR_PRESTACIONES);

// Costo unitario directo de un renglón
export const costoDirectoUnitario = (mat: number, mo: number, eq: number) => {
  const moConHerramienta = mo * (1 + HERRAMIENTA_MENOR);
  return mat + moConHerramienta + eq;
};

// Precio unitario de venta con indirectos
export const precioUnitarioVenta = (costoDirecto: number) => {
  const conIndirectos = costoDirecto * (1 + COSTOS_INDIRECTOS + ADMINISTRACION + IMPREVISTOS);
  return conIndirectos * (1 + UTILIDAD);
};

export const duracionPorRendimiento = (cantidad: number, rendimiento: number) =>
  rendimiento > 0 ? Math.ceil(cantidad / rendimiento) : 0;

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  materiales: 'Materiales',
  mano_obra: 'Mano de Obra',
  herramienta: 'Herramienta',
  sub_contrato: 'Sub-contrato',
  administrativo: 'Administrativo',
  personal: 'Personal',
  transporte: 'Transporte',
  fijos: 'Fijos',
  hogar: 'Hogar',
  aporte: 'Aporte',
  trabajos_extra: 'Trabajos Extra',
};

export const TIPOLOGIA_LABEL: Record<Tipologia, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  industrial: 'Industrial',
  civil: 'Civil',
  publica: 'Pública',
};

export const EMPRESA = {
  nombre: 'CONSTRUCTORA WM / M&S',
  eslogan: 'Edificando el Futuro',
};

export const todayISO = () => new Date().toISOString().slice(0, 10);
