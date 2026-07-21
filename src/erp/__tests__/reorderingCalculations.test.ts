import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calcularPatronConsumo,
  calcularLeadTimeProveedor,
  calcularPuntoReorden,
  calcularCantidadEOQ,
  calcularUrgencia,
  calcularFechaEstimadaAgotamiento,
  generarReorderSuggestion,
  analizarProyectoParaReordering,
} from '../utils/reorderingCalculations';
import type { ConsumoHistorico, Material, Orden, Proveedor, Hito, ReorderConfig } from '../store/schemas/reordering';

const buildDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const baseConsumo = (overrides: Partial<ConsumoHistorico> = {}): ConsumoHistorico => ({
  id: 'consumo-1',
  materialId: 'mat-1',
  proyectoId: 'proy-1',
  cantidad: 10,
  fecha: buildDate(0),
  ...overrides,
});

const baseMaterial = (overrides: Partial<Material> = {}): Material => ({
  id: 'mat-1',
  nombre: 'Cemento',
  proyectoId: 'proy-1',
  stock: 100,
  stockMinimo: 20,
  stockMaximo: 200,
  precio: 50,
  unidad: 'sacos',
  categoria: 'materiales',
  ...overrides,
}) as Material;

const baseProveedor = (overrides: Partial<Proveedor> = {}): Proveedor => ({
  id: 'prov-1',
  nombre: 'Proveedor A',
  categoria: 'materiales',
  calificacion: 4,
  ...overrides,
}) as Proveedor;

const baseOrden = (overrides: Partial<Orden> = {}): Orden => ({
  id: 'orden-1',
  proveedorId: 'prov-1',
  estado: 'recibida',
  fecha: buildDate(10),
  ...overrides,
}) as Orden;

const baseHito = (overrides: Partial<Hito> = {}): Hito => ({
  id: 'hito-1',
  proyectoId: 'proy-1',
  nombre: 'Hito 1',
  estado: 'pendiente',
  fecha: buildDate(5),
  ...overrides,
}) as Hito;

const baseConfig = (overrides: Partial<ReorderConfig> = {}): ReorderConfig => ({
  metodoCalculo: 'default',
  stockSeguridadDias: 3,
  stockMaximoMultiplo: 2,
  costoOrdenamiento: 100,
  costoAlmacenamiento: 10,
  proveedorPreferidoId: undefined,
  ...overrides,
}) as ReorderConfig;

describe('reorderingCalculations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-21T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calcularPatronConsumo', () => {
    it('returns undefined when no consumos match', () => {
      const result = calcularPatronConsumo('mat-1', 'proy-1', []);
      expect(result).toBeUndefined();
    });

    it('returns undefined when less than 2 consumos', () => {
      const consumos = [baseConsumo({ id: '1' })];
      const result = calcularPatronConsumo('mat-1', 'proy-1', consumos);
      expect(result).toBeUndefined();
    });

    it('returns undefined when no consumos in last 30 days', () => {
      const consumos = [baseConsumo({ id: '1', fecha: buildDate(31) })];
      const result = calcularPatronConsumo('mat-1', 'proy-1', consumos);
      expect(result).toBeUndefined();
    });

    it('calculates averages from last 30 days', () => {
      const consumos = [
        baseConsumo({ id: '1', cantidad: 10 }),
        baseConsumo({ id: '2', cantidad: 20 }),
        baseConsumo({ id: '3', cantidad: 30 }),
      ];
      const result = calcularPatronConsumo('mat-1', 'proy-1', consumos);
      expect(result).toBeDefined();
      expect(result?.consumoPromedioDiario).toBeCloseTo(2, 5);
      expect(result?.consumoPromedioMensual).toBe(60);
      expect(result?.picoConsumoCantidad).toBe(60);
    });
  });

  describe('calcularLeadTimeProveedor', () => {
    it('returns undefined when no orders for proveedor', () => {
      const result = calcularLeadTimeProveedor('prov-x', 'mat-1', []);
      expect(result).toBeUndefined();
    });

    it('returns undefined when no completed orders', () => {
      const ordenes = [baseOrden({ estado: 'pendiente' })];
      const result = calcularLeadTimeProveedor('prov-1', 'mat-1', ordenes);
      expect(result).toBeUndefined();
    });

    it('calculates lead time statistics', () => {
      const ordenes = [
        baseOrden({ id: '1', fecha: buildDate(5) }),
        baseOrden({ id: '2', fecha: buildDate(10) }),
        baseOrden({ id: '3', fecha: buildDate(15) }),
      ];
      const result = calcularLeadTimeProveedor('prov-1', 'mat-1', ordenes);
      expect(result).toBeDefined();
      expect(result?.leadTimePromedio).toBeGreaterThan(0);
      expect(result?.leadTimeMinimo).toBeGreaterThan(0);
      expect(result?.totalOrdenes).toBe(3);
    });
  });

  describe('calcularPuntoReorden', () => {
    it('returns stockMinimo when below threshold', () => {
      const result = calcularPuntoReorden(5, 20, 0, 7, 3);
      expect(result).toBe(20);
    });

    it('calculates demand during lead time + safety stock', () => {
      const result = calcularPuntoReorden(100, 10, 10, 7, 3);
      expect(result).toBe(100);
    });
  });

  describe('calcularCantidadEOQ', () => {
    it('returns 0 for non-positive inputs', () => {
      expect(calcularCantidadEOQ(0, 100, 10)).toBe(0);
      expect(calcularCantidadEOQ(1000, 0, 10)).toBe(0);
      expect(calcularCantidadEOQ(1000, 100, -5)).toBe(0);
    });

    it('calculates EOQ correctly', () => {
      const result = calcularCantidadEOQ(1200, 100, 10);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('calcularUrgencia', () => {
    it('returns critica when stock <= 0', () => {
      const result = calcularUrgencia(0, 10, 7, buildDate(10));
      expect(result).toBe('critica');
    });

    it('returns critica when agotamiento <= leadTime', () => {
      const result = calcularUrgencia(50, 10, 7, buildDate(-3));
      expect(result).toBe('critica');
    });

    it('returns alta when agotamiento <= leadTime * 2', () => {
      const result = calcularUrgencia(50, 10, 7, buildDate(-10));
      expect(result).toBe('alta');
    });

    it('returns media when stock <= puntoReorden', () => {
      const result = calcularUrgencia(10, 20, 7, buildDate(-15));
      expect(result).toBe('media');
    });

    it('returns baja otherwise', () => {
      const result = calcularUrgencia(200, 20, 7, buildDate(-15));
      expect(result).toBe('baja');
    });
  });

  describe('calcularFechaEstimadaAgotamiento', () => {
    it('returns today when stock <= 0', () => {
      const result = calcularFechaEstimadaAgotamiento(0, 10);
      const today = new Date().toISOString();
      expect(result).toBe(today);
    });

    it('calculates future date based on consumption', () => {
      const result = calcularFechaEstimadaAgotamiento(100, 10);
      const fecha = new Date(result);
      expect(fecha.getTime()).toBeGreaterThan(new Date().getTime());
    });
  });

  describe('generarReorderSuggestion', () => {
    it('generates suggestion with default config', () => {
      const input = {
        material: baseMaterial(),
        proyectoId: 'proy-1',
        proyectoNombre: 'Proyecto 1',
        consumosHistoricos: [
          baseConsumo({ id: '1', cantidad: 10 }),
          baseConsumo({ id: '2', cantidad: 20 }),
        ],
        proveedores: [baseProveedor()],
        ordenes: [],
        valesSalida: [],
        hitos: [],
        config: baseConfig(),
      };

      const result = generarReorderSuggestion(input);
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion.materialId).toBe('mat-1');
      expect(result.suggestion.estado).toBe('pendiente');
    });
  });

  describe('analizarProyectoParaReordering', () => {
    it('identifies critical materials', () => {
      const materiales = [
        baseMaterial({ id: '1', stock: 5, stockMinimo: 10 }),
        baseMaterial({ id: '2', stock: 50, stockMinimo: 10 }),
      ];
      const result = analizarProyectoParaReordering('proy-1', materiales, []);
      expect(result.materialesPrioritarios).toContain('1');
    });
  });
});
