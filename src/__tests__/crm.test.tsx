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

let mockLicitaciones: any[] = [];
let mockProyectos: any[] = [];

beforeEach(() => {
  mockProyectos = [{ id: 'proj-1', nombre: 'Torre Norte' }];
  mockLicitaciones = [
    { id: 'lic-1', nombre: 'Licitacion 1', clienteId: 'cli-1', monto: 500000, probabilidad: 80, estado: 'activa' },
  ];
});

vi.mock('../erp/store', () => ({
  useErp: () => ({
    licitaciones: mockLicitaciones,
    proyectos: mockProyectos,
    addLicitacion: vi.fn(),
    updateLicitacion: vi.fn(),
    deleteLicitacion: vi.fn(),
  }),
}));

import CRM from '../erp/screens/CRM';

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

describe('CRM Screen', () => {
  it('renderiza licitaciones', async () => {
    render(<CRM />);
    await waitFor(() => {
      expect(screen.getByText('Licitacion 1')).toBeInTheDocument();
    });
  });
});
