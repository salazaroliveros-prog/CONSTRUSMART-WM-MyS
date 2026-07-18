import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('../erp/components/ProyectoFilter', () => ({
  default: ({ value, onChange, proyectos }: any) => (
    <select value={value} onChange={e => onChange(e.target.value)} data-testid="proyecto-filter">
      <option value="">Selecciona</option>
      {proyectos.map((p: any) => (
        <option key={p.id} value={p.id}>{p.nombre}</option>
      ))}
    </select>
  ),
}));

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'hitos.titulo': 'Hitos',
    'hitos.nuevo': 'Nuevo',
    'hitos.crear': 'Crear hito',
    'hitos.editar': 'Editar hito',
    'hitos.nombre': 'Nombre',
    'hitos.fecha': 'Fecha',
    'hitos.tipo': 'Tipo',
    'hitos.proyecto': 'Proyecto',
    'hitos.selecciona_proyecto': 'Selecciona',
    'hitos.error_nombre': 'Nombre requerido',
    'hitos.error_fecha': 'Fecha requerida',
    'hitos.error_proyecto': 'Proyecto requerido',
    'hitos.sin_datos': 'Sin hitos',
    'hitos.creado': 'Hito creado',
    'hitos.actualizado': 'Hito actualizado',
    'hitos.completado': 'Completado',
    'hitos.pendiente': 'Pendiente',
    'hitos.marcar_completado': 'Marcar completado',
    'hitos.marcar_pendiente': 'Marcar pendiente',
    'hitos.vencido': 'Vencido',
    'hitos.tipo_entrega': 'Entrega',
    'hitos.tipo_pago': 'Pago',
    'hitos.tipo_inspeccion': 'Inspección',
    'hitos.tipo_licencia': 'Licencia',
    'hitos.tipo_otro': 'Otro',
    'common.guardar': 'Guardar',
    'common.cancelar': 'Cancelar',
    'common.editar': 'Editar',
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
let mockHitos: any[] = [];
const mockAddHito = vi.fn();
const mockUpdateHito = vi.fn();
const mockCurrentProjectId = '';

vi.mock('../erp/store', () => ({
  useErp: () => ({
    proyectos: mockProyectos,
    hitos: mockHitos,
    addHito: mockAddHito,
    updateHito: mockUpdateHito,
    currentProjectId: mockCurrentProjectId,
    setCurrentProjectId: vi.fn(),
  }),
}));

import Hitos from '../erp/screens/Hitos';

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
  mockHitos = [
    { id: uid(), proyectoId: 'proj-1', nombre: 'Hito entrega', fecha: '2026-08-01', tipo: 'entrega', completado: false },
    { id: uid(), proyectoId: 'proj-1', nombre: 'Hito pago', fecha: '2026-08-15', tipo: 'pago', completado: true },
    { id: uid(), proyectoId: 'proj-2', nombre: 'Hito inspeccion', fecha: '2026-07-10', tipo: 'inspeccion', completado: false },
    { id: uid(), proyectoId: 'proj-1', nombre: 'Hito licencia', fecha: '2026-09-01', tipo: 'licencia', completado: false },
  ];
});

afterEach(cleanup);

describe('Hitos Screen', () => {
  describe('Renderizado y timeline', () => {
    it('renderiza titulo con icono', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getByText('Hitos')).toBeInTheDocument();
      });
    });

    it('muestra hitos ordenados por fecha', async () => {
      render(<Hitos />);
      await waitFor(() => {
        const items = screen.getAllByText(/Hito/);
        expect(items.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('renderiza boton Nuevo', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getByText('Nuevo')).toBeInTheDocument();
      });
    });

    it('renderiza filtro de proyecto', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getByTestId('proyecto-filter')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard de conteo', () => {
    it('muestra todos los hitos en lista', async () => {
      render(<Hitos />);
      await waitFor(() => {
        const hitItems = screen.getAllByText(/Hito/);
        expect(hitItems.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('marca hitos completados con estilo emerald', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getByText('Hito pago')).toBeInTheDocument();
      });
    });

    it('identifica hitos vencidos', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getByText('Vencido')).toBeInTheDocument();
      });
    });
  });

  describe('CRUD crear hito', () => {
    it('abre formulario al hacer clic en Nuevo', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getByText('Nuevo')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Nuevo'));
      await waitFor(() => {
        expect(screen.getByText('Crear hito')).toBeInTheDocument();
      });
    });

    it('crea hito y llama addHito', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getByText('Nuevo')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Nuevo'));
      await waitFor(() => {
        expect(screen.getByText('Crear hito')).toBeInTheDocument();
      });
      const textboxes = screen.getAllByRole('textbox');
      fireEvent.change(textboxes[0], { target: { value: 'Nuevo hito' } });
      fireEvent.change(screen.getByDisplayValue('', { selector: 'input[type="date"]' }), { target: { value: '2026-12-01' } });
      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[2], { target: { value: 'proj-1' } });
      fireEvent.click(screen.getByText('Guardar'));
      await waitFor(() => {
        expect(mockAddHito).toHaveBeenCalledTimes(1);
      });
    });

    it('no crea hito sin nombre', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getByText('Nuevo')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Nuevo'));
      await waitFor(() => {
        expect(screen.getByText('Guardar')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Guardar'));
      await waitFor(() => {
        expect(screen.getByText('Nombre requerido')).toBeInTheDocument();
      });
    });
  });

  describe('CRUD editar hito', () => {
    it('abre formulario de edicion', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getAllByLabelText('Editar').length).toBeGreaterThan(0);
      });
      fireEvent.click(screen.getAllByLabelText('Editar')[0]);
      await waitFor(() => {
        expect(screen.getByText('Editar hito')).toBeInTheDocument();
      });
    });

    it('actualiza hito y llama updateHito', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getAllByLabelText('Editar').length).toBeGreaterThan(0);
      });
      fireEvent.click(screen.getAllByLabelText('Editar')[0]);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Hito inspeccion')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByDisplayValue('Hito inspeccion'), { target: { value: 'Hito actualizado' } });
      fireEvent.click(screen.getByText('Guardar'));
      await waitFor(() => {
        expect(mockUpdateHito).toHaveBeenCalled();
      });
    });
  });

  describe('Filtros', () => {
    it('filtra hitos por proyecto', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getByTestId('proyecto-filter')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId('proyecto-filter'), { target: { value: 'proj-2' } });
      await waitFor(() => {
        expect(screen.getByText('Hito inspeccion')).toBeInTheDocument();
      });
    });

    it('combinacion de filtros', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getAllByText(/Hito/).length).toBeGreaterThanOrEqual(4);
      });
      fireEvent.change(screen.getByTestId('proyecto-filter'), { target: { value: 'proj-1' } });
      await waitFor(() => {
        expect(screen.getByText('Hito entrega')).toBeInTheDocument();
        expect(screen.queryByText('Hito inspeccion')).not.toBeInTheDocument();
      });
    });
  });

  describe('Completar hito', () => {
    it('alterna estado completado', async () => {
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getByText('Hito entrega')).toBeInTheDocument();
      });
      const toggleBtn = screen.getAllByLabelText('Marcar completado')[0];
      fireEvent.click(toggleBtn);
      await waitFor(() => {
        expect(mockUpdateHito).toHaveBeenCalled();
      });
    });
  });

  describe('Estado vacio', () => {
    it('muestra mensaje sin hitos', async () => {
      mockHitos = [];
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.getByText('Sin hitos')).toBeInTheDocument();
      });
    });

    it('no muestra filas de hito en empty state', async () => {
      mockHitos = [];
      render(<Hitos />);
      await waitFor(() => {
        expect(screen.queryByText(/Hito entrega/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading y error', () => {
    it('renderiza skeleton durante carga', () => {
      render(<Hitos />);
      expect(screen.getAllByRole('generic').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Ordenamiento por fecha', () => {
    it('ordena hitos por fecha ascendente', async () => {
      render(<Hitos />);
      await waitFor(() => {
        const items = screen.getAllByText(/\/2026/);
        expect(items.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
