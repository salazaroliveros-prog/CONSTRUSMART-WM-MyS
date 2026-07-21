import { describe, it, expect, vi, beforeEach } from 'vitest';
import { motorReglasFactores, safeParseReglaFactorArray, parseReglaFactor } from '../services/reglasFactores';
import type { ReglaFactor } from '../services/reglasFactores';

describe('reglasFactores', () => {
  describe('safeParseReglaFactorArray', () => {
    it('parses valid array data', () => {
      const data = [
        {
          id: '1',
          nombre: 'Test',
          tipo_factor: 'zona',
          prioridad: 1,
          condicion: {},
          factor_aplicacion: 1.1,
          operador: 'multiplicar',
          ambito: 'global',
          activo: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];
      const result = safeParseReglaFactorArray(data);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('returns empty array for invalid data', () => {
      expect(safeParseReglaFactorArray(null)).toEqual([]);
      expect(safeParseReglaFactorArray(undefined)).toEqual([]);
      expect(safeParseReglaFactorArray('invalid')).toEqual([]);
    });
  });

  describe('parseReglaFactor', () => {
    it('parses valid object', () => {
      const data = {
        id: '1',
        nombre: 'Test',
        tipo_factor: 'zona' as ReglaFactor['tipo_factor'],
        prioridad: 1,
        condicion: {},
        factor_aplicacion: 1.1,
        operador: 'multiplicar' as ReglaFactor['operador'],
        ambito: 'global' as ReglaFactor['ambito'],
        activo: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };
      const result = parseReglaFactor(data);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
    });

    it('returns null for invalid object', () => {
      expect(parseReglaFactor(null)).toBeNull();
      expect(parseReglaFactor({ id: '1' })).toBeNull();
    });
  });

  describe('MotorReglasFactores.evaluarCondicion', () => {
    const motor = motorReglasFactores;

    it('returns true for empty condition', async () => {
      const result = await motor.evaluarCondicion({}, {});
      expect(result).toBe(true);
    });

    it('returns true when context matches simple equality', async () => {
      const condicion = { departamento: 'GT' };
      const contexto = { departamento: 'GT' };
      const result = await motor.evaluarCondicion(condicion, contexto);
      expect(result).toBe(true);
    });

    it('returns false when context does not match simple equality', async () => {
      const condicion = { departamento: 'GT' };
      const contexto = { departamento: 'MX' };
      const result = await motor.evaluarCondicion(condicion, contexto);
      expect(result).toBe(false);
    });

    it('returns false when context value is undefined', async () => {
      const condicion = { departamento: 'GT' };
      const resultado = await motor.evaluarCondicion(condicion, {});
      expect(resultado).toBe(false);
    });

    it('evaluates operador igual', async () => {
      const condicion = { departamento: { operador: 'igual', valor: 'GT' } };
      expect(await motor.evaluarCondicion(condicion, { departamento: 'GT' })).toBe(true);
      expect(await motor.evaluarCondicion(condicion, { departamento: 'MX' })).toBe(false);
    });

    it('evaluates operador mayor', async () => {
      const condicion = { altitud: { operador: 'mayor', valor: 1000 } };
      expect(await motor.evaluarCondicion(condicion, { altitud: 1500 })).toBe(true);
      expect(await motor.evaluarCondicion(condicion, { altitud: 500 })).toBe(false);
    });

    it('evaluates operador menor', async () => {
      const condicion = { altitud: { operador: 'menor', valor: 1000 } };
      expect(await motor.evaluarCondicion(condicion, { altitud: 500 })).toBe(true);
      expect(await motor.evaluarCondicion(condicion, { altitud: 1500 })).toBe(false);
    });

    it('evaluates operador contiene', async () => {
      const condicion = { nombre: { operador: 'contiene', valor: 'residencial' } };
      expect(await motor.evaluarCondicion(condicion, { nombre: 'Proyecto residencial' })).toBe(true);
      expect(await motor.evaluarCondicion(condicion, { nombre: 'Proyecto comercial' })).toBe(false);
    });

    it('evaluates operador en', async () => {
      const condicion = { tipologia: { operador: 'en', valor: 'residencial, comercial' } };
      expect(await motor.evaluarCondicion(condicion, { tipologia: 'residencial' })).toBe(true);
      expect(await motor.evaluarCondicion(condicion, { tipologia: 'industrial' })).toBe(false);
    });
  });
});
