import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictResolutionService } from '../services/conflictResolution';
import type { ResourceConflict, ConflictProject } from '../types/conflicts';

vi.mock('../store', () => ({
  uid: vi.fn(() => 'mock-uid'),
}));

const NOW = 1720000000000;
let service: ConflictResolutionService;

function makeConflict(overrides: Partial<ResourceConflict> = {}): ResourceConflict {
  const proyectos: ConflictProject[] = [
    {
      proyectoId: 'proy-1',
      proyectoNombre: 'Proyecto Alpha',
      fechaInicio: '2025-01-01',
      fechaFin: '2025-12-31',
      porcentajeUso: 50,
      prioridad: 4,
    },
    {
      proyectoId: 'proy-2',
      proyectoNombre: 'Proyecto Beta',
      fechaInicio: '2025-03-01',
      fechaFin: '2025-09-30',
      porcentajeUso: 50,
      prioridad: 2,
    },
  ];

  return {
    id: 'conflict-1',
    tipo: 'empleado',
    severidad: 'alto',
    estado: 'detectado',
    titulo: 'Empleado asignado a múltiples proyectos simultáneos',
    descripcion: 'Juan Pérez está asignado a 2 proyectos con fechas superpuestas',
    recursoId: 'emp-1',
    recursoNombre: 'Juan Pérez',
    proyectos,
    fechaDeteccion: new Date(NOW).toISOString(),
    impactoCosto: 7500,
    impactoPlazo: 6,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.setSystemTime(NOW);
  service = new ConflictResolutionService();
});

describe('ConflictResolutionService', () => {
  describe('generateSuggestions', () => {
    it('generates 3 suggestions for employee conflicts', () => {
      const conflict = makeConflict({ tipo: 'empleado' });
      const suggestions = service.generateSuggestions(conflict);
      expect(suggestions).toHaveLength(3);
      const tipos = suggestions.map(s => s.tipo);
      expect(tipos).toContain('reasignar');
      expect(tipos).toContain('reprogramar');
      expect(tipos).toContain('subcontratar');
    });

    it('generates 3 suggestions for material conflicts', () => {
      const conflict = makeConflict({ tipo: 'material' });
      const suggestions = service.generateSuggestions(conflict);
      expect(suggestions).toHaveLength(3);
      const tipos = suggestions.map(s => s.tipo);
      expect(tipos).toContain('adquirir');
      expect(tipos).toContain('reprogramar');
      expect(tipos).toContain('reasignar');
    });

    it('generates 3 suggestions for asset conflicts', () => {
      const conflict = makeConflict({ tipo: 'activo' });
      const suggestions = service.generateSuggestions(conflict);
      expect(suggestions).toHaveLength(3);
      const tipos = suggestions.map(s => s.tipo);
      expect(tipos).toContain('reprogramar');
      expect(tipos).toContain('adquirir');
      expect(tipos).toContain('subcontratar');
    });

    it('generates 3 suggestions for timeline conflicts', () => {
      const conflict = makeConflict({ tipo: 'timeline' });
      const suggestions = service.generateSuggestions(conflict);
      expect(suggestions).toHaveLength(3);
      const tipos = suggestions.map(s => s.tipo);
      expect(tipos).toContain('reprogramar');
      expect(tipos).toContain('adquirir');
      expect(tipos).toContain('cancelar');
    });

    it('returns empty array for unknown conflict type', () => {
      const conflict = makeConflict({ tipo: 'equipo' as any });
      const suggestions = service.generateSuggestions(conflict);
      expect(suggestions).toEqual([]);
    });

    it('suggestions sorted by probabilidadExito descending', () => {
      const conflict = makeConflict({ tipo: 'empleado' });
      const suggestions = service.generateSuggestions(conflict);
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].probabilidadExito).toBeGreaterThanOrEqual(suggestions[i].probabilidadExito);
      }
    });

    it('employee suggestions first item maintains in high-priority project', () => {
      const conflict = makeConflict({ tipo: 'empleado' });
      const suggestions = service.generateSuggestions(conflict);
      expect(suggestions[0].tipo).toBe('reasignar');
      expect(suggestions[0].descripcion).toContain('Proyecto Alpha');
    });

    it('material suggestions first item is purchase (highest success probability)', () => {
      const conflict = makeConflict({ tipo: 'material' });
      const suggestions = service.generateSuggestions(conflict);
      expect(suggestions[0].tipo).toBe('adquirir');
      expect(suggestions[0].probabilidadExito).toBe(90);
    });
  });

  describe('applyResolution', () => {
    it('returns ConflictResolution with correct fields', () => {
      const conflict = makeConflict();
      const suggestion = {
        id: 'sug-1',
        conflictoId: 'conflict-1',
        tipo: 'reasignar',
        titulo: 'Mantener en proyecto prioritario',
        descripcion: 'Asignar recurso exclusivamente',
        ventajas: ['Maximiza eficiencia'],
        desventajas: ['Requiere contratar'],
        costoEstimado: 6000,
        impactoPlazo: 7,
        probabilidadExito: 85,
        esfuerzoImplementacion: 'medio' as const,
      };
      const resolution = service.applyResolution(conflict, suggestion, 'Ing. García');
      expect(resolution.tipo).toBe('reasignar');
      expect(resolution.descripcion).toBe('Asignar recurso exclusivamente');
      expect(resolution.costoEstimado).toBe(6000);
      expect(resolution.impactoPlazo).toBe(7);
      expect(resolution.responsable).toBe('Ing. García');
      expect(resolution.fechaImplementacion).toBe(new Date(NOW).toISOString());
    });
  });

  describe('calculateResolutionImpact', () => {
    it('calculates positive cost savings when resolution < conflict cost', () => {
      const conflict = makeConflict({ impactoCosto: 10000 });
      const resolution = {
        tipo: 'reprogramar' as const,
        descripcion: 'Reprogramar',
        costoEstimado: 2000,
        impactoPlazo: 3,
        responsable: 'Ing. García',
        fechaImplementacion: new Date(NOW).toISOString(),
      };
      const impact = service.calculateResolutionImpact(conflict, resolution);
      expect(impact.costoSavings).toBe(8000);
    });

    it('returns 0 savings when resolution > conflict cost', () => {
      const conflict = makeConflict({ impactoCosto: 5000 });
      const resolution = {
        tipo: 'reprogramar' as const,
        descripcion: 'Reprogramar',
        costoEstimado: 8000,
        impactoPlazo: 3,
        responsable: 'Ing. García',
        fechaImplementacion: new Date(NOW).toISOString(),
      };
      const impact = service.calculateResolutionImpact(conflict, resolution);
      expect(impact.costoSavings).toBe(0);
    });

    it('calculates positive plazo reduction', () => {
      const conflict = makeConflict({ impactoPlazo: 10 });
      const resolution = {
        tipo: 'reprogramar' as const,
        descripcion: 'Reprogramar',
        costoEstimado: 1000,
        impactoPlazo: 4,
        responsable: 'Ing. García',
        fechaImplementacion: new Date(NOW).toISOString(),
      };
      const impact = service.calculateResolutionImpact(conflict, resolution);
      expect(impact.plazoReduction).toBe(6);
    });

    it('returns 0 for negative reduction', () => {
      const conflict = makeConflict({ impactoPlazo: 5 });
      const resolution = {
        tipo: 'reprogramar' as const,
        descripcion: 'Reprogramar',
        costoEstimado: 1000,
        impactoPlazo: 10,
        responsable: 'Ing. García',
        fechaImplementacion: new Date(NOW).toISOString(),
      };
      const impact = service.calculateResolutionImpact(conflict, resolution);
      expect(impact.plazoReduction).toBe(0);
    });
  });
});
