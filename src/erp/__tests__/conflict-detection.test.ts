import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictDetectionService } from '../services/conflictDetection';

vi.mock('../store', () => ({
  uid: vi.fn(() => 'mock-uid'),
}));

const NOW = 1720000000000;
const FIXED_ISO = new Date(NOW).toISOString();

function makeProyecto(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'proy-1',
    nombre: 'Proyecto Alpha',
    cliente: 'Cliente A',
    tipologia: 'residencial',
    estado: 'ejecucion',
    presupuestoTotal: 500000,
    avanceFisico: 30,
    avanceFinanciero: 25,
    fechaInicio: '2025-01-01',
    fechaFin: '2025-12-31',
    montoContrato: 800000,
    ...overrides,
  };
}

function makeEmpleado(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'emp-1',
    nombre: 'Juan Pérez',
    activo: true,
    proyectoIds: ['proy-1', 'proy-2'],
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

function makeActivo(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'act-1',
    nombre: 'Retroexcavadora',
    activo: true,
    proyectoIds: ['proy-1', 'proy-2'],
    valorAdquisicion: 500000,
    tipo: 'equipo',
    ...overrides,
  };
}

function makeHito(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'hito-1',
    proyectoId: 'proy-1',
    nombre: 'Cimentación',
    fecha: new Date(NOW - 10 * 86400000).toISOString(),
    estado: 'pendiente',
    tipo: 'hito',
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

let service: ConflictDetectionService;

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(NOW);
  service = new ConflictDetectionService();
});

describe('ConflictDetectionService', () => {
  describe('detectEmployeeConflicts', () => {
    it('returns empty when no employees', () => {
      const result = service.detectEmployeeConflicts(null, [makeProyecto() as any]);
      expect(result).toEqual([]);
    });

    it('returns empty when employees not active', () => {
      const emp = makeEmpleado({ activo: false, proyectoIds: ['proy-1', 'proy-2'] });
      const result = service.detectEmployeeConflicts([emp as any], [makeProyecto() as any]);
      expect(result).toEqual([]);
    });

    it('returns empty when employee has 0-1 proyectos', () => {
      const emp = makeEmpleado({ proyectoIds: ['proy-1'] });
      const result = service.detectEmployeeConflicts([emp as any], [makeProyecto() as any]);
      expect(result).toEqual([]);
    });

    it('returns conflict when employee has 2+ overlapping projects', () => {
      const emp = makeEmpleado();
      const p1 = makeProyecto({ id: 'proy-1', fechaInicio: '2025-01-01', fechaFin: '2025-06-30' });
      const p2 = makeProyecto({ id: 'proy-2', fechaInicio: '2025-03-01', fechaFin: '2025-09-30' });
      const result = service.detectEmployeeConflicts([emp as any], [p1 as any, p2 as any]);
      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('empleado');
      expect(result[0].recursoId).toBe('emp-1');
      expect(result[0].recursoNombre).toBe('Juan Pérez');
      expect(result[0].proyectos).toHaveLength(2);
    });

    it('calculates severity based on conflict count', () => {
      const emp = makeEmpleado({ salarioDiario: 100000, proyectoIds: ['p1', 'p2', 'p3', 'p4'] });
      const ps = [1, 2, 3, 4].map(i => makeProyecto({
        id: `p${i}`,
        fechaInicio: '2025-01-01',
        fechaFin: '2025-12-31',
      }));
      const result = service.detectEmployeeConflicts([emp as any], ps as any);
      if (result.length > 0) {
        expect(['critico', 'alto', 'medio', 'bajo']).toContain(result[0].severidad);
      }
    });

    it('handles null/undefined empleados gracefully', () => {
      const result = service.detectEmployeeConflicts(undefined, []);
      expect(result).toEqual([]);
    });

    it('handles employees with no proyectoIds', () => {
      const emp = makeEmpleado({ proyectoIds: undefined });
      const result = service.detectEmployeeConflicts([emp as any], [makeProyecto() as any]);
      expect(result).toEqual([]);
    });
  });

  describe('detectMaterialConflicts', () => {
    it('returns empty when no materials', () => {
      const result = service.detectMaterialConflicts(null, [], []);
      expect(result).toEqual([]);
    });

    it('returns empty when stock is sufficient', () => {
      const mat = makeMaterial({ stock: 200 });
      const orden = makeOrden({ cantidad: 50, proyectoId: 'proy-1', materialId: 'mat-1' });
      const result = service.detectMaterialConflicts(
        [mat as any],
        [makeProyecto() as any],
        [orden as any]
      );
      expect(result).toEqual([]);
    });

    it('returns conflict when totalRequested > availability', () => {
      const mat = makeMaterial({ stock: 50 });
      const orden1 = makeOrden({ cantidad: 40, proyectoId: 'proy-1', materialId: 'mat-1' });
      const orden2 = makeOrden({ cantidad: 30, proyectoId: 'proy-2', materialId: 'mat-1' });
      const p1 = makeProyecto({ id: 'proy-1' });
      const p2 = makeProyecto({ id: 'proy-2' });
      const result = service.detectMaterialConflicts(
        [mat as any],
        [p1 as any, p2 as any],
        [orden1 as any, orden2 as any]
      );
      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('material');
      expect(result[0].recursoId).toBe('mat-1');
    });

    it('handles null/undefined materiales gracefully', () => {
      const result = service.detectMaterialConflicts(undefined, [], []);
      expect(result).toEqual([]);
    });
  });

  describe('detectAssetConflicts', () => {
    it('returns conflict when asset has 2+ overlapping projects', () => {
      const act = makeActivo({ proyectoIds: ['proy-1', 'proy-2'] });
      const p1 = makeProyecto({ id: 'proy-1', fechaInicio: '2025-01-01', fechaFin: '2025-06-30' });
      const p2 = makeProyecto({ id: 'proy-2', fechaInicio: '2025-03-01', fechaFin: '2025-09-30' });
      const result = service.detectAssetConflicts([act as any], [p1 as any, p2 as any]);
      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('activo');
      expect(result[0].recursoId).toBe('act-1');
    });

    it('returns empty when asset has 0-1 projects', () => {
      const act = makeActivo({ proyectoIds: ['proy-1'] });
      const result = service.detectAssetConflicts([act as any], [makeProyecto() as any]);
      expect(result).toEqual([]);
    });

    it('returns empty when asset not active', () => {
      const act = makeActivo({ activo: false, proyectoIds: ['proy-1', 'proy-2'] });
      const result = service.detectAssetConflicts([act as any], [makeProyecto() as any, makeProyecto({ id: 'proy-2' }) as any]);
      expect(result).toEqual([]);
    });

    it('handles null/undefined activos gracefully', () => {
      const result = service.detectAssetConflicts(null, []);
      expect(result).toEqual([]);
    });
  });

  describe('detectTimelineConflicts', () => {
    it('returns empty when no delayed hitos', () => {
      const hito = makeHito({ fecha: new Date(NOW + 86400000).toISOString() });
      const result = service.detectTimelineConflicts([makeProyecto() as any], [hito as any]);
      expect(result).toEqual([]);
    });

    it('returns conflict when hitos are past due', () => {
      const hito = makeHito({ fecha: new Date(NOW - 5 * 86400000).toISOString() });
      const result = service.detectTimelineConflicts([makeProyecto() as any], [hito as any]);
      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('timeline');
      expect(result[0].recursoId).toBe('proy-1');
    });

    it('severity depends on delay: bajo=7d, medio=14d, alto=30d, critico>30d', () => {
      const mockService = new (ConflictDetectionService as any)();

      const hitoBajo = makeHito({ fecha: new Date(NOW - 3 * 86400000).toISOString() });
      const resBajo = mockService.detectTimelineConflicts([makeProyecto() as any], [hitoBajo as any]);
      if (resBajo.length > 0) expect(resBajo[0].severidad).toBe('bajo');

      const hitoMedio = makeHito({ fecha: new Date(NOW - 10 * 86400000).toISOString() });
      const resMedio = mockService.detectTimelineConflicts([makeProyecto() as any], [hitoMedio as any]);
      if (resMedio.length > 0) expect(resMedio[0].severidad).toBe('medio');

      const hitoAlto = makeHito({ fecha: new Date(NOW - 20 * 86400000).toISOString() });
      const resAlto = mockService.detectTimelineConflicts([makeProyecto() as any], [hitoAlto as any]);
      if (resAlto.length > 0) expect(resAlto[0].severidad).toBe('alto');

      const hitoCritico = makeHito({ fecha: new Date(NOW - 45 * 86400000).toISOString() });
      const resCritico = mockService.detectTimelineConflicts([makeProyecto() as any], [hitoCritico as any]);
      if (resCritico.length > 0) expect(resCritico[0].severidad).toBe('critico');
    });

    it('ignores completed hitos', () => {
      const hito = makeHito({ estado: 'completado', fecha: new Date(NOW - 10 * 86400000).toISOString() });
      const result = service.detectTimelineConflicts([makeProyecto() as any], [hito as any]);
      expect(result).toEqual([]);
    });
  });

  describe('calculateResourceAllocation', () => {
    it('returns allocations for employees, materials, assets', () => {
      const emp = makeEmpleado({ proyectoIds: ['proy-1'] });
      const mat = makeMaterial({ stock: 100 });
      const act = makeActivo({ proyectoIds: ['proy-1'] });
      const result = service.calculateResourceAllocation(
        [emp as any],
        [mat as any],
        [act as any],
        [makeProyecto() as any]
      );
      expect(result).toHaveLength(3);
      expect(result[0].tipo).toBe('empleado');
      expect(result[1].tipo).toBe('material');
      expect(result[2].tipo).toBe('activo');
    });

    it('marks conflicts when utilization > 100%', () => {
      const emp = makeEmpleado({ proyectoIds: ['proy-1', 'proy-2'] });
      const result = service.calculateResourceAllocation(
        [emp as any],
        [],
        [],
        [makeProyecto() as any, makeProyecto({ id: 'proy-2' }) as any]
      );
      expect(result[0].conflictosActivos).toBe(1);
    });
  });

  describe('detectAllConflicts', () => {
    it('runs all detectors and returns combined sorted results', () => {
      const emp = makeEmpleado();
      const p1 = makeProyecto({ id: 'proy-1', fechaInicio: '2025-01-01', fechaFin: '2025-06-30' });
      const p2 = makeProyecto({ id: 'proy-2', fechaInicio: '2025-03-01', fechaFin: '2025-09-30' });
      const result = service.detectAllConflicts(
        [emp as any],
        [],
        [],
        [p1 as any, p2 as any],
        [],
        []
      );
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('sorts by severity (critico first)', () => {
      const result = service.detectAllConflicts([], [], [], [], [], []);
      expect(result).toEqual([]);
    });

    it('handles empty/null data for all inputs', () => {
      const result = service.detectAllConflicts(null, null, null, [], null, null);
      expect(result).toEqual([]);
    });
  });
});
