import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import Cuadros from '../erp/screens/Cuadros';

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', cliente: 'Cliente A', tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ' },
];

const mockCuadros = [
  { id: 'cuadro-1', proyectoId: 'proy-1', solicitud: 'Cuadro 1', estado: 'abierto', fechaSolicitud: '2024-01-15', cotizaciones: [] },
];

const mockUseErp = {
  proyectos: mockProyectos,
  user: { nombre: 'Usuario Test', rol: 'Administrador' },
  cuadros: mockCuadros,
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
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Todos los proyectos</option>
      {proyectos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  ),
}));

describe('Cuadros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.cuadros = [...mockCuadros];
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
  });

  it('renders the cuadros title', () => {
    render(<Cuadros />);
    expect(screen.getByRole('heading', { name: /cuadros.titulo/i })).toBeInTheDocument();
  });

  it('renders cuadros list', () => {
    render(<Cuadros />);
    expect(screen.getByText('Cuadro 1')).toBeInTheDocument();
  });

  it('shows empty state when no cuadros', () => {
    mockUseErp.cuadros = [];
    render(<Cuadros />);
    expect(screen.getByText(/cuadros.sin_cuadros/i)).toBeInTheDocument();
  });
});
