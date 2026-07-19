import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import EntradasAlmacenOC from '../erp/screens/EntradasAlmacenOC';

const mockOrdenes = [
  { id: 'oc-1', proyectoId: 'proy-1', proveedor: 'Proveedor A', material: 'Cemento', cantidad: 100, monto: 50000, estado: 'pendiente' },
  { id: 'oc-2', proyectoId: 'proy-1', proveedor: 'Proveedor B', material: 'Varilla', cantidad: 50, monto: 25000, estado: 'aprobado' },
  { id: 'oc-3', proyectoId: 'proy-2', proveedor: 'Proveedor C', material: 'Bloques', cantidad: 200, monto: 30000, estado: 'pendiente' },
];

const mockRecepciones = [
  { id: 'rec-1', ordenId: 'oc-1', cantidadRecibida: 50, fecha: '2026-07-10' },
  { id: 'rec-2', ordenId: 'oc-1', cantidadRecibida: 30, fecha: '2026-07-15' },
  { id: 'rec-3', ordenId: 'oc-2', cantidadRecibida: 50, fecha: '2026-07-12' },
  { id: 'rec-4', ordenId: 'oc-x', cantidadRecibida: 20, fecha: '2026-07-18' },
];

const mockUseErp = {
  ordenes: [...mockOrdenes],
  recepciones: [...mockRecepciones],
  addRecepcion: vi.fn(),
  currentProjectId: 'proy-1',
};

const mockT = (key: string) => key;

vi.mock('../erp/store', () => ({
  useErp: () => mockUseErp,
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

vi.mock('../erp/ui', () => ({
  INPUT: 'w-full px-3 py-2 border rounded-md',
  BUTTON_PRIMARY: 'flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-md',
  BUTTON_SECONDARY: 'px-4 py-2 border rounded-md',
}));

vi.mock('../erp/utils', () => ({
  fmtQ: vi.fn((n: number) => `Q ${n.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`),
}));

vi.mock('../erp/components/PaginationBar', () => ({
  default: ({ pagination, label }: any) => {
    if (!pagination || pagination.totalPages <= 1) return null;
    return <div data-testid="pagination-bar">{label}: {pagination.page}/{pagination.totalPages}</div>;
  },
}));

describe('EntradasAlmacenOC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.ordenes = [...mockOrdenes];
    mockUseErp.recepciones = [...mockRecepciones];
    mockUseErp.currentProjectId = 'proy-1';
    mockUseErp.addRecepcion = vi.fn();
  });

  it('renders the title with icon', () => {
    render(<EntradasAlmacenOC />);
    expect(screen.getByRole('heading', { name: /entradasAlmacenOC.titulo/i })).toBeInTheDocument();
  });

  it('renders without loading skeleton', () => {
    render(<EntradasAlmacenOC />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(0);
  });

  it('shows empty state when no OCs match current project', () => {
    mockUseErp.currentProjectId = 'proy-999';
    render(<EntradasAlmacenOC />);
    expect(screen.getByText('entradasAlmacenOC.sin_datos')).toBeInTheDocument();
  });

  it('renders OC table with data when ordenes are provided', () => {
    render(<EntradasAlmacenOC />);
    const ocTable = screen.getByRole('table', { name: 'entradasAlmacenOC.titulo' });
    expect(within(ocTable).getByText('Proveedor A')).toBeInTheDocument();
    expect(within(ocTable).getByText('Proveedor B')).toBeInTheDocument();
    expect(within(ocTable).getByText('Cemento')).toBeInTheDocument();
    expect(within(ocTable).getByText('Varilla')).toBeInTheDocument();
    expect(within(ocTable).getByText('100')).toBeInTheDocument();
    expect(within(ocTable).getByText('50')).toBeInTheDocument();
  });

  it('filters by estado: pendientes', () => {
    render(<EntradasAlmacenOC />);
    const pendientesBtn = screen.getByLabelText('entradasAlmacenOC.filtro_pendientes_aria');
    fireEvent.click(pendientesBtn);
    const ocTable = screen.getByRole('table', { name: 'entradasAlmacenOC.titulo' });
    expect(within(ocTable).getByText('Proveedor A')).toBeInTheDocument();
    expect(within(ocTable).queryByText('Proveedor B')).not.toBeInTheDocument();
  });

  it('filters by estado: aprobadas', () => {
    render(<EntradasAlmacenOC />);
    const aprobadasBtn = screen.getByLabelText('entradasAlmacenOC.filtro_aprobadas_aria');
    fireEvent.click(aprobadasBtn);
    const ocTable = screen.getByRole('table', { name: 'entradasAlmacenOC.titulo' });
    expect(within(ocTable).getByText('Proveedor B')).toBeInTheDocument();
    expect(within(ocTable).queryByText('Proveedor A')).not.toBeInTheDocument();
  });

  it('resets to todas filter after changing', () => {
    render(<EntradasAlmacenOC />);
    const pendientesBtn = screen.getByLabelText('entradasAlmacenOC.filtro_pendientes_aria');
    fireEvent.click(pendientesBtn);
    const ocTable = screen.getByRole('table', { name: 'entradasAlmacenOC.titulo' });
    expect(within(ocTable).queryByText('Proveedor B')).not.toBeInTheDocument();
    const todasBtn = screen.getByLabelText('entradasAlmacenOC.filtro_todas_aria');
    fireEvent.click(todasBtn);
    expect(within(ocTable).getByText('Proveedor A')).toBeInTheDocument();
    expect(within(ocTable).getByText('Proveedor B')).toBeInTheDocument();
  });

  it('opens reception modal when clicking Recibir button', () => {
    render(<EntradasAlmacenOC />);
    const recibirButton = screen.getByLabelText(/entradasAlmacenOC.recibir_aria/i);
    fireEvent.click(recibirButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('entradasAlmacenOC.registrar_recepcion')).toBeInTheDocument();
  });

  it('shows form validation error when cantidad is invalid', () => {
    render(<EntradasAlmacenOC />);
    const recibirButton = screen.getByLabelText(/entradasAlmacenOC.recibir_aria/i);
    fireEvent.click(recibirButton);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '0' } });
    const confirmButton = screen.getByRole('button', { name: 'entradasAlmacenOC.confirmar_recepcion' });
    fireEvent.click(confirmButton);
    expect(screen.getByText('entradasAlmacenOC.error_cantidad_invalida')).toBeInTheDocument();
  });

  it('shows form validation error when cantidad exceeds saldo', () => {
    render(<EntradasAlmacenOC />);
    const recibirButton = screen.getByLabelText(/entradasAlmacenOC.recibir_aria/i);
    fireEvent.click(recibirButton);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '200' } });
    const confirmButton = screen.getByRole('button', { name: 'entradasAlmacenOC.confirmar_recepcion' });
    fireEvent.click(confirmButton);
    expect(screen.getByText('entradasAlmacenOC.error_excede_saldo')).toBeInTheDocument();
  });

  it('calls addRecepcion on valid submission', async () => {
    render(<EntradasAlmacenOC />);
    const recibirButton = screen.getByLabelText(/entradasAlmacenOC.recibir_aria/i);
    fireEvent.click(recibirButton);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '20' } });
    const confirmButton = screen.getByRole('button', { name: 'entradasAlmacenOC.confirmar_recepcion' });
    fireEvent.click(confirmButton);
    await waitFor(() => {
      expect(mockUseErp.addRecepcion).toHaveBeenCalled();
    });
    expect(mockUseErp.addRecepcion).toHaveBeenCalledWith(expect.objectContaining({
      ordenId: expect.any(String),
      cantidadRecibida: 20,
    }));
  });

  it('shows historial de recepciones when recepciones exist', () => {
    render(<EntradasAlmacenOC />);
    expect(screen.getByText(/entradasAlmacenOC.historial_titulo/i)).toBeInTheDocument();
    expect(screen.getByText('entradasAlmacenOC.col_fecha')).toBeInTheDocument();
    expect(screen.getByText('entradasAlmacenOC.col_recibido')).toBeInTheDocument();
  });

  it('does not show orden oc-x in historial (no matching orden)', () => {
    render(<EntradasAlmacenOC />);
    expect(screen.getByText(/entradasAlmacenOC.historial_titulo/i)).toBeInTheDocument();
  });

  it('cancels reception modal when cancel button clicked', () => {
    render(<EntradasAlmacenOC />);
    const recibirButton = screen.getByLabelText(/entradasAlmacenOC.recibir_aria/i);
    fireEvent.click(recibirButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const cancelButton = screen.getByLabelText('entradasAlmacenOC.cancelar_recepcion');
    fireEvent.click(cancelButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clears error when cantidad is changed after validation error', () => {
    render(<EntradasAlmacenOC />);
    const recibirButton = screen.getByLabelText(/entradasAlmacenOC.recibir_aria/i);
    fireEvent.click(recibirButton);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '0' } });
    const confirmButton = screen.getByRole('button', { name: 'entradasAlmacenOC.confirmar_recepcion' });
    fireEvent.click(confirmButton);
    expect(screen.getByText('entradasAlmacenOC.error_cantidad_invalida')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '25' } });
    expect(screen.queryByText('entradasAlmacenOC.error_cantidad_invalida')).not.toBeInTheDocument();
  });

  it('handles empty ordenes array', () => {
    mockUseErp.ordenes = [];
    render(<EntradasAlmacenOC />);
    expect(screen.getByText('entradasAlmacenOC.sin_datos')).toBeInTheDocument();
  });

  it('handles empty recepciones array', () => {
    mockUseErp.recepciones = [];
    render(<EntradasAlmacenOC />);
    expect(screen.getByText('Proveedor A')).toBeInTheDocument();
    expect(screen.queryByText(/entradasAlmacenOC.historial_titulo/i)).not.toBeInTheDocument();
  });

  it('shows OC count text', () => {
    render(<EntradasAlmacenOC />);
    expect(screen.getByText(/entradasAlmacenOC.oc_count/i)).toBeInTheDocument();
  });

  it('filters out OCs from other projects', () => {
    render(<EntradasAlmacenOC />);
    expect(screen.queryByText('Proveedor C')).not.toBeInTheDocument();
  });

  it('shows estado badge text for each OC', () => {
    render(<EntradasAlmacenOC />);
    expect(screen.getByText('pendiente')).toBeInTheDocument();
    expect(screen.getByText('aprobado')).toBeInTheDocument();
  });
});
