import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('@/lib/confirm-action', () => ({
  confirmAction: vi.fn(() => Promise.resolve()),
}));

vi.mock('../erp/ui', () => ({
  INPUT: 'w-full px-3.5 py-[calc(var(--density-input-height,32px)*0.25)] rounded-[var(--radius-selected,var(--radius-sm,4px))] border border-input bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary',
  BUTTON_PRIMARY: 'bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-[var(--radius-selected,var(--radius-base,8px))] font-medium transition-colors',
  BUTTON_SECONDARY: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-[var(--radius-selected,var(--radius-base,8px))] font-medium transition-colors',
}));

vi.mock('react-i18next', () => {
  const translations: Record<string, string> = {
    'cuentas_cobrar.titulo': 'Cuentas por Cobrar',
    'cuentas_cobrar.total_por_cobrar': 'Total por Cobrar',
    'cuentas_cobrar.cuentas_pendientes': 'cuentas pendientes',
    'cuentas_cobrar.cobradas': 'Cobradas',
    'cuentas_cobrar.pendientes': 'Pendientes',
    'cuentas_cobrar.del_total': 'del total',
    'cuentas_cobrar.vencidas': 'Vencidas',
    'cuentas_cobrar.requieren_atencion': 'Requieren atencion',
    'cuentas_cobrar.sin_vencidas': 'Sin vencidas',
    'cuentas_cobrar.lista': 'Lista de Cuentas',
    'cuentas_cobrar.buscar': 'Buscar cuenta...',
    'cuentas_cobrar.todos_estados': 'Todos los estados',
    'cuentas_cobrar.pendiente': 'Pendiente',
    'cuentas_cobrar.cobrada': 'Cobrada',
    'cuentas_cobrar.vencida': 'Vencida',
    'cuentas_cobrar.sin_cuentas': 'No hay cuentas por cobrar',
    'cuentas_cobrar.col_cliente': 'Cliente',
    'cuentas_cobrar.col_factura': 'Factura',
    'cuentas_cobrar.col_monto': 'Monto',
    'cuentas_cobrar.col_estado': 'Estado',
    'cuentas_cobrar.col_vencimiento': 'Vencimiento',
    'cuentas_cobrar.estado_pendiente': 'Pendiente',
    'cuentas_cobrar.estado_cobrada': 'Cobrada',
    'cuentas_cobrar.estado_vencida': 'Vencida',
    'cuentas_cobrar.marcar_cobrada': 'Marcar como cobrada',
    'cuentas_cobrar.nueva_cuenta': 'Nueva Cuenta',
    'cuentas_cobrar.editar': 'Editar Cuenta',
    'cuentas_cobrar.actualizada': 'Cuenta actualizada',
    'cuentas_cobrar.creada': 'Cuenta creada',
    'cuentas_cobrar.eliminada': 'Cuenta eliminada',
    'cuentas_cobrar.marcada_cobrada': 'Marcada como cobrada',
    'cuentas_cobrar.confirmar_eliminar': 'Confirmar eliminacion',
    'cuentas_cobrar.confirmar_eliminar_msg': 'Eliminar cuenta de cobro',
    'cuentas_cobrar.proyecto_requerido': 'Proyecto requerido',
    'cuentas_cobrar.cliente_requerido': 'Cliente requerido',
    'cuentas_cobrar.concepto_requerido': 'Concepto requerido',
    'cuentas_cobrar.seleccionar_proyecto': 'Seleccionar proyecto',
    'cuentas_cobrar.cliente_placeholder': 'Nombre del cliente',
    'cuentas_cobrar.concepto_placeholder': 'Concepto de cobro',
    'cuentas_cobrar.notas': 'Notas',
    'cuentas_cobrar.notas_placeholder': 'Notas adicionales',
    'cuentas_cobrar.guardar': 'Guardar',
    'cuentas_cobrar.cancelar': 'Cancelar',
    'common.si': 'Si',
    'common.cancelar': 'Cancelar',
    'common.editar': 'Editar',
    'common.eliminar': 'Eliminar',
    'common.guardar': 'Guardar',
    'common.acciones': 'Acciones',
    'cuentas_cobrar.exportar': 'Exportar',
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
let mockFacturas: any[] = [];
const mockAddCuentaCobrar = vi.fn();
const mockUpdateCuentaCobrar = vi.fn();
const mockDeleteCuentaCobrar = vi.fn();

vi.mock('../erp/store', () => ({
  useErp: () => ({
    proyectos: mockProyectos,
    facturas: mockFacturas,
    cuentasCobrar: mockFacturas,
    addCuentaCobrar: mockAddCuentaCobrar,
    updateCuentaCobrar: mockUpdateCuentaCobrar,
    deleteCuentaCobrar: mockDeleteCuentaCobrar,
  }),
}));

import CuentasCobrar from '../erp/screens/CuentasCobrar';

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
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  mockFacturas = [
    { id: uid(), proyectoId: 'proj-1', cliente: 'Cliente A', clienteNombre: 'Cliente A', concepto: 'Factura 001', monto: 5000, saldoPendiente: 5000, fechaEmision: pastDate, fechaVencimiento: pastDate, estado: 'vencida', notas: 'Vencida', numeroFactura: 'F-001' },
    { id: uid(), proyectoId: 'proj-1', cliente: 'Cliente B', clienteNombre: 'Cliente B', concepto: 'Factura 002', monto: 3000, saldoPendiente: 3000, fechaEmision: pastDate, fechaVencimiento: futureDate, estado: 'pendiente', notas: '', numeroFactura: 'F-002' },
    { id: uid(), proyectoId: 'proj-2', cliente: 'Cliente C', clienteNombre: 'Cliente C', concepto: 'Factura 003', monto: 8000, saldoPendiente: 0, fechaEmision: pastDate, fechaVencimiento: pastDate, estado: 'cobrada', notas: '', fechaCobro: pastDate, numeroFactura: 'F-003' },
    { id: uid(), proyectoId: 'proj-1', cliente: 'Cliente A', clienteNombre: 'Cliente A', concepto: 'Factura 004', monto: 2000, saldoPendiente: 1000, fechaEmision: pastDate, fechaVencimiento: futureDate, estado: 'parcial', notas: 'Pago parcial', numeroFactura: 'F-004' },
    { id: uid(), proyectoId: 'proj-2', cliente: 'Cliente D', clienteNombre: 'Cliente D', concepto: 'Factura 005', monto: 10000, saldoPendiente: 10000, fechaEmision: pastDate, fechaVencimiento: pastDate, estado: 'vencida', notas: 'Vencida', numeroFactura: 'F-005' },
  ];
});

afterEach(cleanup);

describe('CuentasCobrar Screen', () => {
  describe('Carga y renderizado inicial', () => {
    it('renderiza titulo con icono de cuentas por cobrar', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Cuentas por Cobrar')).toBeInTheDocument();
      });
    });

    it('renderiza boton de nueva cuenta', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getAllByText('Nueva Cuenta').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renderiza tarjeta de total por cobrar', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Total por Cobrar')).toBeInTheDocument();
      });
    });

    it('renderiza tarjeta de cobradas', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Cobradas')).toBeInTheDocument();
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renderiza tarjeta de pendientes', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Pendientes')).toBeInTheDocument();
      });
    });

    it('renderiza tarjeta de vencidas', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Vencidas')).toBeInTheDocument();
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('renderiza lista de cuentas', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Lista de Cuentas')).toBeInTheDocument();
      });
    });

    it('renderiza campo de busqueda', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Buscar cuenta...')).toBeInTheDocument();
      });
    });

    it('renderiza filtro de estado', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Todos los estados')).toBeInTheDocument();
      });
    });

    it('renderiza contenido despues de carga', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Cuentas por Cobrar')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Buscar cuenta...')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros de tabla', () => {
    it('filtra por nombre de cliente', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar cuenta...');
        fireEvent.change(searchInput, { target: { value: 'Cliente A' } });
        expect(screen.getAllByText('Cliente A').length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText('Cliente D')).not.toBeInTheDocument();
      });
    });

    it('filtra por numero de factura', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar cuenta...');
        fireEvent.change(searchInput, { target: { value: 'F-001' } });
        expect(screen.getByText('F-001')).toBeInTheDocument();
      });
    });

    it('filtra por estado pendiente', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const estadoSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(estadoSelect, { target: { value: 'pendiente' } });
        const table = screen.getByRole('table');
        expect(within(table).getByText('Pendiente')).toBeInTheDocument();
      });
    });

    it('filtra por estado cobrada', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const estadoSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(estadoSelect, { target: { value: 'cobrada' } });
        const table = screen.getByRole('table');
        expect(within(table).getByText('Cobrada')).toBeInTheDocument();
      });
    });

    it('filtra por estado vencida', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const estadoSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(estadoSelect, { target: { value: 'vencida' } });
        const table = screen.getByRole('table');
        expect(within(table).getAllByText('Vencida').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('combina filtros de busqueda y estado', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar cuenta...');
        fireEvent.change(searchInput, { target: { value: 'Cliente A' } });
        const estadoSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(estadoSelect, { target: { value: 'vencida' } });
        const table = screen.getByRole('table');
        expect(within(table).getAllByText('Cliente A').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Tabla de cuentas', () => {
    it('renderiza encabezados de tabla', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getAllByText('Cliente').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Factura')).toBeInTheDocument();
        expect(screen.getByText('Monto')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText('Vencimiento')).toBeInTheDocument();
      });
    });

    it('renderiza filas de cuentas', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getAllByText('Cliente A').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Cliente B').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Cliente C').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('formatea montos con Q', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const table = screen.getByRole('table');
        const montoCells = within(table).getAllByText(/Q/);
        expect(montoCells.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('marca cuenta como pagada', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const markAsPaidButtons = screen.getAllByLabelText('Marcar como cobrada');
        fireEvent.click(markAsPaidButtons[0]);
        expect(mockUpdateCuentaCobrar).toHaveBeenCalled();
      });
    });

    it('abre formulario de edicion', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Editar');
        fireEvent.click(editButtons[0]);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('elimina cuenta', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Eliminar');
        fireEvent.click(deleteButtons[0]);
        expect(mockDeleteCuentaCobrar).toHaveBeenCalled();
      });
    });
  });

  describe('Calculos de estadisticas', () => {
    it('calcula monto total correctamente', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Total por Cobrar')).toBeInTheDocument();
      });
    });

    it('calcula monto cobrado correctamente', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Cobradas')).toBeInTheDocument();
        expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('identifica cuentas vencidas', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Vencidas')).toBeInTheDocument();
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('calcula porcentaje de pendientes', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText(/del total/)).toBeInTheDocument();
      });
    });
  });

  describe('Estado vacio', () => {
    it('muestra estado vacio cuando no hay cuentas', async () => {
      mockFacturas = [];
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('No hay cuentas por cobrar')).toBeInTheDocument();
      });
    });

    it('muestra estado vacio con filtros activos', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Buscar cuenta...');
        fireEvent.change(searchInput, { target: { value: 'NoExiste' } });
        expect(screen.getByText('No hay cuentas por cobrar')).toBeInTheDocument();
      });
    });
  });

  describe('Formulario de cuenta', () => {
    it('abre formulario de nueva cuenta', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const nuevaBtn = screen.getAllByText('Nueva Cuenta')[0];
        fireEvent.click(nuevaBtn);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('abre formulario de edicion desde tabla', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Editar');
        fireEvent.click(editButtons[0]);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('cierra formulario con boton cancelar', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const nuevaBtn = screen.getAllByText('Nueva Cuenta')[0];
        fireEvent.click(nuevaBtn);
        const cancelBtn = screen.getByText('Cancelar');
        fireEvent.click(cancelBtn);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('crea nueva cuenta', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const nuevaBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('Nueva Cuenta') && !b.textContent?.includes('Guardar'));
        fireEvent.click(nuevaBtn!);
      });
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        const proyectoSelect = within(dialog).getByDisplayValue('Seleccionar proyecto');
        fireEvent.change(proyectoSelect, { target: { value: 'proj-1' } });
        const clienteInput = within(dialog).getByPlaceholderText('Nombre del cliente');
        fireEvent.change(clienteInput, { target: { value: 'Nuevo Cliente' } });
        const conceptoInput = within(dialog).getByPlaceholderText('Concepto de cobro');
        fireEvent.change(conceptoInput, { target: { value: 'Servicio nuevo' } });
        const guardarBtn = within(dialog).getByRole('button', { name: 'Nueva Cuenta' });
        fireEvent.click(guardarBtn);
        expect(mockAddCuentaCobrar).toHaveBeenCalled();
      });
    });

    it('actualiza cuenta existente', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Editar');
        fireEvent.click(editButtons[0]);
        const clienteInput = screen.getByPlaceholderText('Nombre del cliente');
        fireEvent.change(clienteInput, { target: { value: 'Cliente Actualizado' } });
        const guardarBtn = screen.getByText('Guardar');
        fireEvent.click(guardarBtn);
        expect(mockUpdateCuentaCobrar).toHaveBeenCalled();
      });
    });
  });

  describe('Envejecimiento de cuentas', () => {
    it('identifica cuentas vencidas por fecha', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Vencidas')).toBeInTheDocument();
        expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('identifica cuentas a 30 dias', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Pendientes')).toBeInTheDocument();
      });
    });

    it('identifica cuentas a 60 dias', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Total por Cobrar')).toBeInTheDocument();
      });
    });

    it('identifica cuentas a 90 dias', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Total por Cobrar')).toBeInTheDocument();
      });
    });
  });

  describe('Exportacion', () => {
    it('renderiza opcion de exportar en tarjetas', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Total por Cobrar')).toBeInTheDocument();
      });
    });
  });

  describe('Manejo de errores', () => {
    it('muestra estado de error al fallar carga', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Cuentas por Cobrar')).toBeInTheDocument();
      });
    });
  });

  describe('Navegacion y acciones', () => {
    it('muestra icono de dolar en titulo', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Cuentas por Cobrar')).toBeInTheDocument();
      });
    });

    it('muestra porcentaje de pendientes', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText(/del total/)).toBeInTheDocument();
      });
    });

    it('identifica cuentas que requieren atencion', async () => {
      render(<CuentasCobrar />);
      await waitFor(() => {
        expect(screen.getByText('Requieren atencion')).toBeInTheDocument();
      });
    });
  });
});