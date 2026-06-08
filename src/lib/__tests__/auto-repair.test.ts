import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeParse, safeParseArray, strictParse } from '@/lib/safe-parse';
import { checkStoreHealth, recoverStoreState, generateHealthReport } from '@/lib/store-health';
import { z } from 'zod';

// ────────────────────────────────────────────────────────────
// Tests: safe-parse.ts
// ────────────────────────────────────────────────────────────

describe('safeParse', () => {
  const userSchema = z.object({
    id: z.string(),
    name: z.string(),
    age: z.number().optional(),
  });

  const defaultUser = { id: '', name: '', age: 0 };

  it('debe retornar datos válidos cuando el input es correcto', () => {
    const result = safeParse(userSchema, { id: '1', name: 'Juan', age: 30 }, defaultUser);
    expect(result).toEqual({ id: '1', name: 'Juan', age: 30 });
  });

  it('debe retornar fallback cuando el input es inválido', () => {
    const result = safeParse(userSchema, { id: 123, name: null }, defaultUser);
    expect(result).toEqual(defaultUser);
  });

  it('debe retornar fallback cuando el input es null', () => {
    const result = safeParse(userSchema, null, defaultUser);
    expect(result).toEqual(defaultUser);
  });

  it('debe retornar fallback cuando el input es undefined', () => {
    const result = safeParse(userSchema, undefined, defaultUser);
    expect(result).toEqual(defaultUser);
  });

  it('debe retornar fallback cuando el input no es objeto', () => {
    const result = safeParse(userSchema, 'string-invalido', defaultUser);
    expect(result).toEqual(defaultUser);
  });

  it('debe manejar schemas con transformaciones', () => {
    const schema = z.string().transform(s => s.toUpperCase());
    const result = safeParse(schema, 'hola', 'FALLBACK');
    expect(result).toBe('HOLA');
  });

  it('debe retornar default para campos opcionales faltantes con default', () => {
    const schema = z.object({
      name: z.string().default('anonimo'),
      active: z.boolean().default(true),
    });
    const result = safeParse(schema, {}, { name: 'anonimo', active: true });
    expect(result.name).toBe('anonimo');
    expect(result.active).toBe(true);
  });
});

describe('safeParseArray', () => {
  const itemSchema = z.object({
    id: z.string(),
    value: z.number(),
  });

  it('debe validar todos los items correctamente', () => {
    const data = [{ id: '1', value: 10 }, { id: '2', value: 20 }];
    const result = safeParseArray(itemSchema, data, []);
    expect(result).toHaveLength(2);
  });

  it('debe filtrar items inválidos y mantener los válidos', () => {
    const data = [{ id: '1', value: 10 }, { id: 123, value: 'no' }, { id: '3', value: 30 }];
    const result = safeParseArray(itemSchema, data, []);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('3');
  });

  it('debe retornar fallback si no es array', () => {
    const result = safeParseArray(itemSchema, 'no-es-array', [{ id: 'default', value: 0 }]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('default');
  });

  it('debe retornar fallback si todos los items son inválidos', () => {
    const result = safeParseArray(itemSchema, [{ id: 123, value: 'x' }], []);
    expect(result).toEqual([]);
  });
});

describe('strictParse', () => {
  const schema = z.object({ id: z.string() });

  it('debe retornar datos validados correctamente', () => {
    const result = strictParse(schema, { id: '1' });
    expect(result).toEqual({ id: '1' });
  });

  it('debe lanzar error si la validación falla', () => {
    expect(() => strictParse(schema, { id: 123 })).toThrow();
    expect(() => strictParse(schema, null)).toThrow();
    expect(() => strictParse(schema, undefined)).toThrow();
  });
});

// ────────────────────────────────────────────────────────────
// Tests: store-health.ts
// ────────────────────────────────────────────────────────────

describe('checkStoreHealth', () => {
  it('debe retornar true para estado saludable', () => {
    const state = { proyectos: [], user: { name: 'test' }, count: 0 };
    expect(checkStoreHealth(state)).toBe(true);
  });

  it('debe detectar keys con undefined', () => {
    const state = { proyectos: undefined as any, user: null as any };
    expect(checkStoreHealth(state)).toBe(false);
  });

  it('debe detectar valores NaN', () => {
    const state = { total: NaN, name: 'test' };
    expect(checkStoreHealth(state)).toBe(false);
  });

  it('debe detectar null en valores que deberían ser objetos', () => {
    const state = { user: null, proyectos: [] };
    expect(checkStoreHealth(state)).toBe(false);
  });

  it('no debe fallar con estado vacío', () => {
    expect(checkStoreHealth({})).toBe(true);
  });
});

describe('recoverStoreState', () => {
  it('debe recuperar keys inválidas con valores por defecto', () => {
    const state = { proyectos: undefined as any, usuarios: null as any, config: { theme: 'dark' } };
    const defaults = { proyectos: [], usuarios: [] };
    const { recovered, report } = recoverStoreState(state, defaults);
    
    expect(recovered.proyectos).toEqual([]);
    expect(recovered.usuarios).toEqual([]);
    expect(recovered.config).toEqual({ theme: 'dark' });
    expect(report.recoveredKeys).toHaveLength(2);
    expect(report.healthy).toBe(false);
  });

  it('debe reportar keys sin default como issues', () => {
    const state = { keySinDefault: undefined as any };
    const { recovered, report } = recoverStoreState(state, {});
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.healthy).toBe(false);
  });

  it('no debe modificar estado saludable', () => {
    const state = { a: 1, b: 'ok' };
    const { recovered, report } = recoverStoreState(state, {});
    expect(recovered).toEqual(state);
    expect(report.healthy).toBe(true);
  });
});

describe('generateHealthReport', () => {
  it('debe generar reporte para estado saludable', () => {
    const report = generateHealthReport({ a: 1, b: 'ok' }, 'TestStore');
    expect(report.healthy).toBe(true);
    expect(report.module).toBe('TestStore');
    expect(report.issues).toHaveLength(0);
    expect(report.timestamp).toBeTruthy();
  });

  it('debe listar issues en reporte', () => {
    const report = generateHealthReport({ a: undefined as any, b: NaN, c: null as any }, 'BadStore');
    expect(report.healthy).toBe(false);
    expect(report.issues).toHaveLength(3);
  });
});

// ────────────────────────────────────────────────────────────
// Tests: auto-logger.ts (sin localStorage simulado)
// ────────────────────────────────────────────────────────────

describe('auto-logger (integración básica)', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('wm_erp_logs');
    }
  });

  it('debe exportar función log sin errores', async () => {
    const { log } = await import('@/lib/auto-logger');
    expect(typeof log).toBe('function');
  });

  it('debe exportar función getLogs sin errores', async () => {
    const { getLogs } = await import('@/lib/auto-logger');
    expect(typeof getLogs).toBe('function');
  });

  it('debe exportar función clearLogs sin errores', async () => {
    const { clearLogs } = await import('@/lib/auto-logger');
    expect(typeof clearLogs).toBe('function');
  });

  it('getLogs debe retornar array vacío inicialmente', async () => {
    const { getLogs } = await import('@/lib/auto-logger');
    const logs = getLogs();
    expect(Array.isArray(logs)).toBe(true);
  });
});