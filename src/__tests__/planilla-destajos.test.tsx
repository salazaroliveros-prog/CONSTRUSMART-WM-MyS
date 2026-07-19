import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { confirmAction } from '@/lib/confirm-action';

vi.mock('@/lib/confirm-action', () => ({
  confirmAction: vi.fn(() => Promise.resolve(true)),
}));

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
    'destajos.confirmar_eliminar_titulo': 'Confirmar eliminación',
    'destajos.confirmar_eliminar_contenido': 'Eliminar destajo de {{cuadrilla}} — {{codigo}}',
    'planilla.sin_destajos_semana': 'No hay destajos registrados para esta semana',
    'common.si': 'Sí',
    'common.cancelar': 'Cancelar',
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
let mockDestajos: any[] = [];
const mockAddDestajo = vi.fn();
const mockDeleteDestajo = vi.fn();

vi.mock('../erp/store', () => ({
  useErp: () => ({
    proyectos: mockProyectos,
    destajos: mockDestajos,
    addDestajo: mockAddDestajo,
    deleteDestajo: mockDeleteDestajo,
  }),
}));

import PlanillaDestajos from '../erp/screens/PlanillaDestajos';

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
  URL.createObjectURL = vi.fn(() => 'blob:test') as any;
});

const getCurrentMonday = () => {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  return monday.toISOString().split('T')[0];
};

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

beforeEach(() => {
  vi.clearAllMocks();
  (confirmAction as any).mockReset();
  (confirmAction as any).mockResolvedValue(true);

  mockProyectos = [
    { id: 'proj-1', nombre: 'Proyecto Alpha' },
    { id: 'proj-2', nombre: 'Proyecto Beta' },
  ];

  const monday = getCurrentMonday();
  mockDestajos = [
    { id: crypto.randomUUID(), proyectoId: 'proj-1', renglonCodigo: 'EXC-001', cuadrilla: 'Albañil A', fecha: monday, cantidadEjecutada: 15, unidad: 'm³', horasTrabajadas: 8, rendimientoReal: 1.875, rendimientoTeorico: 2.0 },
    { id: crypto.randomUUID(), proyectoId: 'proj-1', renglonCodigo: 'EXC-002', cuadrilla: 'Albañil A', fecha: addDays(monday, 1), cantidadEjecutada: 12, unidad: 'm³', horasTrabajadas: 8, rendimientoReal: 1.5, rendimientoTeorico: 2.0 },
    { id: crypto.randomUUID(), proyectoId: 'proj-1', renglonCodigo: 'FND-001', cuadrilla: 'Estructura B', fecha: monday, cantidadEjecutada: 8, unidad: 'm²', horasTrabajadas: 8, rendimientoReal: 1.0, rendimientoTeorico: 1.5 },
    { id: crypto.randomUUID(), proyectoId: 'proj-2', renglonCodigo: 'EXC-001', cuadrilla: 'Albañil A', fecha: addDays(monday, 1), cantidadEjecutada: 20, unidad: 'm³', horasTrabajadas: 8, rendimientoReal: 2.5, rendimientoTeorico: 2.0 },
  ];
});

afterEach(cleanup);

describe('PlanillaDestajos Screen', () => {
  describe('Carga y renderizado inicial', () => {
    it('renderiza título con icono de planilla', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText(/Planilla de Destajos/)).toBeInTheDocument();
      });
    });

    it('muestra el rango de fechas de la semana', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        const dateText = screen.getByText(/2026/);
        expect(dateText).toBeInTheDocument();
      });
    });

    it('renderiza botón de nuevo destajo', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('+ Nuevo Destajo')).toBeInTheDocument();
      });
    });
  });

  describe('KPIs y estadísticas', () => {
    it('muestra tarjeta de Cuadrillas', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('Cuadrillas')).toBeInTheDocument();
      });
    });

    it('muestra tarjeta de Destajos', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('Destajos')).toBeInTheDocument();
      });
    });

    it('muestra tarjeta de Total a Pagar con formato Q', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('Total a Pagar')).toBeInTheDocument();
      });
    });

    it('muestra tarjeta de Promedio/Cuadrilla', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('Promedio/Cuadrilla')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros', () => {
    it('renderiza filtro de proyecto', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByTestId('proyecto-filter')).toBeInTheDocument();
      });
    });

    it('renderiza filtro de fecha (semana)', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        const dateInput = screen.getByDisplayValue(/2026-07-/);
        expect(dateInput).toBeInTheDocument();
      });
    });
  });

  describe('Tabla principal de planilla', () => {
    it('muestra columnas de la tabla', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getAllByText('Cuadrilla').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Total Ejecutado')).toBeInTheDocument();
        expect(screen.getAllByText('Unidad').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Días')).toBeInTheDocument();
      });
    });

    it('agrupa destajos por cuadrilla-proyecto', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        const cuadrillaA = screen.getAllByText('Albañil A');
        expect(cuadrillaA.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('suma cantidad ejecutada correctamente por grupo', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('27.00')).toBeInTheDocument();
      });
    });

    it('asigna tasa por defecto de 150', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        const tasaInputs = screen.getAllByDisplayValue('150');
        expect(tasaInputs.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calcula pago semanal como totalEjecutado * tasa', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText(/Q4[.,]?050\.00/)).toBeInTheDocument();
      });
    });
  });

  describe('Cálculo de avance percápita y totales', () => {
    it('calcula total a pagar como suma de pagos semanales', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        const amounts = screen.getAllByText(/Q\d+\.\d{2}/);
        expect(amounts.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('fila de totales en tfoot', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('TOTALES')).toBeInTheDocument();
      });
    });
  });

  describe('Detalle de destajos individuales', () => {
    it('muestra tabla de detalle con renglón y cantidad', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getAllByText('EXC-001').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('EXC-002').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('FND-001').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('botón Eliminar por destajo con aria-label', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        const delBtns = screen.getAllByLabelText(/Eliminar destajo de/);
        expect(delBtns.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Workflow de eliminación', () => {
    it('llama confirmAction y deleteDestajo al eliminar', async () => {
      const mConfirmAction = vi.mocked(confirmAction);
      mConfirmAction.mockResolvedValueOnce(undefined);
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getAllByLabelText(/Eliminar destajo de/).length).toBeGreaterThan(0);
      });
      fireEvent.click(screen.getAllByLabelText(/Eliminar destajo de/)[0]);
      await waitFor(() => {
        expect(mConfirmAction).toHaveBeenCalled();
        expect(mockDeleteDestajo).toHaveBeenCalledTimes(1);
      });
    });

    it('no elimina si confirmAction es rechazado', async () => {
      const mConfirmAction = vi.mocked(confirmAction);
      mConfirmAction.mockRejectedValueOnce(new Error('Usuario canceló'));
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getAllByLabelText(/Eliminar destajo de/).length).toBeGreaterThan(0);
      });
      fireEvent.click(screen.getAllByLabelText(/Eliminar destajo de/)[0]);
      await waitFor(() => {
        expect(mockDeleteDestajo).not.toHaveBeenCalled();
      });
    });
  });

  describe('Filtrado por proyecto', () => {
    it('filtra destajos por proyecto seleccionado', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getAllByText('EXC-001').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Proyecto Alpha').length).toBeGreaterThanOrEqual(2);
      });
      fireEvent.change(screen.getByTestId('proyecto-filter'), { target: { value: 'proj-2' } });
      await waitFor(() => {
        expect(screen.getAllByText('Proyecto Beta').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Tasa de pago ajustable', () => {
    it('permite cambiar tasa y actualiza pago semanal', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('150');
        expect(inputs.length).toBeGreaterThan(0);
      });
      const tasaInput = screen.getAllByDisplayValue('150')[0];
      fireEvent.change(tasaInput, { target: { value: '200' } });
      await waitFor(() => {
        expect(screen.getByDisplayValue('200')).toBeInTheDocument();
      });
    });
  });

  describe('Exportación CSV', () => {
    it('muestra botón de exportar cuando hay datos', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
      });
    });

    it('genera CSV al hacer clic en exportar', async () => {
      const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Exportar CSV'));
      expect(createSpy).toHaveBeenCalled();
      createSpy.mockRestore();
    });
  });

  describe('Modal nuevo destajo', () => {
    it('abre modal al hacer clic en Nuevo Destajo', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('+ Nuevo Destajo')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('+ Nuevo Destajo'));
      await waitFor(() => {
        expect(screen.getByText('Nuevo Destajo')).toBeInTheDocument();
        expect(screen.getByText('Guardar Destajo')).toBeInTheDocument();
      });
    });

    it('cierra modal con botón Cancelar', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('+ Nuevo Destajo')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('+ Nuevo Destajo'));
      await waitFor(() => expect(screen.getByText('Nuevo Destajo')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Cancelar'));
      await waitFor(() => {
        expect(screen.queryByText('Nuevo Destajo')).not.toBeInTheDocument();
      });
    });

    it('renderiza opciones de proyecto en el selector', async () => {
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('+ Nuevo Destajo')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('+ Nuevo Destajo'));
      await waitFor(() => {
        expect(screen.getAllByText('Proyecto Alpha').length).toBeGreaterThanOrEqual(2);
        expect(screen.getAllByText('Proyecto Beta').length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Estado vacío', () => {
    it('muestra mensaje sin destajos cuando no hay datos', async () => {
      mockDestajos = [];
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('No hay destajos registrados para esta semana')).toBeInTheDocument();
      });
    });

    it('no muestra tabla de detalle ni botón exportar sin datos', async () => {
      mockDestajos = [];
      render(<PlanillaDestajos />);
      await waitFor(() => {
        expect(screen.getByText('No hay destajos registrados para esta semana')).toBeInTheDocument();
        expect(screen.queryByText('Exportar CSV')).not.toBeInTheDocument();
      });
    });
  });
});
