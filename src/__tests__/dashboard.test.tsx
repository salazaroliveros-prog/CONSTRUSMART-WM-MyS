import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

let mockCtx: any = {};

beforeEach(() => {
  mockCtx = {
    proyectos: [
      { id: 'proj-1', nombre: 'Torre Norte', estado: 'ejecucion', presupuestoTotal: 500000, montoEjecutado: 300000, avanceFisico: 60, avanceFinanciero: 60, variacion: 0, clienteId: 'cli-1' },
    ],
    avances: [],
    materiales: [],
    hitos: [],
    cuentasCobrar: [],
    cuentasPagar: [],
    riesgos: [],
    ordenes: [],
    presupuestos: [],
    empleados: [],
    setView: vi.fn(),
  };
});

vi.mock('../erp/store', () => ({
  useErp: () => mockCtx,
}));

vi.mock('../components/Charts', () => ({
  Progress: ({ children, value }: any) => React.createElement('div', { 'data-testid': 'progress' }, value || children),
}));

vi.mock('../components/ChartToolbar', () => ({
  default: () => React.createElement('div', { 'data-testid': 'chart-toolbar' }),
}));

vi.mock('../hooks/useChartConfig', () => ({
  useChartConfig: () => ({}),
}));

vi.mock('../components/shared', () => ({
  KPICard: ({ label, value }: any) => React.createElement('div', { 'data-testid': 'kpi-card' }, `${label}: ${value}`),
  StatusBadge: ({ label }: any) => React.createElement('div', { 'data-testid': 'status-badge' }, label),
  TableWithRowActions: ({ data, columns, emptyState }: any) => {
    if (!data || data.length === 0) {
      return React.createElement('div', { 'data-testid': 'table-empty' }, emptyState?.title || 'Empty');
    }
    return React.createElement('div', { 'data-testid': 'table' }, data.map((row: any) => React.createElement('div', { key: row.id, 'data-testid': 'table-row' }, row.nombre)));
  },
  ExecutiveAlerts: ({ alerts }: any) => React.createElement('div', { 'data-testid': 'alerts' }, `${alerts?.length || 0} alerts`),
}));

import Dashboard from '../erp/screens/Dashboard';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(cleanup);

describe('Dashboard Screen', () => {
  it('renderiza titulo', () => {
    render(<Dashboard />);
    expect(screen.getByText('dashboard.title')).toBeInTheDocument();
  });

  it('renderiza KPIs', () => {
    render(<Dashboard />);
    expect(screen.getByText('dashboard.proyectos')).toBeInTheDocument();
    expect(screen.getByText('dashboard.cartera')).toBeInTheDocument();
  });
});
