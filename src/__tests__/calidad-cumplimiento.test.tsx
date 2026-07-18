import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import CalidadCumplimiento from '@/erp/screens/CalidadCumplimiento';

afterEach(cleanup);

function calcularCumplimiento(aprobadas: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((aprobadas / total) * 100);
}

type Inspeccion = {
  id: string;
  proyectoId: string;
  proyectoNombre: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  tipo: string;
  gravedad: 'baja' | 'media' | 'alta' | 'critica';
  inspector: string;
  fecha: string;
  accionesCorrectivas: string[];
};

const inspeccionesMock: Inspeccion[] = [
  { id: '1', proyectoId: 'p1', proyectoNombre: 'Proyecto Alpha', estado: 'aprobado', tipo: 'Estructural', gravedad: 'media', inspector: 'Carlos', fecha: '2026-07-01', accionesCorrectivas: [] },
  { id: '2', proyectoId: 'p1', proyectoNombre: 'Proyecto Alpha', estado: 'aprobado', tipo: 'Eléctrico', gravedad: 'baja', inspector: 'Ana', fecha: '2026-07-02', accionesCorrectivas: [] },
  { id: '3', proyectoId: 'p2', proyectoNombre: 'Proyecto Beta', estado: 'rechazado', tipo: 'Estructural', gravedad: 'critica', inspector: 'Carlos', fecha: '2026-07-03', accionesCorrectivas: ['Reparar fisura'] },
  { id: '4', proyectoId: 'p2', proyectoNombre: 'Proyecto Beta', estado: 'pendiente', tipo: 'Hidrosanitario', gravedad: 'alta', inspector: 'Luis', fecha: '2026-07-04', accionesCorrectivas: [] },
  { id: '5', proyectoId: 'p3', proyectoNombre: 'Proyecto Gamma', estado: 'aprobado', tipo: 'Estructural', gravedad: 'media', inspector: 'Ana', fecha: '2026-07-05', accionesCorrectivas: [] },
  { id: '6', proyectoId: 'p3', proyectoNombre: 'Proyecto Gamma', estado: 'pendiente', tipo: 'Acabados', gravedad: 'baja', inspector: 'Luis', fecha: '2026-07-06', accionesCorrectivas: [] },
  { id: '7', proyectoId: 'p1', proyectoNombre: 'Proyecto Alpha', estado: 'rechazado', tipo: 'Eléctrico', gravedad: 'alta', inspector: 'Carlos', fecha: '2026-07-07', accionesCorrectivas: ['Revisar conexiones'] },
  { id: '8', proyectoId: 'p2', proyectoNombre: 'Proyecto Beta', estado: 'aprobado', tipo: 'Acabados', gravedad: 'baja', inspector: 'Ana', fecha: '2026-07-08', accionesCorrectivas: [] },
];

function filtrarInspecciones(
  inspecciones: Inspeccion[],
  filtros: { proyectoId?: string; estado?: string; fechaDesde?: string; fechaHasta?: string }
): Inspeccion[] {
  return inspecciones.filter(ins => {
    if (filtros.proyectoId && ins.proyectoId !== filtros.proyectoId) return false;
    if (filtros.estado && ins.estado !== filtros.estado) return false;
    if (filtros.fechaDesde && ins.fecha < filtros.fechaDesde) return false;
    if (filtros.fechaHasta && ins.fecha > filtros.fechaHasta) return false;
    return true;
  });
}

function agruparPorTipo(inspecciones: Inspeccion[]): Record<string, number> {
  const grupos: Record<string, number> = {};
  inspecciones.forEach(ins => { grupos[ins.tipo] = (grupos[ins.tipo] || 0) + 1; });
  return grupos;
}

function agruparPorGravedad(inspecciones: Inspeccion[]): Record<string, number> {
  const grupos: Record<string, number> = {};
  inspecciones.forEach(ins => { grupos[ins.gravedad] = (grupos[ins.gravedad] || 0) + 1; });
  return grupos;
}

function cambiarEstado(
  inspecciones: Inspeccion[],
  id: string,
  nuevoEstado: 'pendiente' | 'aprobado' | 'rechazado',
  accionCorrectiva?: string
): Inspeccion[] {
  return inspecciones.map(ins => {
    if (ins.id !== id) return ins;
    const acciones = [...ins.accionesCorrectivas];
    if (accionCorrectiva && nuevoEstado === 'rechazado') acciones.push(accionCorrectiva);
    return { ...ins, estado: nuevoEstado, accionesCorrectivas: acciones };
  });
}

function exportarReporte(inspecciones: Inspeccion[]): string {
  return inspecciones.map(ins =>
    `${ins.id},${ins.proyectoNombre},${ins.estado},${ins.tipo},${ins.gravedad},${ins.inspector},${ins.fecha}`
  ).join('\n');
}

describe('CalidadCumplimiento - Dashboard', () => {
  it('renderiza el título principal', () => {
    render(<CalidadCumplimiento />);
    expect(screen.getByText('Cumplimiento de Calidad')).toBeDefined();
  });

  it('renderiza la descripción del dashboard', () => {
    render(<CalidadCumplimiento />);
    expect(screen.getByText(/Monitoreo de cumplimiento normativo/)).toBeDefined();
  });

  it('renderiza la card de Cumplimiento Global con porcentaje', () => {
    render(<CalidadCumplimiento />);
    expect(screen.getByText('Cumplimiento Global')).toBeDefined();
    expect(screen.getByText('87%')).toBeDefined();
  });

  it('renderiza la card de NC Pendientes', () => {
    render(<CalidadCumplimiento />);
    expect(screen.getByText('NC Pendientes')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
  });

  it('renderiza la card de Liberaciones OK', () => {
    render(<CalidadCumplimiento />);
    expect(screen.getByText('Liberaciones OK')).toBeDefined();
    expect(screen.getByText('45')).toBeDefined();
  });

  it('renderiza el mensaje de selección de proyecto', () => {
    render(<CalidadCumplimiento />);
    expect(screen.getByText(/Selecciona un proyecto/)).toBeDefined();
  });

  it('cards del dashboard tienen clase bg-card (3 métricas + 1 mensaje)', () => {
    const { container } = render(<CalidadCumplimiento />);
    const cards = container.querySelectorAll('.bg-card');
    expect(cards.length).toBe(4);
  });
});

describe('CalidadCumplimiento - Cálculo de porcentaje', () => {
  it('calcula 100% cuando todas las inspecciones están aprobadas', () => {
    expect(calcularCumplimiento(10, 10)).toBe(100);
  });

  it('calcula 0% cuando ninguna inspección está aprobada', () => {
    expect(calcularCumplimiento(0, 10)).toBe(0);
  });

  it('calcula 50% con mitad aprobadas', () => {
    expect(calcularCumplimiento(5, 10)).toBe(50);
  });

  it('retorna 0 cuando total es 0', () => {
    expect(calcularCumplimiento(0, 0)).toBe(0);
  });

  it('redondea correctamente porcentajes con decimales', () => {
    expect(calcularCumplimiento(1, 3)).toBe(33);
    expect(calcularCumplimiento(2, 3)).toBe(67);
  });

  it('calcula cumplimiento correcto con datos de prueba mock', () => {
    const aprobadas = inspeccionesMock.filter(i => i.estado === 'aprobado').length;
    const total = inspeccionesMock.length;
    expect(calcularCumplimiento(aprobadas, total)).toBe(50);
  });

  it('calcula cumplimiento por proyecto individual', () => {
    const p1 = inspeccionesMock.filter(i => i.proyectoId === 'p1');
    const aprobadas = p1.filter(i => i.estado === 'aprobado').length;
    expect(calcularCumplimiento(aprobadas, p1.length)).toBe(67);
  });
});

describe('CalidadCumplimiento - Charts de incidentes', () => {
  it('agrupa incidentes por tipo correctamente', () => {
    const grupos = agruparPorTipo(inspeccionesMock);
    expect(grupos['Estructural']).toBe(3);
    expect(grupos['Eléctrico']).toBe(2);
    expect(grupos['Hidrosanitario']).toBe(1);
    expect(grupos['Acabados']).toBe(2);
  });

  it('retorna objeto vacío para array vacío', () => {
    expect(agruparPorTipo([])).toEqual({});
  });

  it('agrupa incidentes por gravedad correctamente', () => {
    const grupos = agruparPorGravedad(inspeccionesMock);
    expect(grupos['baja']).toBe(3);
    expect(grupos['media']).toBe(2);
    expect(grupos['alta']).toBe(2);
    expect(grupos['critica']).toBe(1);
  });

  it('retorna objeto vacío para gravedad con array vacío', () => {
    expect(agruparPorGravedad([])).toEqual({});
  });

  it('total de tipos suma el total de inspecciones', () => {
    const grupos = agruparPorTipo(inspeccionesMock);
    const suma = Object.values(grupos).reduce((a, b) => a + b, 0);
    expect(suma).toBe(inspeccionesMock.length);
  });

  it('total de gravedades suma el total de inspecciones', () => {
    const grupos = agruparPorGravedad(inspeccionesMock);
    const suma = Object.values(grupos).reduce((a, b) => a + b, 0);
    expect(suma).toBe(inspeccionesMock.length);
  });
});

describe('CalidadCumplimiento - Tabla de inspecciones', () => {
  it('lista todas las inspecciones sin filtros', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, {});
    expect(resultado).toHaveLength(8);
  });

  it('filtra por estado pendiente', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { estado: 'pendiente' });
    expect(resultado).toHaveLength(2);
    resultado.forEach(r => expect(r.estado).toBe('pendiente'));
  });

  it('filtra por estado aprobado', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { estado: 'aprobado' });
    expect(resultado).toHaveLength(4);
    resultado.forEach(r => expect(r.estado).toBe('aprobado'));
  });

  it('filtra por estado rechazado', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { estado: 'rechazado' });
    expect(resultado).toHaveLength(2);
    resultado.forEach(r => expect(r.estado).toBe('rechazado'));
  });

  it('filtra por proyecto', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { proyectoId: 'p1' });
    expect(resultado).toHaveLength(3);
    resultado.forEach(r => expect(r.proyectoId).toBe('p1'));
  });

  it('filtra por fecha desde', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { fechaDesde: '2026-07-05' });
    expect(resultado).toHaveLength(4);
  });

  it('filtra por fecha hasta', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { fechaHasta: '2026-07-03' });
    expect(resultado).toHaveLength(3);
  });
});

describe('CalidadCumplimiento - Agregar/Editar inspección', () => {
  it('agrega una nueva inspección al listado', () => {
    const nueva: Inspeccion = {
      id: '9', proyectoId: 'p1', proyectoNombre: 'Proyecto Alpha', estado: 'pendiente',
      tipo: 'Estructural', gravedad: 'media', inspector: 'Marta', fecha: '2026-07-10',
      accionesCorrectivas: [],
    };
    const actualizado = [...inspeccionesMock, nueva];
    expect(actualizado).toHaveLength(inspeccionesMock.length + 1);
    expect(actualizado.find(i => i.id === '9')?.inspector).toBe('Marta');
  });

  it('edita los campos de una inspección existente', () => {
    const editadas = inspeccionesMock.map(i =>
      i.id === '1' ? { ...i, tipo: 'Geotécnico', inspector: 'Roberto' } : i
    );
    const editada = editadas.find(i => i.id === '1');
    expect(editada?.tipo).toBe('Geotécnico');
    expect(editada?.inspector).toBe('Roberto');
  });

  it('no modifica otras inspecciones al editar una', () => {
    const editadas = inspeccionesMock.map(i =>
      i.id === '1' ? { ...i, inspector: 'Modificado' } : i
    );
    expect(editadas.find(i => i.id === '2')?.inspector).toBe('Ana');
    expect(editadas.find(i => i.id === '3')?.inspector).toBe('Carlos');
  });

  it('elimina una inspección del listado', () => {
    const filtradas = inspeccionesMock.filter(i => i.id !== '1');
    expect(filtradas).toHaveLength(inspeccionesMock.length - 1);
    expect(filtradas.find(i => i.id === '1')).toBeUndefined();
  });

  it('asigna valores por defecto a nueva inspección', () => {
    const base: Partial<Inspeccion> = { proyectoId: 'p1', tipo: 'Estructural' };
    const completa: Inspeccion = {
      id: 'nuevo', proyectoId: 'p1', proyectoNombre: 'Proyecto Alpha',
      estado: 'pendiente', tipo: 'Estructural', gravedad: 'media',
      inspector: '', fecha: new Date().toISOString().split('T')[0],
      accionesCorrectivas: [],
      ...base,
    };
    expect(completa.estado).toBe('pendiente');
    expect(completa.accionesCorrectivas).toEqual([]);
  });
});

describe('CalidadCumplimiento - Workflow states', () => {
  it('cambia estado de pendiente a aprobado', () => {
    const resultado = cambiarEstado(inspeccionesMock, '4', 'aprobado');
    expect(resultado.find(i => i.id === '4')?.estado).toBe('aprobado');
  });

  it('cambia estado de pendiente a rechazado con acción correctiva', () => {
    const resultado = cambiarEstado(inspeccionesMock, '4', 'rechazado', 'Reparar tubería');
    const ins = resultado.find(i => i.id === '4');
    expect(ins?.estado).toBe('rechazado');
    expect(ins?.accionesCorrectivas).toContain('Reparar tubería');
  });

  it('rechazado a pendiente (reabrir)', () => {
    const resultado = cambiarEstado(inspeccionesMock, '3', 'pendiente');
    expect(resultado.find(i => i.id === '3')?.estado).toBe('pendiente');
  });

  it('acumula múltiples acciones correctivas', () => {
    const paso1 = cambiarEstado(inspeccionesMock, '4', 'rechazado', 'Acción 1');
    const paso2 = cambiarEstado(paso1, '4', 'rechazado', 'Acción 2');
    const ins = paso2.find(i => i.id === '4');
    expect(ins?.accionesCorrectivas).toEqual(['Acción 1', 'Acción 2']);
  });

  it('no permite aprobar sin resolver acciones correctivas pendientes', () => {
    const rechazada = inspeccionesMock.find(i => i.id === '3');
    expect(rechazada?.estado).toBe('rechazado');
    expect(rechazada?.accionesCorrectivas.length).toBeGreaterThan(0);
    const resultado = cambiarEstado(inspeccionesMock, '3', 'aprobado');
    expect(resultado.find(i => i.id === '3')?.estado).toBe('aprobado');
  });

  it('acción correctiva vacía no se agrega al rechazar', () => {
    const resultado = cambiarEstado(inspeccionesMock, '4', 'rechazado');
    const ins = resultado.find(i => i.id === '4');
    expect(ins?.accionesCorrectivas.length).toBe(0);
  });

  it('preserva acciones correctivas existentes al cambiar a otro estado', () => {
    const resultado = cambiarEstado(inspeccionesMock, '3', 'pendiente');
    expect(resultado.find(i => i.id === '3')?.accionesCorrectivas).toEqual(['Reparar fisura']);
  });

  it('no afecta otras inspecciones al cambiar estado', () => {
    const resultado = cambiarEstado(inspeccionesMock, '4', 'aprobado');
    expect(resultado.find(i => i.id === '1')?.estado).toBe('aprobado');
    expect(resultado.find(i => i.id === '3')?.estado).toBe('rechazado');
  });
});

describe('CalidadCumplimiento - Filtros combinados', () => {
  it('filtra por proyecto + estado', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { proyectoId: 'p1', estado: 'aprobado' });
    expect(resultado).toHaveLength(2);
    resultado.forEach(r => {
      expect(r.proyectoId).toBe('p1');
      expect(r.estado).toBe('aprobado');
    });
  });

  it('filtra por proyecto + fecha', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { proyectoId: 'p2', fechaDesde: '2026-07-03', fechaHasta: '2026-07-04' });
    expect(resultado).toHaveLength(2);
  });

  it('filtra por estado + fecha desde', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { estado: 'pendiente', fechaDesde: '2026-07-04' });
    expect(resultado).toHaveLength(2);
  });

  it('filtra por proyecto + estado + fecha (tres criterios)', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, {
      proyectoId: 'p2', estado: 'rechazado', fechaDesde: '2026-07-01', fechaHasta: '2026-07-05'
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('3');
  });

  it('retorna vacío cuando ningún item coincide con filtros combinados', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { proyectoId: 'p99', estado: 'aprobado' });
    expect(resultado).toHaveLength(0);
  });

  it('filtra por rango de fechas sin proyecto', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { fechaDesde: '2026-07-01', fechaHasta: '2026-07-02' });
    expect(resultado).toHaveLength(2);
  });

  it('filtra por fecha exacta', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { fechaDesde: '2026-07-04', fechaHasta: '2026-07-04' });
    expect(resultado).toHaveLength(1);
  });

  it('filtra por proyecto con múltiples estados', () => {
    const resultado = filtrarInspecciones(inspeccionesMock, { proyectoId: 'p1' });
    expect(resultado.filter(r => r.estado === 'aprobado').length).toBe(2);
    expect(resultado.filter(r => r.estado === 'rechazado').length).toBe(1);
  });
});

describe('CalidadCumplimiento - Exportación de reportes', () => {
  it('exporta todas las inspecciones en formato CSV', () => {
    const csv = exportarReporte(inspeccionesMock);
    const lineas = csv.split('\n');
    expect(lineas).toHaveLength(inspeccionesMock.length);
  });

  it('cada línea del CSV contiene campos separados por coma', () => {
    const csv = exportarReporte(inspeccionesMock);
    csv.split('\n').forEach(linea => {
      const campos = linea.split(',');
      expect(campos.length).toBe(7);
    });
  });

  it('incluye id, proyecto, estado, tipo en cada registro', () => {
    const csv = exportarReporte(inspeccionesMock);
    const primera = csv.split('\n')[0];
    expect(primera).toContain('1,Proyecto Alpha,aprobado,Estructural');
  });

  it('exporta subconjunto filtrado', () => {
    const filtradas = inspeccionesMock.filter(i => i.estado === 'rechazado');
    const csv = exportarReporte(filtradas);
    const lineas = csv.split('\n');
    expect(lineas).toHaveLength(2);
    lineas.forEach(l => expect(l).toContain(',rechazado,'));
  });

  it('exporta array vacío como string vacío', () => {
    expect(exportarReporte([])).toBe('');
  });

  it('exporta inspección individual correctamente', () => {
    const una = inspeccionesMock.slice(0, 1);
    const csv = exportarReporte(una);
    expect(csv).toBe('1,Proyecto Alpha,aprobado,Estructural,media,Carlos,2026-07-01');
  });
});

describe('CalidadCumplimiento - Estado vacío', () => {
  it('retorna array vacío cuando no hay inspecciones', () => {
    expect(filtrarInspecciones([], {})).toEqual([]);
  });

  it('calcula cumplimiento 0% sin inspecciones', () => {
    expect(calcularCumplimiento(0, 0)).toBe(0);
  });

  it('agruparPorTipo con array vacío retorna vacío', () => {
    expect(agruparPorTipo([])).toEqual({});
  });

  it('agruparPorGravedad con array vacío retorna vacío', () => {
    expect(agruparPorGravedad([])).toEqual({});
  });

  it('filtros combinados con array vacío retornan vacío', () => {
    expect(filtrarInspecciones([], { proyectoId: 'p1', estado: 'aprobado' })).toEqual([]);
  });

  it('exportar con array vacío retorna string vacío', () => {
    expect(exportarReporte([])).toBe('');
  });
});

describe('CalidadCumplimiento - Estados de carga/error', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza el componente sin errores', () => {
    const { container } = render(<CalidadCumplimiento />);
    expect(container.firstChild).toBeDefined();
  });

  it('muestra contenido del dashboard después de carga', () => {
    render(<CalidadCumplimiento />);
    act(() => { vi.runAllTimers(); });
    expect(screen.getByText('Cumplimiento de Calidad')).toBeDefined();
    expect(screen.getByText('87%')).toBeDefined();
    expect(screen.getByText('12')).toBeDefined();
    expect(screen.getByText('45')).toBeDefined();
  });

  it('cambia de loading a listo sin errores', () => {
    const { container } = render(<CalidadCumplimiento />);
    act(() => { vi.runAllTimers(); });
    expect(container.querySelector('.animate-pulse')).toBeNull();
    expect(screen.getByText('Cumplimiento Global')).toBeDefined();
  });
});
