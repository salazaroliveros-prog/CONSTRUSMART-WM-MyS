import { RenglonBase, Tipologia, Insumo } from './types';

interface BaseDef {
  nombre: string;
  unidad: string;
  rend: number; // rendimiento cuadrilla/dia
  mat: number;  // costo materiales unitario
  mo: number;   // costo mano de obra unitario
  eq: number;   // costo equipo unitario
}

// 45 renglones en orden cronológico de obra (Guatemala)
const BASE: BaseDef[] = [
  { nombre: 'Limpieza y chapeo de terreno', unidad: 'm²', rend: 200, mat: 2, mo: 6, eq: 1 },
  { nombre: 'Trazo y estaqueado', unidad: 'm²', rend: 150, mat: 4, mo: 8, eq: 0.5 },
  { nombre: 'Demolición de estructuras existentes', unidad: 'm³', rend: 8, mat: 0, mo: 120, eq: 80 },
  { nombre: 'Excavación de cimientos', unidad: 'm³', rend: 6, mat: 0, mo: 90, eq: 40 },
  { nombre: 'Relleno y compactación', unidad: 'm³', rend: 12, mat: 25, mo: 60, eq: 35 },
  { nombre: 'Solera de humedad', unidad: 'ml', rend: 25, mat: 85, mo: 45, eq: 8 },
  { nombre: 'Cimiento corrido de concreto', unidad: 'm³', rend: 3, mat: 950, mo: 280, eq: 60 },
  { nombre: 'Zapatas aisladas', unidad: 'm³', rend: 2.5, mat: 1050, mo: 320, eq: 70 },
  { nombre: 'Columnas de concreto reforzado', unidad: 'm³', rend: 1.5, mat: 1250, mo: 480, eq: 90 },
  { nombre: 'Vigas y soleras de concreto', unidad: 'm³', rend: 1.8, mat: 1180, mo: 420, eq: 85 },
  { nombre: 'Levantado de muro block 0.15', unidad: 'm²', rend: 14, mat: 95, mo: 55, eq: 6 },
  { nombre: 'Levantado de muro block 0.20', unidad: 'm²', rend: 11, mat: 125, mo: 68, eq: 7 },
  { nombre: 'Tabique de tablayeso', unidad: 'm²', rend: 18, mat: 110, mo: 60, eq: 5 },
  { nombre: 'Losa de entrepiso tradicional', unidad: 'm²', rend: 8, mat: 320, mo: 145, eq: 25 },
  { nombre: 'Losa de techo prefabricada', unidad: 'm²', rend: 20, mat: 285, mo: 90, eq: 18 },
  { nombre: 'Estructura metálica de techo', unidad: 'kg', rend: 120, mat: 14, mo: 6, eq: 2 },
  { nombre: 'Cubierta de lámina', unidad: 'm²', rend: 35, mat: 145, mo: 40, eq: 8 },
  { nombre: 'Instalación de agua potable', unidad: 'pto', rend: 8, mat: 165, mo: 120, eq: 10 },
  { nombre: 'Instalación de drenajes', unidad: 'pto', rend: 6, mat: 220, mo: 150, eq: 12 },
  { nombre: 'Instalación eléctrica', unidad: 'pto', rend: 10, mat: 185, mo: 110, eq: 8 },
  { nombre: 'Tablero y acometida eléctrica', unidad: 'u', rend: 1, mat: 2800, mo: 850, eq: 50 },
  { nombre: 'Instalación de voz y datos', unidad: 'pto', rend: 12, mat: 145, mo: 95, eq: 6 },
  { nombre: 'Repello de muros', unidad: 'm²', rend: 22, mat: 35, mo: 42, eq: 4 },
  { nombre: 'Cernido fino', unidad: 'm²', rend: 25, mat: 28, mo: 38, eq: 3 },
  { nombre: 'Alisado de cielo', unidad: 'm²', rend: 18, mat: 32, mo: 48, eq: 4 },
  { nombre: 'Piso cerámico', unidad: 'm²', rend: 16, mat: 135, mo: 65, eq: 6 },
  { nombre: 'Piso de porcelanato', unidad: 'm²', rend: 12, mat: 245, mo: 85, eq: 8 },
  { nombre: 'Piso de concreto pulido', unidad: 'm²', rend: 30, mat: 95, mo: 55, eq: 15 },
  { nombre: 'Azulejo en baños', unidad: 'm²', rend: 14, mat: 155, mo: 70, eq: 6 },
  { nombre: 'Puertas de madera', unidad: 'u', rend: 4, mat: 1450, mo: 280, eq: 20 },
  { nombre: 'Ventanería de aluminio y vidrio', unidad: 'm²', rend: 8, mat: 685, mo: 145, eq: 15 },
  { nombre: 'Portón metálico', unidad: 'm²', rend: 5, mat: 850, mo: 220, eq: 30 },
  { nombre: 'Pintura interior', unidad: 'm²', rend: 40, mat: 28, mo: 22, eq: 3 },
  { nombre: 'Pintura exterior', unidad: 'm²', rend: 35, mat: 38, mo: 28, eq: 4 },
  { nombre: 'Artefactos sanitarios', unidad: 'u', rend: 3, mat: 1250, mo: 320, eq: 20 },
  { nombre: 'Grifería y accesorios', unidad: 'u', rend: 8, mat: 485, mo: 120, eq: 8 },
  { nombre: 'Muebles de cocina', unidad: 'ml', rend: 2, mat: 2400, mo: 480, eq: 40 },
  { nombre: 'Closets y muebles fijos', unidad: 'ml', rend: 1.5, mat: 1850, mo: 420, eq: 35 },
  { nombre: 'Jardinería y áreas verdes', unidad: 'm²', rend: 50, mat: 65, mo: 45, eq: 10 },
  { nombre: 'Pavimento adoquinado', unidad: 'm²', rend: 25, mat: 185, mo: 75, eq: 25 },
  { nombre: 'Muro perimetral', unidad: 'ml', rend: 6, mat: 485, mo: 180, eq: 20 },
  { nombre: 'Sistema contra incendios', unidad: 'pto', rend: 4, mat: 850, mo: 280, eq: 40 },
  { nombre: 'Climatización HVAC', unidad: 'u', rend: 1, mat: 8500, mo: 1200, eq: 200 },
  { nombre: 'Impermeabilización de losa', unidad: 'm²', rend: 30, mat: 85, mo: 45, eq: 8 },
  { nombre: 'Limpieza final de obra', unidad: 'm²', rend: 120, mat: 8, mo: 12, eq: 2 },
];

// Multiplicadores por tipología (ajustan costos y rendimientos)
const FACTOR: Record<Tipologia, { costo: number; rend: number }> = {
  residencial: { costo: 1.0, rend: 1.0 },
  comercial: { costo: 1.15, rend: 0.95 },
  industrial: { costo: 1.35, rend: 0.85 },
  civil: { costo: 1.25, rend: 1.1 },
  publica: { costo: 1.2, rend: 0.9 },
};

const makeInsumos = (codigo: string, mat: number, mo: number, eq: number): Insumo[] => {
  const list: Insumo[] = [];
  if (mat > 0) {
    list.push({ id: codigo + '-m1', nombre: 'Material principal', tipo: 'material', unidad: 'u', precio: +(mat * 0.65).toFixed(2), rendimiento: 1 });
    list.push({ id: codigo + '-m2', nombre: 'Material secundario / consumibles', tipo: 'material', unidad: 'u', precio: +(mat * 0.35).toFixed(2), rendimiento: 1 });
  }
  if (mo > 0) {
    list.push({ id: codigo + '-mo1', nombre: 'Albañil (mano de obra)', tipo: 'mano_obra', unidad: 'jornal', precio: +(mo * 0.6).toFixed(2), rendimiento: 1 });
    list.push({ id: codigo + '-mo2', nombre: 'Ayudante (mano de obra)', tipo: 'mano_obra', unidad: 'jornal', precio: +(mo * 0.4).toFixed(2), rendimiento: 1 });
  }
  if (eq > 0) {
    list.push({ id: codigo + '-eq1', nombre: 'Equipo y maquinaria', tipo: 'equipo', unidad: 'hora', precio: +eq.toFixed(2), rendimiento: 1 });
  }
  return list;
};

export const generarRenglones = (tipologia: Tipologia): RenglonBase[] => {
  const f = FACTOR[tipologia];
  return BASE.map((b, i) => {
    const codigo = `${tipologia.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
    const mat = +(b.mat * f.costo).toFixed(2);
    const mo = +(b.mo * f.costo).toFixed(2);
    const eq = +(b.eq * f.costo).toFixed(2);
    return {
      codigo,
      nombre: b.nombre,
      unidad: b.unidad,
      tipologia,
      rendimientoCuadrilla: +(b.rend * f.rend).toFixed(1),
      costoMateriales: mat,
      costoManoObra: mo,
      costoEquipo: eq,
      insumos: makeInsumos(codigo, mat, mo, eq),
    };
  });
};

// ===== SEED DATA REMOVED =====
// All SEED_* arrays removed. Use store with localStorage persistence instead.
