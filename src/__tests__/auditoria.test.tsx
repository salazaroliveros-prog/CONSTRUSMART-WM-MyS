import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import Auditoria from '../erp/screens/Auditoria';

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', cliente: 'Cliente A' },
];

const mockAuditLog = [
  { id: 'log-1', accion: 'crear', entidad: 'proyecto', usuarioNombre: 'admin', createdAt: '2024-01-10T10:00:00Z', valoresNuevos: null },
  { id: 'log-2', accion: 'actualizar', entidad: 'presupuesto', usuarioNombre: 'supervisor', createdAt: '2024-01-11T10:00:00Z', valoresNuevos: { nombre: 'Nuevo' } },
];

const mockUseErp = {
  auditLog: mockAuditLog,
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

vi.mock('../erp/ui', () => ({
  BUTTON_PRIMARY: 'flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-md',
  BUTTON_SECONDARY: 'px-4 py-2 border rounded-md',
  INPUT: 'w-full px-3 py-2 border rounded-md',
}));

vi.mock('../erp/components/ProyectoFilter', () => ({
  default: ({ value, onChange, proyectos }: any) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Todos los proyectos</option>
      {proyectos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  ),
}));

describe('Auditoria', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.auditLog = [...mockAuditLog];
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
  });

  it('renders the auditoria list items', () => {
    render(<Auditoria />);
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('supervisor')).toBeInTheDocument();
  });

  it('renders KPI cards', () => {
    render(<Auditoria />);
    expect(screen.getByText('auditoria.total')).toBeInTheDocument();
    expect(screen.getByText('auditoria.creaciones')).toBeInTheDocument();
    expect(screen.getByText('auditoria.actualizaciones')).toBeInTheDocument();
    expect(screen.getByText('auditoria.eliminaciones')).toBeInTheDocument();
  });

  it('filters by proyecto', () => {
    render(<Auditoria />);
    const proyectoSelect = screen.getByDisplayValue(/auditoria.filtro_todos|Todos los proyectos/i);
    expect(proyectoSelect).toBeInTheDocument();
  });

  it('shows empty state when no auditoria', () => {
    mockUseErp.auditLog = [];
    render(<Auditoria />);
    expect(screen.getByText(/auditoria.sin_resultados/i)).toBeInTheDocument();
  });
});