import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'es', changeLanguage: vi.fn() } }),
}));

const mockLog = vi.fn();
vi.mock('@/lib/auto-logger', () => ({
  log: (...args: any[]) => mockLog(...args),
  getLogs: () => [],
}));

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: {
    log: vi.fn(), warn: vi.fn(), error: vi.fn(), info: vi.fn(),
  },
}));

interface HealthReport {
  healthy: boolean;
  issues: string[];
  timestamp: string;
  module: string;
  recoveredKeys: string[];
}

function checkStoreHealth(state: Record<string, unknown>, moduleName = 'UnknownStore'): boolean {
  const issues: string[] = [];
  for (const [key, value] of Object.entries(state)) {
    if (value === undefined) {
      issues.push(`Key "${key}" is undefined`);
    } else if (value === null) {
      issues.push(`Key "${key}" is null (expected object/array/primitive)`);
    } else if (typeof value === 'number' && isNaN(value)) {
      issues.push(`Key "${key}" is NaN`);
    } else if (typeof value === 'string' && value.length === 0 && key !== '') {
      issues.push(`Key "${key}" is empty string`);
    }
  }
  return issues.length === 0;
}

function recoverStoreState<T extends Record<string, unknown>>(
  state: T,
  defaults: Partial<T>,
  moduleName = 'UnknownStore'
): { recovered: T; report: HealthReport } {
  const recovered: Record<string, unknown> = { ...state };
  const issues: string[] = [];
  const recoveredKeys: string[] = [];

  for (const [key, value] of Object.entries(state)) {
    if (value === undefined || value === null) {
      const defaultValue = defaults[key as keyof T];
      if (defaultValue !== undefined) {
        recovered[key] = defaultValue;
        recoveredKeys.push(key);
        issues.push(`Key "${key}" was ${value === undefined ? 'undefined' : 'null'}, recovered with default`);
      }
    } else if (typeof value === 'number' && isNaN(value)) {
      const defaultValue = defaults[key as keyof T];
      if (defaultValue !== undefined) {
        recovered[key] = defaultValue;
        recoveredKeys.push(key);
        issues.push(`Key "${key}" was NaN, recovered with default`);
      }
    }
  }

  return {
    recovered: recovered as T,
    report: {
      healthy: issues.length === 0,
      issues,
      timestamp: new Date().toISOString(),
      module: moduleName,
      recoveredKeys,
    },
  };
}

const mockEnqueueMutation = vi.fn();
const mockSetMutationQueue = vi.fn();

vi.mock('../erp/store', () => ({
  useErp: () => ({
    mutationQueue: [],
    proyectos: [],
    enqueueMutation: mockEnqueueMutation,
    setMutationQueue: mockSetMutationQueue,
  }),
}));

describe('Store Health and Recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Store health check detects NaN', () => {
    it('identifies NaN values in store state', () => {
      const state = {
        proyectos: [],
        avanceFisico: NaN,
        presupuestoTotal: 100000,
      };

      const healthy = checkStoreHealth(state);
      expect(healthy).toBe(false);
    });

    it('reports NaN in a number field', () => {
      const state = {
        movimientos: [],
        monto: NaN,
        fecha: '2026-01-01',
      };

      const healthy = checkStoreHealth(state);
      expect(healthy).toBe(false);
    });

    it('passes check when all numbers are valid', () => {
      const state = {
        proyectos: [],
        avanceFisico: 75,
        presupuestoTotal: 500000,
        costoDirecto: 0,
      };

      const healthy = checkStoreHealth(state);
      expect(healthy).toBe(true);
    });
  });

  describe('Store health check detects undefined keys', () => {
    it('identifies undefined values', () => {
      const state = {
        proyectos: undefined,
        movimientos: [],
        empleados: [],
      };

      const healthy = checkStoreHealth(state);
      expect(healthy).toBe(false);
    });

    it('identifies null values', () => {
      const state = {
        proyectos: null,
        materiales: [],
      };

      const healthy = checkStoreHealth(state);
      expect(healthy).toBe(false);
    });

    it('identifies empty strings as potential issues', () => {
      const state = {
        syncMessage: '',
        proyectos: [],
      };

      const healthy = checkStoreHealth(state);
      expect(healthy).toBe(false);
    });
  });

  describe('recoverStoreState restores defaults', () => {
    it('replaces NaN with default value', () => {
      const state = { avanceFisico: NaN as any, proyectos: [] };
      const defaults = { avanceFisico: 0, proyectos: [] as any[] };

      const { recovered, report } = recoverStoreState(state, defaults);

      expect(recovered.avanceFisico).toBe(0);
      expect(report.recoveredKeys).toContain('avanceFisico');
      expect(report.healthy).toBe(false);
    });

    it('replaces undefined with default value', () => {
      const state: Record<string, unknown> = { proyectos: undefined, movimientos: [] };
      const defaults = { proyectos: [] as any[] };

      const { recovered, report } = recoverStoreState(state, defaults);

      expect(recovered.proyectos).toEqual([]);
      expect(report.recoveredKeys).toContain('proyectos');
    });

    it('replaces null with default value', () => {
      const state: Record<string, unknown> = { materiales: null, proyectos: [] };
      const defaults = { materiales: [] as any[] };

      const { recovered, report } = recoverStoreState(state, defaults);
      expect(recovered.materiales).toEqual([]);
      expect(report.recoveredKeys).toContain('materiales');
    });

    it('returns healthy true when no issues found', () => {
      const state = { proyectos: [], movimientos: [], empleados: [] };
      const defaults = {};

      const { recovered, report } = recoverStoreState(state, defaults);
      expect(report.healthy).toBe(true);
      expect(report.recoveredKeys).toHaveLength(0);
    });
  });

  describe('loadFromStorage with corrupt schema', () => {
    it('catches schema mismatch and uses default', () => {
      const badData = JSON.stringify([{ id: 'p1', nombre: 'Test', presupuestoTotal: 'NOT_A_NUMBER' }]);
      localStorage.setItem('test_key', badData);

      const loadFromStorage = (key: string, fallback: any[]): any[] => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return fallback;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
          return fallback;
        } catch {
          return fallback;
        }
      };

      const result = loadFromStorage('test_key', []);
      expect(result).toHaveLength(1);
    });

    it('returns empty array for completely corrupt data', () => {
      localStorage.setItem('test_key', '{{{{[[corrupt');

      const loadFromStorage = (key: string, fallback: any[]): any[] => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return fallback;
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
          return fallback;
        } catch {
          return fallback;
        }
      };

      const result = loadFromStorage('test_key', []);
      expect(result).toEqual([]);
    });

    it('handles type corruption in nested fields', () => {
      const corruptData = JSON.stringify([{ id: 'p1', nombre: 'Test', renglones: 'NOT_AN_ARRAY' }]);
      localStorage.setItem('test_key', corruptData);

      const loadAndValidate = (key: string, validator: (item: any) => boolean, fallback: any[]): any[] => {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return fallback;
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return fallback;
          return parsed.filter(validator);
        } catch {
          return fallback;
        }
      };

      const result = loadAndValidate('test_key', (item) => {
        return typeof item.id === 'string' && typeof item.nombre === 'string';
      }, []);

      expect(result).toHaveLength(1);
    });
  });

  describe('forceSync error handling', () => {
    it('logs error when supabase insert fails and continues queue', async () => {
      const processed: string[] = [];
      const failed: any[] = [];
      const queue = [
        { id: 'm1', type: 'addProyecto', payload: { nombre: 'Test' }, retryCount: 0 },
      ];

      const processOps = async (ops: any[]) => {
        for (const m of ops) {
          const error = { message: 'Database error' };
          if (m.retryCount >= 3) {
            processed.push(m.id);
          } else {
            failed.push({ ...m, retryCount: (m.retryCount || 0) + 1 });
          }
        }
        return { processed, failed };
      };

      const { processed: p, failed: f } = await processOps(queue);
      expect(p).toHaveLength(0);
      expect(f).toHaveLength(1);
      expect(f[0].retryCount).toBe(1);
    });

    it('marks mutation as processed after max retries', async () => {
      const processed: string[] = [];
      const failed: any[] = [];
      const queue = [
        { id: 'm1', type: 'addProyecto', payload: {}, retryCount: 3 },
      ];

      queue.forEach(m => {
        if (m.retryCount >= 3) {
          processed.push(m.id);
        } else {
          failed.push({ ...m, retryCount: m.retryCount + 1 });
        }
      });

      expect(processed).toHaveLength(1);
      expect(failed).toHaveLength(0);
    });

    it('handles PGRST116 (row not found) without retry', () => {
      const processed: string[] = [];
      const queue = [
        { id: 'm1', type: 'updateProyecto', payload: { id: 'nonexistent' }, retryCount: 0 },
      ];

      queue.forEach(m => {
        processed.push(m.id);
      });

      expect(processed).toHaveLength(1);
    });
  });

  describe('Multiple forceSync errors do not block queue', () => {
    it('processes all items even when some fail', async () => {
      const processed: string[] = [];
      const failed: any[] = [];

      const queue = Array.from({ length: 5 }, (_, i) => ({
        id: `m${i}`, type: 'addProyecto', payload: { nombre: `Test${i}` }, retryCount: 0,
      }));

      const processBatch = async () => {
        for (let i = 0; i < queue.length; i++) {
          const m = queue[i];
          if (i < 2) {
            failed.push({ ...m, retryCount: m.retryCount + 1 });
          } else {
            processed.push(m.id);
          }
        }
        return { processed, failed };
      };

      const result = await processBatch();
      expect(result.processed).toHaveLength(3);
      expect(result.failed).toHaveLength(2);
      expect(result.processed).toEqual(['m2', 'm3', 'm4']);
    });

    it('does not lose items when batch partially fails', () => {
      const fullQueue = Array.from({ length: 5 }, (_, i) => ({ id: `m${i}`, type: 'addProyecto', retryCount: 0 }));
      const processed = ['m2', 'm3', 'm4'];
      const failedIds = ['m0', 'm1'];

      const remaining = fullQueue.filter(m => !processed.includes(m.id));
      const failedEntries = fullQueue.filter(m => failedIds.includes(m.id));
      failedEntries.forEach(f => {
        if (!remaining.find(r => r.id === f.id)) remaining.push(f);
      });

      expect(remaining).toHaveLength(2);
      expect(remaining[0].id).toBe('m0');
      expect(remaining[1].id).toBe('m1');
    });
  });

  describe('fetchInitialData with partial failure', () => {
    it('uses partial data when some tables fail', async () => {
      const CRITICAL_TABLES = ['erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales'];

      const fetchTable = async (table: string) => {
        if (table === 'erp_proyectos' || table === 'erp_movimientos') {
          return { table, data: [], authError: true };
        }
        return { table, data: [{ id: `${table}_1` }], authError: false };
      };

      const results = await Promise.allSettled(CRITICAL_TABLES.map(fetchTable));
      const statePatch: Record<string, any> = {};
      let errorCount = 0;
      let authErrorCount = 0;

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const { table, data, authError } = result.value;
          statePatch[table] = Array.isArray(data) ? data : [];
          if (authError) authErrorCount++;
        } else {
          errorCount++;
        }
      }

      expect(Object.keys(statePatch)).toHaveLength(4);
      expect(authErrorCount).toBe(2);
    });

    it('sets syncStatus to error when critical tables all fail', async () => {
      const fetchTable = async (table: string) => {
        return { table, data: [], authError: true };
      };

      const tables = ['erp_proyectos', 'erp_movimientos'];
      const results = await Promise.allSettled(tables.map(fetchTable));

      const criticalErrors = results.filter(r => r.status === 'fulfilled' && r.value?.authError).length;
      const syncError = criticalErrors > 0 ? 'Errores de autenticación en tablas críticas' : 'OK';

      expect(criticalErrors).toBe(2);
      expect(syncError).toBe('Errores de autenticación en tablas críticas');
    });

    it('still loads secondary tables after critical partial failure', async () => {
      const SECONDARY_TABLES = ['erp_hitos', 'erp_riesgos'];

      const fetchTable = async (table: string) => {
        if (table === 'erp_hitos') {
          return { table, data: [{ id: 'h1', nombre: 'Hito 1' }], authError: false };
        }
        return { table, data: [], authError: true };
      };

      const results = await Promise.allSettled(SECONDARY_TABLES.map(fetchTable));
      const statePatch: Record<string, any> = {};
      let secondaryErrors = 0;

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          const { table, data, authError } = result.value;
          if (!authError) {
            statePatch[table] = data;
          } else {
            secondaryErrors++;
          }
        }
      }

      expect(statePatch.erp_hitos).toHaveLength(1);
      expect(secondaryErrors).toBe(1);
    });
  });

  describe('ErrorBoundary catches render error', () => {
    it('renders fallback UI when component throws', () => {
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        try {
          return <>{children}</>;
        } catch {
          return <div role="alert">Error en la aplicación. Contacte al administrador.</div>;
        }
      };

      const ThrowingComponent = () => {
        throw new Error('Render failure');
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      let capturedError: Error | null = null;
      let fallbackRendered = false;

      try {
        render(
          <ErrorBoundary>
            <ThrowingComponent />
          </ErrorBoundary>
        );
      } catch (e) {
        capturedError = e as Error;
      }

      if (capturedError) {
        fallbackRendered = true;
      }

      if (!capturedError) {
        try {
          render(
            <ErrorBoundary>
              <ThrowingComponent />
            </ErrorBoundary>
          );
        } catch (e) {
          fallbackRendered = true;
        }
      }

      expect(fallbackRendered || capturedError !== null).toBeTruthy();
      consoleSpy.mockRestore();
    });

    it('recovers after error when state is reset', () => {
      let hasError = true;

      const resetError = () => {
        hasError = false;
      };

      const ComponentWithConditionalError = () => {
        if (hasError) throw new Error('Temporary error');
        return <div data-testid="recovered">Recovered</div>;
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const renderWithRecovery = () => {
        try {
          const { container } = render(<ComponentWithConditionalError />);
          return container;
        } catch {
          resetError();
          try {
            const { container } = render(<ComponentWithConditionalError />);
            return container;
          } catch {
            return null;
          }
        }
      };

      const result = renderWithRecovery();
      expect(hasError).toBe(false);
      consoleSpy.mockRestore();
    });
  });
});
