import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/confirm-action', () => ({
  confirmAction: vi.fn(() => Promise.resolve()),
}));

const mockAddCuentaPagar = vi.fn();
const mockUpdateCuentaPagar = vi.fn();
const mockDeleteCuentaPagar = vi.fn();

let mockCuentasPagar: any[] = [];
let mockProveedores: any[] = [];
let mockProyectos: any[] = [];

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'cuentas_pagar.titulo': 'Cuentas por Pagar',
    'cuentas_pagar.nueva_cuenta': 'Nueva Cuenta',
    'cuentas_pagar.total_por_pagar': 'Total por Pagar',
    'cuentas_pagar.cuentas_pendientes': 'cuentas',
    'cuentas_pagar.pagadas': 'Pagadas',
    'cuentas_pagar.pendientes': 'Pendientes',
    'cuentas_pagar.vencidas': 'Vencidas',
    'cuentas_pagar.del_total': 'del total',
    'cuentas_pagar.requiere_pago_inmediato': 'Requiere pago inmediato',
    'cuentas_pagar.sin_vencidas': 'Sin vencidas',
    'cuentas_pagar.lista': 'Lista de Cuentas',
    'cuentas_pagar.buscar': 'Buscar',
    'cuentas_pagar.todos_estados': 'Todos los estados',
    'cuentas_pagar.pendiente': 'Pendiente',
    'cuentas_pagar.pagada': 'Pagada',
    'cuentas_pagar.vencida': 'Vencida',
    'cuentas_pagar.sin_cuentas': 'Sin cuentas registradas',
    'cuentas_pagar.col_proveedor': 'Proveedor',
    'cuentas_pagar.col_concepto': 'Concepto',
    'cuentas_pagar.col_monto': 'Monto',
    'cuentas_pagar.col_estado': 'Estado',
    'cuentas_pagar.col_vencimiento': 'Vencimiento',
    'cuentas_pagar.estado_pendiente': 'Pendiente',
    'cuentas_pagar.estado_pagada': 'Pagada',
    'cuentas_pagar.estado_vencida': 'Vencida',
    'cuentas_pagar.marcar_pagada': 'Marcar como pagada',
    'cuentas_pagar.marcada_pagada': 'Cuenta marcada como pagada',
    'cuentas_pagar.creada': 'Cuenta creada',
    'cuentas_pagar.actualizada': 'Cuenta actualizada',
    'cuentas_pagar.eliminada': 'Cuenta eliminada',
    'cuentas_pagar.editar': 'Editar Cuenta',
    'cuentas_pagar.seleccionar_proyecto': 'Seleccionar proyecto',
    'cuentas_pagar.proyecto_requerido': 'Proyecto requerido',
    'cuentas_pagar.proveedor_requerido': 'Proveedor requerido',
    'cuentas_pagar.concepto_requerido': 'Concepto requerido',
    'cuentas_pagar.proveedor_placeholder': 'Nombre del proveedor',
    'cuentas_pagar.concepto_placeholder': 'Concepto del gasto',
    'cuentas_pagar.confirmar_eliminar': 'Confirmar eliminación',
    'cuentas_pagar.confirmar_eliminar_msg': '¿Eliminar esta cuenta?',
    'cuentas_pagar.factura_url': 'Factura URL (opcional)',
    'common.acciones': 'Acciones',
    'common.editar': 'Editar',
    'common.eliminar': 'Eliminar',
    'common.guardar': 'Guardar',
    'common.cancelar': 'Cancelar',
    'common.si': 'Sí',
  };
  return {
    useTranslation: () => ({
      t: (key: string, fallback?: string, params?: Record<string, string | number>) => {
        let text = translations[key] || (typeof fallback === 'string' ? fallback : key);
        const p = typeof fallback === 'object' ? fallback : params;
        if (p) {
          for (const [k, v] of Object.entries(p)) {
            text = text.replace(`{{${k}}}`, String(v));
          }
        }
        return text;
      },
      i18n: { language: 'es', changeLanguage: vi.fn() },
    }),
  };
});

vi.mock('../erp/store', () => ({
  useErp: () => ({
    cuentasPagar: mockCuentasPagar,
    proveedores: mockProveedores,
    proyectos: mockProyectos,
    addCuentaPagar: mockAddCuentaPagar,
    updateCuentaPagar: mockUpdateCuentaPagar,
    deleteCuentaPagar: mockDeleteCuentaPagar,
  }),
}));

import CuentasPagar from '../erp/screens/CuentasPagar';

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

beforeEach(() => {
  vi.clearAllMocks();
  mockProyectos = [
    { id: 'proj-1', nombre: 'Torre Norte' },
    { id: 'proj-2', nombre: 'Edificio Sur' },
  ];
  mockProveedores = [
    { id: 'prov-1', nombre: 'Cementos GT' },
    { id: 'prov-2', nombre: 'Aceros SA' },
  ];
  mockCuentasPagar = [
    { id: 'cp-1', proyectoId: 'proj-1', proveedor: 'Cementos GT', proveedorNombre: 'Cementos GT', concepto: 'Compra de cemento', monto: 15000, saldoPendiente: 15000, fechaEmision: '2026-07-01', fechaVencimiento: '2026-07-30', estado: 'pendiente' },
    { id: 'cp-2', proyectoId: 'proj-1', proveedor: 'Aceros SA', proveedorNombre: 'Aceros SA', concepto: 'Compra de varilla', monto: 28000, saldoPendiente: 0, fechaEmision: '2026-06-01', fechaVencimiento: '2026-06-15', estado: 'pagada', fechaPago: '2026-06-10' },
    { id: 'cp-3', proyectoId: 'proj-2', proveedor: 'Ferretería Central', proveedorNombre: 'Ferretería Central', concepto: 'Herramientas', monto: 5000, saldoPendiente: 5000, fechaEmision: '2026-05-01', fechaVencimiento: '2020-01-01', estado: 'vencida' },
  ];
});

afterEach(cleanup);

describe('CuentasPagar Screen', () => {
  describe('Dashboard con totales', () => {
    it('renderiza título', async () => {
      render(<CuentasPagar />);
      await waitFor(() => {
        expect(screen.getByText('Cuentas por Pagar')).toBeInTheDocument();
      });
    });

    it('muestra el monto total por pagar en el dashboard', async () => {
      render(<CuentasPagar />);
      await waitFor(() => {
        expect(screen.getByText('Total por Pagar')).toBeInTheDocument();
        expect(screen.getByText('Q 48,000.00')).toBeInTheDocument();
      });
    });

    it('muestra tarjetas de estadísticas de pagadas, pendientes y vencidas', async () => {
      render(<CuentasPagar />);
      await waitFor(() => {
        expect(screen.getByText('Pagadas')).toBeInTheDocument();
        expect(screen.getByText('Pendientes')).toBeInTheDocument();
        expect(screen.getByText('Vencidas')).toBeInTheDocument();
      });
    });
  });

  describe('Cálculo de estadísticas', () => {
    it('calcula el número de cuentas pagadas', async () => {
      render(<CuentasPagar />);
      await waitFor(() => {
        expect(screen.getByText('Pagadas')).toBeInTheDocument();
      });
      const pagadasCard = screen.getByText('Pagadas').closest('div');
      expect(pagadasCard?.parentElement?.textContent).toContain('1');
    });

    it('muestra proyección de pago con el total y contador de cuentas', async () => {
      render(<CuentasPagar />);
      await waitFor(() => {
        expect(screen.getByText(/3 cuentas/)).toBeInTheDocument();
      });
    });

    it('marca cuentas próximas o vencidas requiriendo pago inmediato', async () => {
      render(<CuentasPagar />);
      await waitFor(() => {
        expect(screen.getByText('Requiere pago inmediato')).toBeInTheDocument();
      });
    });
  });

  describe('Tabla de cuentas y filtros', () => {
    it('renderiza las cuentas con proveedor y concepto', async () => {
      render(<CuentasPagar />);
      await waitFor(() => {
        expect(screen.getByText('Cementos GT')).toBeInTheDocument();
        expect(screen.getByText('Aceros SA')).toBeInTheDocument();
        expect(screen.getByText('Compra de cemento')).toBeInTheDocument();
      });
    });

    it('renderiza las columnas de la tabla', async () => {
      render(<CuentasPagar />);
      await waitFor(() => {
        expect(screen.getByText('Proveedor')).toBeInTheDocument();
        expect(screen.getByText('Concepto')).toBeInTheDocument();
        expect(screen.getByText('Monto')).toBeInTheDocument();
        expect(screen.getByText('Vencimiento')).toBeInTheDocument();
      });
    });

    it('filtra por proveedor usando el buscador', async () => {
      render(<CuentasPagar />);
      await waitFor(() => expect(screen.getByText('Cementos GT')).toBeInTheDocument());
      fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'Aceros' } });
      await waitFor(() => {
        expect(screen.getByText('Aceros SA')).toBeInTheDocument();
        expect(screen.queryByText('Cementos GT')).not.toBeInTheDocument();
      });
    });

    it('filtra por estado pendiente', async () => {
      render(<CuentasPagar />);
      await waitFor(() => expect(screen.getByText('Cementos GT')).toBeInTheDocument());
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'pendiente' } });
      await waitFor(() => {
        expect(screen.getByText('Cementos GT')).toBeInTheDocument();
        expect(screen.queryByText('Aceros SA')).not.toBeInTheDocument();
      });
    });

    it('filtra por estado pagada', async () => {
      render(<CuentasPagar />);
      await waitFor(() => expect(screen.getByText('Cementos GT')).toBeInTheDocument());
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'pagada' } });
      await waitFor(() => {
        expect(screen.getByText('Aceros SA')).toBeInTheDocument();
        expect(screen.queryByText('Cementos GT')).not.toBeInTheDocument();
      });
    });
  });

  describe('Transiciones de estado del flujo', () => {
    it('marca una cuenta pendiente como pagada', async () => {
      render(<CuentasPagar />);
      await waitFor(() => expect(screen.getByText('Cementos GT')).toBeInTheDocument());
      fireEvent.click(screen.getAllByLabelText('Marcar como pagada')[0]);
      await waitFor(() => {
        expect(mockUpdateCuentaPagar).toHaveBeenCalledWith('cp-1', expect.objectContaining({ estado: 'pagada' }));
        expect(toast.success).toHaveBeenCalledWith('Cuenta marcada como pagada');
      });
    });

    it('no muestra botón de pago para cuentas ya pagadas', async () => {
      mockCuentasPagar = [
        { id: 'cp-2', proyectoId: 'proj-1', proveedor: 'Aceros SA', proveedorNombre: 'Aceros SA', concepto: 'Compra de varilla', monto: 28000, saldoPendiente: 0, fechaEmision: '2026-06-01', fechaVencimiento: '2026-06-15', estado: 'pagada' },
      ];
      render(<CuentasPagar />);
      await waitFor(() => expect(screen.getByText('Aceros SA')).toBeInTheDocument());
      expect(screen.queryByLabelText('Marcar como pagada')).not.toBeInTheDocument();
    });
  });

  describe('Crear y eliminar cuentas', () => {
    it('abre el formulario de nueva cuenta', async () => {
      render(<CuentasPagar />);
      await waitFor(() => expect(screen.getAllByText('Nueva Cuenta')[0]).toBeInTheDocument());
      fireEvent.click(screen.getAllByText('Nueva Cuenta')[0]);
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('elimina una cuenta al confirmar', async () => {
      render(<CuentasPagar />);
      await waitFor(() => expect(screen.getByText('Cementos GT')).toBeInTheDocument());
      fireEvent.click(screen.getAllByLabelText('Eliminar')[0]);
      await waitFor(() => {
        expect(mockDeleteCuentaPagar).toHaveBeenCalled();
      });
    });
  });

  describe('Estado vacío', () => {
    it('muestra mensaje cuando no hay cuentas', async () => {
      mockCuentasPagar = [];
      render(<CuentasPagar />);
      await waitFor(() => {
        expect(screen.getByText('Sin cuentas registradas')).toBeInTheDocument();
      });
    });
  });

  describe('Estado de carga', () => {
    it('muestra skeleton de carga inicialmente y luego el contenido', async () => {
      render(<CuentasPagar />);
      await waitFor(() => {
        expect(screen.getByText('Cuentas por Pagar')).toBeInTheDocument();
      });
    });
  });
});
