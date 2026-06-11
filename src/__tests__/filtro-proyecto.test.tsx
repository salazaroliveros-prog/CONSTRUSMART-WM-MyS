import { describe, it, expect } from 'vitest';

const items = [
  { id: 'a', proyectoId: 'p1', nombre: 'A' },
  { id: 'b', proyectoId: 'p2', nombre: 'B' },
  { id: 'c', proyectoId: 'p1', nombre: 'C' },
  { id: 'd', proyectoId: 'p3', nombre: 'D' },
];

function useFiltroProyectoGlobal(items: any[], filtroProyectoId: string | null) {
  if (!filtroProyectoId) return items;
  return items.filter(item => item.proyectoId === filtroProyectoId);
}

describe('FiltroProyecto — useFiltroProyectoGlobal', () => {
  it('retorna todo el array cuando filtro es null', () => {
    expect(useFiltroProyectoGlobal(items, null)).toHaveLength(4);
  });

  it('filtra por proyectoId cuando se proporciona', () => {
    expect(useFiltroProyectoGlobal(items, 'p1')).toHaveLength(2);
    expect(useFiltroProyectoGlobal(items, 'p1').every(i => i.proyectoId === 'p1')).toBe(true);
  });

  it('retorna array vacío si el proyecto no existe', () => {
    expect(useFiltroProyectoGlobal(items, 'p99')).toHaveLength(0);
  });

  it('incluye item con proyectoId vacío cuando no hay filtro', () => {
    const mixed = [...items, { id: 'e', proyectoId: '', nombre: 'E' }];
    expect(useFiltroProyectoGlobal(mixed, null)).toHaveLength(5);
  });

  it('excluye item con proyectoId vacío al filtrar', () => {
    const mixed = [...items, { id: 'e', proyectoId: '', nombre: 'E' }];
    expect(useFiltroProyectoGlobal(mixed, 'p1')).toHaveLength(2);
  });
});
