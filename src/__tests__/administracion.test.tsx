import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import Administracion from '../erp/screens/Administracion';

const mockUseErp: Record<string, any> = {
  user: { nombre: 'Usuario Test', rol: 'Administrador' },
  proyectos: [],
  centrosCosto: [],
  auditLog: [],
  addCentroCosto: vi.fn(),
  updateCentroCosto: vi.fn(),
  deleteCentroCosto: vi.fn(),
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

describe('Administracion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
    mockUseErp.proyectos = [];
  });

  it('renders the administracion title', async () => {
    render(<Administracion />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /admin.titulo/i })).toBeInTheDocument();
    });
  });

  it('renders admin tabs', async () => {
    render(<Administracion />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /admin.tab_centros|admin.centros/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /admin.tab_logs|admin.logs/i })).toBeInTheDocument();
    });
  });
});
