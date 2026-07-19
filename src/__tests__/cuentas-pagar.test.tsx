import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import CuentasPagar from '../erp/screens/CuentasPagar';

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', cliente: 'Cliente A', tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ' },
  { id: 'proy-2', nombre: 'Torre Comercial', cliente: 'Cliente B', tipologia: 'comercial', tipoObra: 'remodelacion', moneda: 'USD' },
];

const mockCuentasPagar = [
  {
    id: 'cp-1',
    proyectoId: 'proy-1',
    proveedor: 'Proveedor Uno',
    proveedorNombre: 'Proveedor Uno',
    concepto: 'Materiales de construcción',
    monto: 5000,
    saldoPendiente: 5000,
    fechaEmision: '2024-01-10',
    fechaVencimiento: '2024-02-10',
    estado: 'pendiente' as const,
  },
  {
    id: 'cp-2',
    proyectoId: 'proy-2',
    proveedor: 'Proveedor Dos',
    proveedorNombre: 'Proveedor Dos',
    concepto: 'Mano de obra',
    monto: 3200,
    saldoPendiente: 0,
    fechaEmision: '2024-01-12',
    fechaVencimiento: '2024-01-30',
    estado: 'pagada' as const,
  },
  {
    id: 'cp-3',
    proyectoId: 'proy-1',
    proveedor: 'Proveedor Tres',
    proveedorNombre: 'Proveedor Tres',
    concepto: 'Equipo de seguridad',
    monto: 1800,
    saldoPendiente: 1800,
    fechaEmision: '2024-01-05',
    fechaVencimiento: '2024-01-01',
    estado: 'vencida' as const,
  },
];

const mockUseErp = {
  cuentasPagar: mockCuentasPagar,
  proyectos: mockProyectos,
  proveedores: [],
  user: {
    nombre: 'Usuario Test',
    rol: 'Administrador',
  },
  addCuentaPagar: vi.fn(),
  updateCuentaPagar: vi.fn(),
  deleteCuentaPagar: vi.fn(),
};

const mockT = (key: string) => key;

vi.mock('../erp/store', () => ({
  useErp: () => mockUseErp,
  ErpProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/confirm-action', () => ({
  confirmAction: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: { error: vi.fn() },
}));

vi.mock('@/lib/security', () => ({
  canUserEdit: () => true,
}));

vi.mock('../erp/ui', () => ({
  BUTTON_PRIMARY: 'flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-md',
  BUTTON_SECONDARY: 'px-4 py-2 border rounded-md',
  INPUT: 'w-full px-3 py-2 border rounded-md',
}));

vi.mock('../erp/components/ProyectoFilter', () => ({
  default: ({ value, onChange, proyectos }: any) => (
    <select value={value} onChange={(e: any) => onChange(e.target.value)}>
      <option value="">Todos los proyectos</option>
      {proyectos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  ),
}));

describe('CuentasPagar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.cuentasPagar = [...mockCuentasPagar];
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.proveedores = [];
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
  });

  it('renders the screen title', async () => {
    render(<CuentasPagar />);
    await waitFor(() => expect(screen.getByRole('heading', { name: /cuentas_pagar.titulo/i })).toBeInTheDocument());
  });

  it('renders the list of cuentas por pagar', async () => {
    render(<CuentasPagar />);
    await waitFor(() => {
      expect(screen.getByText('Proveedor Uno')).toBeInTheDocument();
      expect(screen.getByText('Proveedor Dos')).toBeInTheDocument();
      expect(screen.getByText('Proveedor Tres')).toBeInTheDocument();
    });
  });

  it('renders KPI summary cards', async () => {
    render(<CuentasPagar />);
    await waitFor(() => {
      expect(screen.getByText(/cuentas_pagar.total_por_pagar/i)).toBeInTheDocument();
      expect(screen.getByText(/cuentas_pagar.pagadas/i)).toBeInTheDocument();
      expect(screen.getByText(/cuentas_pagar.pendientes/i)).toBeInTheDocument();
      expect(screen.getByText(/cuentas_pagar.vencidas/i)).toBeInTheDocument();
    });
  });

  it('renders table headers', async () => {
    render(<CuentasPagar />);
    await waitFor(() => {
      expect(screen.getByText(/cuentas_pagar.col_proveedor/i)).toBeInTheDocument();
      expect(screen.getByText(/cuentas_pagar.col_concepto/i)).toBeInTheDocument();
      expect(screen.getByText(/cuentas_pagar.col_monto/i)).toBeInTheDocument();
      expect(screen.getByText(/cuentas_pagar.col_estado/i)).toBeInTheDocument();
      expect(screen.getByText(/cuentas_pagar.col_vencimiento/i)).toBeInTheDocument();
    });
  });

  it('opens form when nueva cuenta button clicked', async () => {
    render(<CuentasPagar />);
    await waitFor(() => expect(screen.getByRole('button', { name: /cuentas_pagar.nueva_cuenta/i })).toBeInTheDocument());
    const newButton = screen.getByRole('button', { name: /cuentas_pagar.nueva_cuenta/i });
    fireEvent.click(newButton);
    expect(screen.getByPlaceholderText(/cuentas_pagar.proveedor_placeholder/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/cuentas_pagar.concepto_placeholder/i)).toBeInTheDocument();
  });

  it('handles form submission for new cuenta', async () => {
    render(<CuentasPagar />);
    await waitFor(() => expect(screen.getByRole('button', { name: /cuentas_pagar.nueva_cuenta/i })).toBeInTheDocument());

    const newButton = screen.getByRole('button', { name: /cuentas_pagar.nueva_cuenta/i });
    fireEvent.click(newButton);

    const proyectoSelect = screen.getByDisplayValue('') as HTMLSelectElement;
    fireEvent.change(proyectoSelect, { target: { value: 'proy-1' } });

    const proveedorInput = screen.getByPlaceholderText(/cuentas_pagar.proveedor_placeholder/i);
    fireEvent.change(proveedorInput, { target: { value: 'Proveedor Nuevo' } });

    const conceptoInput = screen.getByPlaceholderText(/cuentas_pagar.concepto_placeholder/i);
    fireEvent.change(conceptoInput, { target: { value: 'Nuevo concepto' } });

    const submitButton = screen.getByRole('button', { name: /cuentas_pagar.nueva_cuenta/i });
    fireEvent.click(submitButton);

    expect(mockUseErp.addCuentaPagar).toHaveBeenCalled();
  });

  it('shows validation error when proyecto is missing on submit', async () => {
    render(<CuentasPagar />);
    await waitFor(() => expect(screen.getByRole('button', { name: /cuentas_pagar.nueva_cuenta/i })).toBeInTheDocument());

    const newButton = screen.getByRole('button', { name: /cuentas_pagar.nueva_cuenta/i });
    fireEvent.click(newButton);

    const submitButton = screen.getByRole('button', { name: /cuentas_pagar.nueva_cuenta/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/cuentas_pagar.proyecto_requerido/i)).toBeInTheDocument();
    expect(mockUseErp.addCuentaPagar).not.toHaveBeenCalled();
  });

  it('filters by estado when estado select changed', async () => {
    render(<CuentasPagar />);
    await waitFor(() => expect(screen.getByText('Proveedor Uno')).toBeInTheDocument());

    const estadoSelect = screen.getByDisplayValue('cuentas_pagar.todos_estados') as HTMLSelectElement;
    fireEvent.change(estadoSelect, { target: { value: 'pagada' } });

    await waitFor(() => {
      expect(screen.queryByText('Proveedor Uno')).not.toBeInTheDocument();
      expect(screen.getByText('Proveedor Dos')).toBeInTheDocument();
      expect(screen.queryByText('Proveedor Tres')).not.toBeInTheDocument();
    });
  });

  it('filters by search term', async () => {
    render(<CuentasPagar />);
    await waitFor(() => expect(screen.getByText('Proveedor Uno')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/cuentas_pagar.buscar/i);
    fireEvent.change(searchInput, { target: { value: 'Mano de obra' } });

    await waitFor(() => {
      expect(screen.queryByText('Proveedor Uno')).not.toBeInTheDocument();
      expect(screen.getByText('Proveedor Dos')).toBeInTheDocument();
    });
  });

  it('marks a cuenta as paid when pagar button clicked', async () => {
    render(<CuentasPagar />);
    await waitFor(() => expect(screen.getByRole('button', { name: /cuentas_pagar.marcar_pagada/i })).toBeInTheDocument());

    const pagarButtons = screen.getAllByRole('button', { name: /cuentas_pagar.marcar_pagada/i });
    fireEvent.click(pagarButtons[0]);

    await waitFor(() => expect(mockUseErp.updateCuentaPagar).toHaveBeenCalledWith('cp-1', expect.objectContaining({ estado: 'pagada' })));
  });

  it('deletes a cuenta when eliminar clicked and confirmed', async () => {
    render(<CuentasPagar />);
    await waitFor(() => expect(screen.getByRole('button', { name: /common.eliminar/i })).toBeInTheDocument());

    const eliminarButtons = screen.getAllByRole('button', { name: /common.eliminar/i });
    fireEvent.click(eliminarButtons[0]);

    await waitFor(() => expect(mockUseErp.deleteCuentaPagar).toHaveBeenCalledWith('cp-1'));
  });

  it('opens edit form when editar clicked', async () => {
    render(<CuentasPagar />);
    await waitFor(() => expect(screen.getByRole('button', { name: /common.editar/i })).toBeInTheDocument());

    const editarButtons = screen.getAllByRole('button', { name: /common.editar/i });
    fireEvent.click(editarButtons[0]);

    expect(screen.getByDisplayValue('Proveedor Uno')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Materiales de construcción')).toBeInTheDocument();
  });

  it('shows empty state when no cuentas', async () => {
    mockUseErp.cuentasPagar = [];
    render(<CuentasPagar />);
    await waitFor(() => expect(screen.getByText(/cuentas_pagar.sin_cuentas/i)).toBeInTheDocument());
  });
});
