import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

let mockCuentasCobrar: any[] = [];
let mockProyectos: any[] = [];

beforeEach(() => {
  mockProyectos = [{ id: 'proj-1', nombre: 'Torre Norte' }];
  mockCuentasCobrar = [
    { id: 'cc-1', clienteNombre: 'Cliente 1', monto: 5000, estado: 'pendiente', proyectoId: 'proj-1' },
  ];
});

vi.mock('../erp/store', () => ({
  useErp: () => ({
    cuentasCobrar: mockCuentasCobrar,
    proyectos: mockProyectos,
  }),
}));

import CuentasCobrar from '../erp/screens/CuentasCobrar';

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

describe('CuentasCobrar Screen', () => {
  it('renderiza cuentas', async () => {
    render(<CuentasCobrar />);
    await waitFor(() => {
      expect(screen.getByText('Cliente 1')).toBeInTheDocument();
    });
  });
});
