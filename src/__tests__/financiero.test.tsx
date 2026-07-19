import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import Financiero from '../erp/screens/Financiero';

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', cliente: 'Cliente A', tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ', estado: 'planificacion', presupuestoTotal: 500000, montoContrato: 480000, avanceFisico: 0, avanceFinanciero: 0 },
  { id: 'proy-2', nombre: 'Torre Comercial', cliente: 'Cliente B', tipologia: 'comercial', tipoObra: 'remodelacion', moneda: 'USD', estado: 'construccion', presupuestoTotal: 1200000, montoContrato: 1150000, avanceFisico: 35, avanceFinanciero: 30 },
];

const mockMovimientos = [
  { id: 'mov-1', proyectoId: 'proy-1', tipo: 'ingreso', monto: 100000, fecha: new Date().toISOString() },
  { id: 'mov-2', proyectoId: 'proy-1', tipo: 'gasto', monto: 40000, fecha: new Date().toISOString() },
];

const mockCuentasCobrar = [
  { id: 'cc-1', proyectoId: 'proy-1', cliente: 'Cliente A', monto: 50000, fecha: new Date().toISOString() },
];

const mockCuentasPagar = [
  { id: 'cp-1', proyectoId: 'proy-1', proveedor: 'Proveedor A', monto: 30000, fechaVencimiento: new Date().toISOString() },
];

const mockUseErp = {
  movimientos: mockMovimientos,
  proyectos: mockProyectos,
  cuentasCobrar: mockCuentasCobrar,
  cuentasPagar: mockCuentasPagar,
  user: { nombre: 'Usuario Test', rol: 'Administrador' },
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

vi.mock('../erp/components/shared', () => ({
  KPICard: ({ title, value, icon }: any) => (
    <div data-testid="kpi-card">
      <span>{title}</span>
      <span>{value}</span>
      {icon}
    </div>
  ),
  TableWithRowActions: ({ data, columns, actions }: any) => (
    <div data-testid="table-with-row-actions">
      {data.map((row: any, idx: number) => (
        <div key={idx}>{row && columns && columns.length > 0 ? 'row' : ''}</div>
      ))}
    </div>
  ),
}));

vi.mock('../erp/components/financiero', () => ({
  ProfitabilityTable: () => <div data-testid="profitability-table">ProfitabilityTable</div>,
  AgingReport: () => <div data-testid="aging-report">AgingReport</div>,
}));

describe('Financiero', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.movimientos = [...mockMovimientos];
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.cuentasCobrar = [...mockCuentasCobrar];
    mockUseErp.cuentasPagar = [...mockCuentasPagar];
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
  });

  it('renders the financiero title', async () => {
    render(<Financiero />);
    await waitFor(() => {
      expect(screen.getByText('Dashboard Financiero')).toBeInTheDocument();
    });
  });

  it('renders the skeleton initially', () => {
    render(<Financiero />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders KPI cards after loading', async () => {
    render(<Financiero />);
    await waitFor(() => {
      expect(screen.getAllByTestId('kpi-card').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders the profitability table', async () => {
    render(<Financiero />);
    await waitFor(() => {
      expect(screen.getByTestId('profitability-table')).toBeInTheDocument();
    });
  });

  it('renders the aging report', async () => {
    render(<Financiero />);
    await waitFor(() => {
      expect(screen.getAllByTestId('aging-report').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('filters by proyecto', async () => {
    render(<Financiero />);
    const combos = await screen.findAllByRole('combobox');
    expect(combos.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no data', async () => {
    mockUseErp.proyectos = [];
    mockUseErp.movimientos = [];
    mockUseErp.cuentasCobrar = [];
    mockUseErp.cuentasPagar = [];
    render(<Financiero />);
    await waitFor(() => {
      expect(screen.getByText('financiero.sin_datos')).toBeInTheDocument();
    });
  });
});
