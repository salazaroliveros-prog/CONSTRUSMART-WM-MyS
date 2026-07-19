import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import CurvasS from '../erp/screens/CurvasS';

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', avanceFisico: 50, avanceFinanciero: 60 },
];

const mockUseErp = {
  proyectos: mockProyectos,
  user: { nombre: 'Usuario Test', rol: 'Administrador' },
};

const mockT = (key: string) => key;

vi.mock('../erp/store', () => ({
  useErp: (selector?: any) => selector ? selector(mockUseErp) : mockUseErp,
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

describe('CurvasS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
  });

  it('renders the S-curve title', () => {
    render(<CurvasS />);
    expect(screen.getByRole('heading', { name: /curvas.titulo/i })).toBeInTheDocument();
  });

  it('renders the S-curve chart container', () => {
    render(<CurvasS />);
    expect(screen.getByText(/curvas.curva_s/i)).toBeInTheDocument();
  });

  it('shows the proyecto selector', () => {
    render(<CurvasS />);
    expect(screen.getByDisplayValue('Residencial Aurora')).toBeInTheDocument();
  });

  it('shows EVM KPI metrics', () => {
    render(<CurvasS />);
    const pvElements = screen.getAllByText(/curvas.valor_planificado/i);
    expect(pvElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows the monthly data table with headers', () => {
    render(<CurvasS />);
    expect(screen.getByText(/curvas.mes/i)).toBeInTheDocument();
    expect(screen.getByText(/curvas.pv/i)).toBeInTheDocument();
    expect(screen.getByText(/curvas.ev/i)).toBeInTheDocument();
    expect(screen.getByText(/curvas.ac/i)).toBeInTheDocument();
  });
});