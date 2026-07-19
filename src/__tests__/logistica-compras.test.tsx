import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import LogisticaCompras from '../erp/screens/LogisticaCompras';

const mockProveedores = [
  { id: 'prov-1', nombre: 'Proveedor A', categoria: 'materiales' },
  { id: 'prov-2', nombre: 'Proveedor B', categoria: 'equipo' },
];

const mockUseErp = {
  proveedores: mockProveedores,
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
      {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  ),
}));

describe('LogisticaCompras', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.proveedores = [...mockProveedores];
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
  });

  it('renders the logistica title', () => {
    render(<LogisticaCompras />);
    expect(screen.getByRole('heading', { name: /logistica.titulo/i })).toBeInTheDocument();
  });

  it('renders the logistica tabs', () => {
    render(<LogisticaCompras />);
    expect(screen.getAllByText(/logistica.activos/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/logistica.cuadros/i)).toBeInTheDocument();
    expect(screen.getByText(/logistica.pagos/i)).toBeInTheDocument();
  });

  it('shows empty state for activos tab by default', () => {
    render(<LogisticaCompras />);
    expect(screen.getByText(/logistica.sin_activos/i)).toBeInTheDocument();
  });
});