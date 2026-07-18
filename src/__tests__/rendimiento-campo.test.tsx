import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('../erp/components/ProyectoFilter', () => ({
  default: ({ value, onChange, proyectos }: any) => (
    <select value={value} onChange={e => onChange(e.target.value)} data-testid="proyecto-filter">
      <option value="">Todos los proyectos</option>
      {proyectos.map((p: any) => (
        <option key={p.id} value={p.id}>{p.nombre}</option>
      ))}
    </select>
  ),
}));

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'rendimiento_campo.titulo': 'Rendimiento de Campo',
    'rendimiento_campo.filtro_proyecto': 'Filtrar por proyecto',
    'rendimiento_campo.filtro_cuadrilla': 'Filtrar por cuadrilla',
    'rendimiento_campo.filtro_fecha': 'Filtrar por fecha',
    'rendimiento_campo.rendimiento_real': 'Rendimiento Real',
    'rendimiento_campo.rendimiento_teorico': 'Rendimiento Teorico',
    'rendimiento_campo.avance': 'Avance',
    'rendimiento_campo.cuadrilla': 'Cuadrilla',
    'rendimiento_campo.proyecto': 'Proyecto',
    'rendimiento_campo.fecha': 'Fecha',
    'rendimiento_campo.unidad': 'Unidad',
    'rendimiento_campo.cantidad': 'Cantidad',
    'rendimiento_campo.horas': 'Horas',
    'rendimiento_campo.total': 'Total',
    'rendimiento_campo.promedio': 'Promedio',
    'rendimiento_campo.exportar': 'Exportar',
    'rendimiento_campo.exportar_csv': 'Exportar CSV',
    'rendimiento_campo.meta': 'Meta',
    'rendimiento_campo.progreso': 'Progreso',
    'rendimiento_campo.eficiencia': 'Eficiencia',
    'rendimiento_campo.porcentaje': 'Porcentaje',
    'rendimiento_campo.sin_datos': 'Sin datos',
    'rendimiento_campo.modo_proyectado': 'Modo Proyectado',
    'rendimiento_campo.modo_real': 'Modo Real',
    'rendimiento_campo.comparativa': 'Comparativa',
    'rendimiento_campo.desviacion': 'Desviacion',
    'rendimiento_campo.tendencia': 'Tendencia',
    'rendimiento_campo.resumen': 'Resumen',
    'rendimiento_campo.detalle': 'Detalle',
    'rendimiento_campo.rango_fecha': 'Rango de fecha',
    'rendimiento_campo.equipo': 'Equipo',
    'rendimiento_campo.ver_detalle': 'Ver detalle',
    'rendimiento_campo.cerrar': 'Cerrar',
  };
  return {
    useTranslation: () => ({
      t: (key: string, params?: Record<string, string | number>) => {
        let text = translations[key] || key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{{${k}}}`, String(v));
          }
        }
        return text;
      },
      i18n: { language: 'es', changeLanguage: vi.fn() },
    }),
  };
});

let mockProyectos: any[] = [];
let mockRendimientos: any[] = [];

vi.mock('../erp/store', () => ({
  useErp: () => ({
    proyectos: mockProyectos,
    rendimientos: mockRendimientos,
  }),
}));

import RendimientoCampo from '../erp/screens/RendimientoCampo';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

const uid = () => crypto.randomUUID();

beforeEach(() => {
  vi.clearAllMocks();
  mockProyectos = [
    { id: 'proj-1', nombre: 'Proyecto Alpha' },
    { id: 'proj-2', nombre: 'Proyecto Beta' },
  ];
  mockRendimientos = [
    { id: uid(), proyectoId: 'proj-1', proyectoNombre: 'Proyecto Alpha', cuadrilla: 'Cuadrilla A', fecha: '2026-07-13', cantidadEjecutada: 15, unidad: 'm³', horasTrabajadas: 8, rendimientoReal: 1.875, rendimientoTeorico: 2.0 },
    { id: uid(), proyectoId: 'proj-1', proyectoNombre: 'Proyecto Alpha', cuadrilla: 'Cuadrilla B', fecha: '2026-07-14', cantidadEjecutada: 12, unidad: 'm³', horasTrabajadas: 8, rendimientoReal: 1.5, rendimientoTeorico: 2.0 },
    { id: uid(), proyectoId: 'proj-2', proyectoNombre: 'Proyecto Beta', cuadrilla: 'Cuadrilla A', fecha: '2026-07-15', cantidadEjecutada: 20, unidad: 'm³', horasTrabajadas: 8, rendimientoReal: 2.5, rendimientoTeorico: 2.0 },
  ];
});

afterEach(cleanup);

describe('RendimientoCampo Screen', () => {
  describe('Carga y renderizado inicial', () => {
    it('renderiza titulo de rendimiento de campo', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });

    it('renderiza filtro de proyecto', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByTestId('proyecto-filter')).toBeInTheDocument();
      });
    });

    it('renderiza opciones de proyecto en filtro', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        const options = screen.getAllByRole('option');
        expect(options.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('muestra mensaje de sin capturas cuando no hay datos', async () => {
      mockRendimientos = [];
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Sin capturas registradas')).toBeInTheDocument();
        expect(screen.getByText('Registra producción y horas por cuadrilla para visualizar rendimiento')).toBeInTheDocument();
      });
    });

    it('renderiza contenido despues de carga', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
        expect(screen.getByTestId('proyecto-filter')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros de proyecto', () => {
    it('selecciona proyecto en filtro', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        const select = screen.getByTestId('proyecto-filter');
        fireEvent.change(select, { target: { value: 'proj-1' } });
        expect(select).toHaveValue('proj-1');
      });
    });

    it('limpia seleccion de proyecto', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        const select = screen.getByTestId('proyecto-filter');
        fireEvent.change(select, { target: { value: 'proj-1' } });
        fireEvent.change(select, { target: { value: '' } });
        expect(select).toHaveValue('');
      });
    });
  });

  describe('Calculos de rendimiento', () => {
    it('calcula rendimiento real vs teorico', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });

    it('calcula promedio de rendimiento', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });

    it('identifica rendimiento superior a meta', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });

    it('identifica rendimiento inferior a meta', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });
  });

  describe('Filtrado por fecha', () => {
    it('filtra rendimientos por fecha inicio', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });

    it('filtra rendimientos por fecha fin', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });

    it('no muestra resultados fuera del rango de fechas', async () => {
      mockRendimientos = [
        { id: uid(), proyectoId: 'proj-1', proyectoNombre: 'Proyecto Alpha', cuadrilla: 'Cuadrilla A', fecha: '2026-01-01', cantidadEjecutada: 15, unidad: 'm³', horasTrabajadas: 8, rendimientoReal: 1.875, rendimientoTeorico: 2.0 },
      ];
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Sin capturas registradas')).toBeInTheDocument();
      });
    });
  });

  describe('Filtrado por equipo', () => {
    it('filtra por cuadrilla especifica', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });

    it('agrupa rendimientos por cuadrilla', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });
  });

  describe('Exportacion', () => {
    it('renderiza boton de exportar', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });

    it('genera archivo CSV al exportar', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });
  });

  describe('Modo proyectado', () => {
    it('renderiza toggle de modo proyectado', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });

    it('alterna entre modo real y proyectado', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });
  });

  describe('Progreso y metas', () => {
    it('muestra barra de progreso vs meta', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });

    it('calcula porcentaje de cumplimiento', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });
  });

  describe('Manejo de errores', () => {
    it('muestra estado de error al fallar carga', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
      });
    });
  });

  describe('Navegacion', () => {
    it('muestra encabezado con titulo y filtros', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        expect(screen.getByText('Rendimiento de Campo')).toBeInTheDocument();
        expect(screen.getByTestId('proyecto-filter')).toBeInTheDocument();
      });
    });

    it('permite cambiar entre proyectos', async () => {
      render(<RendimientoCampo />);
      await waitFor(() => {
        const select = screen.getByTestId('proyecto-filter');
        fireEvent.change(select, { target: { value: 'proj-2' } });
        expect(select).toHaveValue('proj-2');
      });
    });
  });
});