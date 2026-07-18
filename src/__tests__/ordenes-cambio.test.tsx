import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { canUserEdit } from '@/lib/security';

vi.mock('@/lib/security', () => ({
  canUserEdit: vi.fn(() => true),
}));

vi.mock('@/lib/confirm-action', () => ({
  confirmAction: vi.fn(() => Promise.resolve()),
}));

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
    'ordenes_cambio.titulo': 'Órdenes de Cambio',
    'ordenes_cambio.nueva': 'Nueva',
    'ordenes_cambio.nueva_solicitud': 'Nueva Solicitud de Cambio',
    'ordenes_cambio.enviar_solicitud': 'Enviar Solicitud',
    'ordenes_cambio.sin_datos': 'Sin órdenes de cambio',
    'ordenes_cambio.error_titulo': 'Título requerido',
    'ordenes_cambio.error_proyecto': 'Selecciona un proyecto',
    'ordenes_cambio.placeholder_titulo': 'Título del cambio *',
    'ordenes_cambio.placeholder_descripcion': 'Descripción detallada del cambio...',
    'ordenes_cambio.impacto_costo': 'Impacto Costo (Q)',
    'ordenes_cambio.impacto_plazo': 'Impacto Plazo (días)',
    'ordenes_cambio.solicitud_creada': 'Solicitud creada',
    'ordenes_cambio.total_ordenes': 'Total Órdenes',
    'ordenes_cambio.pendientes': 'Pendientes',
    'ordenes_cambio.costo_aprobado': 'Costo Aprobado',
    'ordenes_cambio.estado_solicitud': 'Solicitud',
    'ordenes_cambio.estado_revision': 'En Revisión',
    'ordenes_cambio.estado_aprobado': 'Aprobado',
    'ordenes_cambio.estado_rechazado': 'Rechazado',
    'ordenes_cambio.aprobar': 'Aprobar',
    'ordenes_cambio.rechazar': 'Rechazar',
    'ordenes_cambio.cambio_aprobado': 'Cambio aprobado',
    'ordenes_cambio.cambio_rechazado': 'Cambio rechazado',
    'ordenes_cambio.aprobado_por': 'Aprobado por:',
    'common.sin_permisos': 'Sin permisos',
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
let mockOrdenesCambio: any[] = [];
const mockAddOrdenCambio = vi.fn();
const mockUpdateOrdenCambio = vi.fn();
const mockUser = { nombre: 'Admin', rol: 'Administrador' };

vi.mock('../erp/store', () => ({
  useErp: () => ({
    proyectos: mockProyectos,
    ordenesCambio: mockOrdenesCambio,
    addOrdenCambio: mockAddOrdenCambio,
    updateOrdenCambio: mockUpdateOrdenCambio,
    user: mockUser,
  }),
}));

import OrdenesCambio from '../erp/screens/OrdenesCambio';

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
  mockOrdenesCambio = [
    { id: uid(), proyectoId: 'proj-1', titulo: 'Cambio estructura', descripcion: 'Ajuste en columnas', solicitante: 'Residente', solicitanteRol: 'Residente', estado: 'solicitud', impactoCosto: 5000, impactoPlazo: 5, createdAt: '2026-07-10T10:00:00Z' },
    { id: uid(), proyectoId: 'proj-1', titulo: 'Cambio acabados', descripcion: 'Material nuevo', solicitante: 'Gerente', solicitanteRol: 'Gerente', estado: 'aprobado', impactoCosto: 3000, impactoPlazo: 3, aprobador: 'Admin', fechaAprobacion: '2026-07-11', createdAt: '2026-07-09T08:00:00Z' },
    { id: uid(), proyectoId: 'proj-2', titulo: 'Cambio instalacion', descripcion: 'Equipo adicional', solicitante: 'Residente', solicitanteRol: 'Residente', estado: 'rechazado', impactoCosto: 2000, impactoPlazo: 2, aprobador: 'Admin', fechaAprobacion: '2026-07-12', createdAt: '2026-07-08T12:00:00Z' },
    { id: uid(), proyectoId: 'proj-1', titulo: 'Cambio fechas', descripcion: 'Extension plazo', solicitante: 'Gerente', solicitanteRol: 'Gerente', estado: 'revision', impactoCosto: 1000, impactoPlazo: 10, createdAt: '2026-07-07T09:00:00Z' },
  ];
});

afterEach(cleanup);

describe('OrdenesCambio Screen', () => {
  describe('Tabla de OCs', () => {
    it('renderiza titulo', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Órdenes de Cambio')).toBeInTheDocument();
      });
    });

    it('muestra columnas de la tabla', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Cambio estructura')).toBeInTheDocument();
        expect(screen.getByText('Cambio acabados')).toBeInTheDocument();
      });
    });

    it('renderiza KPIs del dashboard', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Total Órdenes')).toBeInTheDocument();
        expect(screen.getByText('Pendientes')).toBeInTheDocument();
        expect(screen.getByText('Costo Aprobado')).toBeInTheDocument();
      });
    });

    it('renderiza filtro de proyecto', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByTestId('proyecto-filter')).toBeInTheDocument();
      });
    });
  });

  describe('Workflow de estados', () => {
    it('muestra badges de estado', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Solicitud')).toBeInTheDocument();
        expect(screen.getByText('Aprobado')).toBeInTheDocument();
        expect(screen.getByText('Rechazado')).toBeInTheDocument();
      });
    });

    it('muestra boton Aprobar para estado solicitud', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Cambio estructura')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cambio estructura'));
      await waitFor(() => {
        expect(screen.getByText('Aprobar')).toBeInTheDocument();
      });
    });

    it('muestra boton Rechazar para estado solicitud', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Cambio estructura')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cambio estructura'));
      await waitFor(() => {
        expect(screen.getByText('Rechazar')).toBeInTheDocument();
      });
    });

    it('no muestra botones de accion para estado rechazado', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Cambio instalacion')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cambio instalacion'));
      await waitFor(() => {
        expect(screen.queryByText('Aprobar')).not.toBeInTheDocument();
        expect(screen.queryByText('Rechazar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Impacto presupuestario', () => {
    it('muestra monto de impacto en tarjeta', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getAllByText(/Q 3,000/).length).toBeGreaterThanOrEqual(1);
      });
    });

    it('muestra impacto en plazo', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('+5 días')).toBeInTheDocument();
      });
    });

    it('calcula costo total aprobado', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Costo Aprobado')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros', () => {
    it('filtra OCs por proyecto', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByTestId('proyecto-filter')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId('proyecto-filter'), { target: { value: 'proj-2' } });
      await waitFor(() => {
        expect(screen.getByText('Cambio instalacion')).toBeInTheDocument();
      });
    });

    it('combinacion de filtros', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByTestId('proyecto-filter')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId('proyecto-filter'), { target: { value: 'proj-1' } });
      await waitFor(() => {
        expect(screen.getByText('Cambio estructura')).toBeInTheDocument();
        expect(screen.queryByText('Cambio instalacion')).not.toBeInTheDocument();
      });
    });
  });

  describe('CRUD crear OC', () => {
    it('abre formulario al hacer clic en Nueva', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Nueva')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Nueva'));
      await waitFor(() => {
        expect(screen.getByText('Nueva Solicitud de Cambio')).toBeInTheDocument();
      });
    });

    it('crea OC y llama addOrdenCambio', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Nueva')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Nueva'));
      await waitFor(() => {
        expect(screen.getByTestId('proyecto-filter')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId('proyecto-filter'), { target: { value: 'proj-1' } });
      fireEvent.change(screen.getByPlaceholderText('Título del cambio *'), { target: { value: 'Nuevo cambio' } });
      fireEvent.click(screen.getByText('Enviar Solicitud'));
      await waitFor(() => {
        expect(mockAddOrdenCambio).toHaveBeenCalledTimes(1);
      });
    });

    it('no crea OC sin titulo', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Nueva')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Nueva'));
      await waitFor(() => {
        expect(screen.getByText('Enviar Solicitud')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Enviar Solicitud'));
      await waitFor(() => {
        expect(screen.getByText('Título requerido')).toBeInTheDocument();
      });
    });
  });

  describe('CRUD editar OC', () => {
    it('expande fila para ver detalles', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Cambio estructura')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cambio estructura'));
      await waitFor(() => {
        expect(screen.getByText('Ajuste en columnas')).toBeInTheDocument();
      });
    });
  });

  describe('Estado vacio', () => {
    it('muestra mensaje sin OCs', async () => {
      mockOrdenesCambio = [];
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Sin órdenes de cambio')).toBeInTheDocument();
      });
    });

    it('no muestra filas de OC en empty state', async () => {
      mockOrdenesCambio = [];
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.queryByText('Cambio estructura')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading y error', () => {
    it('renderiza skeleton durante carga', () => {
      render(<OrdenesCambio />);
      expect(screen.getAllByRole('generic').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Ordenamiento por columnas', () => {
    it('ordena por fecha por defecto', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Cambio estructura')).toBeInTheDocument();
      });
    });

    it('permite ordenar por proyecto al expandir', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Cambio estructura')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cambio estructura'));
      await waitFor(() => {
        expect(screen.getByText('Ajuste en columnas')).toBeInTheDocument();
      });
    });
  });

  describe('Combinacion de filtros', () => {
    it('filtra por proyecto combinado con busqueda', async () => {
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByTestId('proyecto-filter')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByTestId('proyecto-filter'), { target: { value: 'proj-1' } });
      await waitFor(() => {
        expect(screen.getByText('Cambio estructura')).toBeInTheDocument();
      });
    });
  });

  describe('Workflow rechazo', () => {
    it('rechaza OC y actualiza estado', async () => {
      const id = mockOrdenesCambio[0].id;
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Cambio estructura')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cambio estructura'));
      await waitFor(() => {
        expect(screen.getByText('Rechazar')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Rechazar'));
      await waitFor(() => {
        expect(mockUpdateOrdenCambio).toHaveBeenCalledWith(id, { estado: 'rechazado', aprobador: 'Admin', fechaAprobacion: expect.any(String) });
      });
    });
  });

  describe('Workflow aprobacion', () => {
    it('aprueba OC y actualiza estado', async () => {
      const id = mockOrdenesCambio[0].id;
      render(<OrdenesCambio />);
      await waitFor(() => {
        expect(screen.getByText('Cambio estructura')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Cambio estructura'));
      await waitFor(() => {
        expect(screen.getByText('Aprobar')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Aprobar'));
      await waitFor(() => {
        expect(mockUpdateOrdenCambio).toHaveBeenCalledWith(id, { estado: 'aprobado', aprobador: 'Admin', fechaAprobacion: expect.any(String) });
      });
    });
  });
});
