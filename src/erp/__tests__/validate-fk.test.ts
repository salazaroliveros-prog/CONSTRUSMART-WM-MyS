import { describe, it, expect } from 'vitest';
import { validateForeignKey } from '../utils';

describe('validateForeignKey', () => {
  const mockEntityArray = [
    { id: 'proj-1' },
    { id: 'proj-2' },
    { id: 'proj-3' },
  ];

  it('debe retornar true cuando el foreign key existe en el array', () => {
    const result = validateForeignKey('proj-1', mockEntityArray, 'proyecto');
    expect(result).toBe(true);
  });

  it('debe retornar false cuando el foreign key no existe en el array', () => {
    const result = validateForeignKey('proj-999', mockEntityArray, 'proyecto');
    expect(result).toBe(false);
  });

  it('debe retornar false cuando el foreign key es null', () => {
    const result = validateForeignKey(null, mockEntityArray, 'proyecto');
    expect(result).toBe(false);
  });

  it('debe retornar false cuando el foreign key es undefined', () => {
    const result = validateForeignKey(undefined, mockEntityArray, 'proyecto');
    expect(result).toBe(false);
  });

  it('debe retornar false cuando el foreign key es string vacío', () => {
    const result = validateForeignKey('', mockEntityArray, 'proyecto');
    expect(result).toBe(false);
  });

  it('debe funcionar con array vacío', () => {
    const result = validateForeignKey('proj-1', [], 'proyecto');
    expect(result).toBe(false);
  });

  it('debe manejar case-sensitive matching', () => {
    const result = validateForeignKey('PROJ-1', mockEntityArray, 'proyecto');
    expect(result).toBe(false);
  });
});
