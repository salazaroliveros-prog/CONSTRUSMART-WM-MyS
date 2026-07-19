import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateProjectProfitability,
  calculateClientProfitability,
  generateProfitabilityForecast,
  calculateResourceEfficiency,
  analyzeProfitabilityTrends,
  optimizePricing,
} from '../services/profitabilityAnalytics';

vi.mock('../store', () => ({
  uid: vi.fn(() => 'mock-uid'),
}));

const NOW = 1720000000000;

function makeProyecto(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'proy-1',
    nombre: 'Edificio Torres',
    cliente: 'Constructora ABC',
    clienteNit: 'CF-123456',
    tipologia: 'residencial',
    estado: 'ejecucion',
    presupuestoTotal: 500000,
    montoContrato: 600000,
    avanceFisico: 60,
    avanceFinanciero: 50,
    fechaInicio: '2025-01-01',
    fechaFin: '2025-12-31',
    subtipo: 'alto',
    plazoSemanas: 48,
    ...overrides,
  };
}

function makeMovimiento(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'mov-1',
    proyectoId: 'proy-1',
    tipo: 'gasto',
    categoria: 'materiales',
    monto: 10000,
    costoTotal: 10000,
    descripcion: 'Compra de cemento',
    fecha: '2025-06-01',
    ...overrides,
  };
}

function makeEmpleado(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'emp-1',
    nombre: 'Juan Pérez',
    activo: true,
    proyectoIds: ['proy-1'],
    salarioDiario: 250,
    puesto: 'Albañil',
    tipo: 'planilla',
    ...overrides,
  };
}

function makeMaterial(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'mat-1',
    nombre: 'Cemento',
    stock: 100,
    stockMinimo: 20,
    precioUnitario: 150,
    categoria: 'materiales',
    unidad: 'bolsa',
    ...overrides,
  };
}

function makeOrden(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'ord-1',
    proyectoId: 'proy-1',
    materialId: 'mat-1',
    cantidad: 60,
    estado: 'aprobado',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(NOW);
});

describe('profitabilityAnalytics', () => {
  describe('calculateProjectProfitability', () => {
    it('calculates correct costoReal from gasto movements', () => {
      const proyecto = makeProyecto();
      const movimientos = [
        makeMovimiento({ tipo: 'gasto', monto: 10000, costoTotal: 10000 }),
        makeMovimiento({ tipo: 'gasto', monto: 5000, costoTotal: 5000 }),
      ];
      const result = calculateProjectProfitability(
        proyecto as any, movimientos as any, [], []
      );
      expect(result.costoReal).toBe(15000);
    });

    it('calculates correct ingresoReal from ingreso movements', () => {
      const proyecto = makeProyecto();
      const movimientos = [
        makeMovimiento({ tipo: 'ingreso', monto: 30000, costoTotal: 30000 }),
        makeMovimiento({ tipo: 'ingreso', monto: 20000, costoTotal: 20000 }),
      ];
      const result = calculateProjectProfitability(
        proyecto as any, movimientos as any, [], []
      );
      expect(result.ingresoReal).toBe(50000);
    });

    it('calculates utilidadBruta = ingreso - costo', () => {
      const proyecto = makeProyecto();
      const movimientos = [
        makeMovimiento({ tipo: 'ingreso', monto: 50000, costoTotal: 50000 }),
        makeMovimiento({ tipo: 'gasto', monto: 20000, costoTotal: 20000 }),
      ];
      const result = calculateProjectProfitability(
        proyecto as any, movimientos as any, [], []
      );
      expect(result.utilidadBruta).toBe(30000);
    });

    it('calculates margenBruto percentage', () => {
      const proyecto = makeProyecto();
      const movimientos = [
        makeMovimiento({ tipo: 'ingreso', monto: 100000, costoTotal: 100000 }),
        makeMovimiento({ tipo: 'gasto', monto: 70000, costoTotal: 70000 }),
      ];
      const result = calculateProjectProfitability(
        proyecto as any, movimientos as any, [], []
      );
      expect(result.margenBruto).toBe(30);
    });

    it('returns excelente status when margen >= 20 and variacion <= 5', () => {
      const proyecto = makeProyecto({ presupuestoTotal: 100000 });
      const movimientos = [
        makeMovimiento({ tipo: 'ingreso', monto: 100000, costoTotal: 100000 }),
        makeMovimiento({ tipo: 'gasto', monto: 70000, costoTotal: 70000 }),
      ];
      const result = calculateProjectProfitability(
        proyecto as any, movimientos as any, [], []
      );
      expect(result.estadoRentabilidad).toBe('excelente');
      expect(result.margenBruto).toBe(30);
    });

    it('returns critico status when margen < 5', () => {
      const proyecto = makeProyecto({ presupuestoTotal: 50000 });
      const movimientos = [
        makeMovimiento({ tipo: 'ingreso', monto: 100000, costoTotal: 100000 }),
        makeMovimiento({ tipo: 'gasto', monto: 98000, costoTotal: 98000 }),
      ];
      const result = calculateProjectProfitability(
        proyecto as any, movimientos as any, [], []
      );
      expect(result.estadoRentabilidad).toBe('critico');
      expect(result.margenBruto).toBe(2);
    });

    it('handles empty movements gracefully', () => {
      const proyecto = makeProyecto();
      const result = calculateProjectProfitability(
        proyecto as any, [], [], []
      );
      expect(result.costoReal).toBe(0);
      expect(result.ingresoReal).toBe(0);
      expect(result.utilidadBruta).toBe(0);
      expect(result.margenBruto).toBe(0);
    });

    it('calculates eficienciaLabor, desperdicioMateriales, utilizacionEquipo', () => {
      const proyecto = makeProyecto();
      const movimientos = [
        makeMovimiento({ tipo: 'gasto', categoria: 'mano_obra', monto: 35000 }),
        makeMovimiento({ tipo: 'gasto', categoria: 'materiales', monto: 45000 }),
        makeMovimiento({ tipo: 'gasto', categoria: 'equipo', monto: 10000 }),
        makeMovimiento({ tipo: 'ingreso', categoria: 'ventas', monto: 100000 }),
      ];
      const empleados = [makeEmpleado()];
      const ordenes = [makeOrden()];
      const result = calculateProjectProfitability(
        proyecto as any, movimientos as any, empleados as any, ordenes as any
      );
      expect(typeof result.eficienciaLabor).toBe('number');
      expect(typeof result.desperdicioMateriales).toBe('number');
      expect(typeof result.utilizacionEquipo).toBe('number');
      expect(result.scoreEficiencia).toBeGreaterThanOrEqual(0);
    });

    it('score is average of 3 metrics', () => {
      const proyecto = makeProyecto();
      const movimientos = [
        makeMovimiento({ tipo: 'gasto', categoria: 'mano_obra', monto: 35000 }),
        makeMovimiento({ tipo: 'gasto', categoria: 'materiales', monto: 45000 }),
        makeMovimiento({ tipo: 'gasto', categoria: 'equipo', monto: 10000 }),
        makeMovimiento({ tipo: 'ingreso', categoria: 'ventas', monto: 100000 }),
      ];
      const result = calculateProjectProfitability(
        proyecto as any, movimientos as any, [] as any, [] as any
      );
      const expectedScore = (result.eficienciaLabor + (100 - result.desperdicioMateriales) + result.utilizacionEquipo) / 3;
      expect(result.scoreEficiencia).toBeCloseTo(expectedScore, 5);
    });

    it('critico when variacion > 20', () => {
      const proyecto = makeProyecto({ presupuestoTotal: 50000 });
      const movimientos = [
        makeMovimiento({ tipo: 'ingreso', monto: 100000, costoTotal: 100000 }),
        makeMovimiento({ tipo: 'gasto', monto: 90000, costoTotal: 90000 }),
      ];
      const result = calculateProjectProfitability(
        proyecto as any, movimientos as any, [], []
      );
      expect(result.variacionPresupuesto).toBe(80);
      expect(result.estadoRentabilidad).toBe('critico');
    });
  });

  describe('calculateClientProfitability', () => {
    it('calculates across all projects for a client', () => {
      const proyectos = [
        makeProyecto({ id: 'p1', cliente: 'Constructora ABC', montoContrato: 300000 }),
        makeProyecto({ id: 'p2', cliente: 'Constructora ABC', montoContrato: 200000 }),
      ];
      const movimientos = [
        makeMovimiento({ proyectoId: 'p1', tipo: 'ingreso', monto: 300000, costoTotal: 300000 }),
        makeMovimiento({ proyectoId: 'p1', tipo: 'gasto', monto: 200000, costoTotal: 200000 }),
        makeMovimiento({ proyectoId: 'p2', tipo: 'ingreso', monto: 200000, costoTotal: 200000 }),
        makeMovimiento({ proyectoId: 'p2', tipo: 'gasto', monto: 150000, costoTotal: 150000 }),
      ];
      const result = calculateClientProfitability(
        'Constructora ABC', 'CF-123456', proyectos as any, movimientos as any
      );
      expect(result.cliente).toBe('Constructora ABC');
      expect(result.proyectosCount).toBe(2);
      expect(result.valorTotalContratos).toBe(500000);
      expect(result.costoTotalReal).toBe(350000);
      expect(result.utilidadTotal).toBe(150000);
    });

    it('identifies most/least profitable projects', () => {
      const proyectos = [
        makeProyecto({ id: 'p1', nombre: 'Proyecto A', cliente: 'ABC', montoContrato: 100000 }),
        makeProyecto({ id: 'p2', nombre: 'Proyecto B', cliente: 'ABC', montoContrato: 100000 }),
      ];
      const movimientos = [
        makeMovimiento({ proyectoId: 'p1', tipo: 'ingreso', monto: 100000 }),
        makeMovimiento({ proyectoId: 'p1', tipo: 'gasto', monto: 60000 }),
        makeMovimiento({ proyectoId: 'p2', tipo: 'ingreso', monto: 100000 }),
        makeMovimiento({ proyectoId: 'p2', tipo: 'gasto', monto: 90000 }),
      ];
      const result = calculateClientProfitability(
        'ABC', 'CF-1', proyectos as any, movimientos as any
      );
      expect(result.proyectoMasRentable).toBe('Proyecto A');
      expect(result.proyectoMenosRentable).toBe('Proyecto B');
    });

    it('segments correctly: vip', () => {
      const proyectos = [
        makeProyecto({ id: 'p1', cliente: 'ABC', montoContrato: 500000 }),
        makeProyecto({ id: 'p2', cliente: 'ABC', montoContrato: 400000 }),
        makeProyecto({ id: 'p3', cliente: 'ABC', montoContrato: 300000 }),
      ];
      const movimientos = Array.from({ length: 3 }, (_, i) => [
        makeMovimiento({ proyectoId: `p${i + 1}`, tipo: 'ingreso', monto: 500000, costoTotal: 500000 }),
        makeMovimiento({ proyectoId: `p${i + 1}`, tipo: 'gasto', monto: 300000, costoTotal: 300000 }),
      ]).flat();
      const result = calculateClientProfitability(
        'ABC', 'CF-1', proyectos as any, movimientos as any
      );
      expect(result.segmento).toBe('vip');
    });

    it('segments correctly: bajo_margen', () => {
      const proyecto = makeProyecto({ cliente: 'XYZ', montoContrato: 50000 });
      const movimientos = [
        makeMovimiento({ tipo: 'ingreso', monto: 50000 }),
        makeMovimiento({ tipo: 'gasto', monto: 48000 }),
      ];
      const result = calculateClientProfitability(
        'XYZ', 'CF-2', [proyecto as any], movimientos as any
      );
      expect(result.segmento).toBe('bajo_margen');
    });

    it('calculates retention probability', () => {
      const proyecto = makeProyecto({ cliente: 'ABC', montoContrato: 100000 });
      const result = calculateClientProfitability(
        'ABC', 'CF-1', [proyecto as any], []
      );
      expect(typeof result.probabilidadRetencion).toBe('number');
      expect(result.probabilidadRetencion).toBeGreaterThanOrEqual(0);
      expect(result.probabilidadRetencion).toBeLessThanOrEqual(100);
    });

    it('handles single-project clients', () => {
      const proyecto = makeProyecto({ cliente: 'SingleCo' });
      const movimientos = [
        makeMovimiento({ tipo: 'ingreso', monto: 50000 }),
        makeMovimiento({ tipo: 'gasto', monto: 40000 }),
      ];
      const result = calculateClientProfitability(
        'SingleCo', 'CF-3', [proyecto as any], movimientos as any
      );
      expect(result.proyectosCount).toBe(1);
      expect(result.valorVidaCliente).toBe(result.utilidadTotal);
    });
  });

  describe('generateProfitabilityForecast', () => {
    it('generates optimistic/base/pessimistic scenarios', () => {
      const params = {
        proyectoId: 'proy-1',
        tipoProyeccion: 'rentabilidad' as const,
        fechaBase: new Date(NOW).toISOString().split('T')[0],
        diasProyeccion: 90,
      };
      const historicalData = Array.from({ length: 6 }, (_, i) => ({
        periodo: new Date(NOW - (5 - i) * 30 * 86400000).toISOString().slice(0, 7),
        utilidadBruta: 10000 + i * 500,
      }));
      const proyecto = makeProyecto({ presupuestoTotal: 500000 });
      const result = generateProfitabilityForecast(
        params, historicalData as any, proyecto as any
      );
      expect(result.escenarioOptimista).toBeGreaterThan(result.escenarioBase);
      expect(result.escenarioBase).toBeGreaterThan(result.escenarioPesimista);
      expect(result.tipoProyeccion).toBe('rentabilidad');
    });

    it('confidence increases with data points', () => {
      const params = {
        proyectoId: 'proy-1',
        tipoProyeccion: 'rentabilidad' as const,
        fechaBase: '2024-01',
        diasProyeccion: 30,
      };
      const manyData = Array.from({ length: 6 }, (_, i) => ({
        periodo: new Date(NOW - (5 - i) * 30 * 86400000).toISOString().slice(0, 7),
        utilidadBruta: 10000,
      }));
      const fewData = Array.from({ length: 1 }, (_, i) => ({
        periodo: new Date(NOW - i * 30 * 86400000).toISOString().slice(0, 7),
        utilidadBruta: 10000,
      }));
      const proyecto = makeProyecto();
      const resultMany = generateProfitabilityForecast(
        params, manyData as any, proyecto as any
      );
      const resultFew = generateProfitabilityForecast(
        params, fewData as any, proyecto as any
      );
      expect(resultMany.confianza).toBeGreaterThanOrEqual(resultFew.confianza);
    });

    it('identifies risk and opportunity factors', () => {
      const params = {
        proyectoId: 'proy-1',
        tipoProyeccion: 'rentabilidad' as const,
        fechaBase: new Date(NOW).toISOString().split('T')[0],
        diasProyeccion: 30,
      };
      const proyecto = makeProyecto({ estado: 'pausado', avanceFisico: 30, avanceFinanciero: 60 });
      const result = generateProfitabilityForecast(
        params, [] as any, proyecto as any
      );
      expect(result.factoresRiesgo.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateResourceEfficiency', () => {
    it('calculates by resource type', () => {
      const movimientos = [
        makeMovimiento({ categoria: 'materiales', monto: 45000 }),
        makeMovimiento({ categoria: 'materiales', monto: 5000 }),
      ];
      const result = calculateResourceEfficiency(
        'proy-1', 'materiales', movimientos as any, 100000
      );
      expect(result.tipoRecurso).toBe('materiales');
      expect(result.costoReal).toBe(50000);
      expect(result.costoPlaneado).toBe(45000);
    });

    it('sets alertaDesviacion when desperdicio > 15', () => {
      const movimientos = [
        makeMovimiento({ categoria: 'materiales', monto: 1000 }),
      ];
      const result = calculateResourceEfficiency(
        'proy-1', 'materiales', movimientos as any, 100
      );
      expect(result.alertaDesviacion).toBe(true);
    });

    it('uses subcontrato filter for subcontratos type', () => {
      const movimientos = [
        makeMovimiento({ categoria: 'subcontrato', monto: 5000 }),
      ];
      const result = calculateResourceEfficiency(
        'proy-1', 'subcontratos', movimientos as any, 50000
      );
      expect(result.tipoRecurso).toBe('subcontratos');
      expect(result.costoReal).toBe(5000);
    });

    it('returns 0 productividad when no movimientos', () => {
      const result = calculateResourceEfficiency(
        'proy-1', 'mano_obra', [] as any, 50000
      );
      expect(result.productividad).toBe(0);
    });
  });

  describe('analyzeProfitabilityTrends', () => {
    it('analyzes by tipoAnalisis global', () => {
      const proyectos = [makeProyecto(), makeProyecto({ id: 'p2', estado: 'finalizado' })];
      const data = [
        { proyectoId: 'proy-1', margenBruto: 18 },
        { proyectoId: 'p2', margenBruto: 22 },
      ];
      const result = analyzeProfitabilityTrends(
        proyectos as any, data as any, 'rentabilidad_global'
      );
      expect(result.tipoAnalisis).toBe('rentabilidad_global');
      expect(result.rentabilidadPromedio).toBe(20);
      expect(result.proyectosActivos).toBe(1);
    });

    it('generates alertas for low margins', () => {
      const proyectos = [makeProyecto({ tipologia: 'residencial' })];
      const data = [{ proyectoId: 'proy-1', margenBruto: 5 }];
      const result = analyzeProfitabilityTrends(
        proyectos as any, data as any, 'por_tipologia'
      );
      expect(result.alertas.length).toBeGreaterThanOrEqual(1);
    });

    it('generates oportunidades for high margins', () => {
      const proyectos = [makeProyecto({ tipologia: 'comercial' })];
      const data = [{ proyectoId: 'proy-1', margenBruto: 25 }];
      const result = analyzeProfitabilityTrends(
        proyectos as any, data as any, 'por_tipologia'
      );
      expect(result.oportunidades.length).toBeGreaterThanOrEqual(1);
    });

    it('analyzes by por_cliente', () => {
      const proyectos = [makeProyecto({ cliente: 'ABC' })];
      const data = [{ proyectoId: 'proy-1', margenBruto: 12 }];
      const result = analyzeProfitabilityTrends(
        proyectos as any, data as any, 'por_cliente'
      );
      expect(result.tipoAnalisis).toBe('por_cliente');
      expect(Object.keys(result.tendencias)).toContain('ABC');
    });
  });

  describe('optimizePricing', () => {
    it('calculates optimized price with adjustments', () => {
      const proyectos = [makeProyecto({ tipologia: 'residencial' })];
      const data = [{ proyectoId: 'proy-1', margenBruto: 15 }];
      const result = optimizePricing('residencial', undefined, data as any, proyectos as any);
      expect(result.tipologia).toBe('residencial');
      expect(result.margenHistoricoPromedio).toBe(15);
      expect(result.margenObjetivo).toBe(18);
      expect(result.precioOptimizado).toBeGreaterThan(0);
    });

    it('historical margin affects target margin', () => {
      const proyectos = [makeProyecto({ tipologia: 'comercial' })];
      const dataHigh = [{ proyectoId: 'proy-1', margenBruto: 25 }];
      const dataLow: unknown[] = [];
      const resultHigh = optimizePricing('comercial', undefined, dataHigh as any, proyectos as any);
      const resultLow = optimizePricing('comercial', undefined, dataLow as any, proyectos as any);
      expect(resultHigh.margenObjetivo).toBeGreaterThan(resultLow.margenObjetivo);
    });

    it('risk and complexity vary by tipologia', () => {
      const result = optimizePricing('publica', undefined, [] as any, [] as any);
      expect(result.factorRiesgo).toBe(0.15);
      expect(result.complejidadPromedio).toBe(0.10);
    });

    it('confidence increases with data points', () => {
      const proyectos = [makeProyecto({ tipologia: 'residencial' })];
      const manyData = Array.from({ length: 9 }, () => ({ proyectoId: 'proy-1', margenBruto: 15 }));
      const result = optimizePricing('residencial', undefined, manyData as any, proyectos as any);
      expect(result.confianzaRecomendacion).toBe(95);
    });
  });
});
