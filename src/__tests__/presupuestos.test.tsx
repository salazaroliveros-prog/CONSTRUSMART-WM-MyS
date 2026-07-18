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

let mockPresupuestos: any[] = [];
let mockProyectos: any[] = [];

beforeEach(() => {
  mockProyectos = [
    { id: 'proj-1', nombre: 'Torre Norte' },
    { id: 'proj-2', nombre: 'Edificio Sur' },
  ];
  mockPresupuestos = [
    { id: 'p-1', nombre: 'Presupuesto Torre', proyectoId: 'proj-1', tipologia: 'residencial', estado: 'borrador', moneda: 'GTQ', renglones: [], totalCalculado: 10000 },
    { id: 'p-2', nombre: 'Presupuesto Edificio', proyectoId: 'proj-2', tipologia: 'comercial', estado: 'aprobado', moneda: 'GTQ', renglones: [], totalCalculado: 20000 },
  ];
});

vi.mock('../erp/store', () => ({
  useErp: () => ({
    presupuestos: mockPresupuestos,
    proyectos: mockProyectos,
    addPresupuesto: vi.fn(),
    updatePresupuesto: vi.fn(),
    deletePresupuesto: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/confirm-action', () => ({
  confirmAction: vi.fn(() => Promise.resolve(true)),
}));

import Presupuestos from '../erp/screens/Presupuestos';

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

describe('Presupuestos Screen', () => {
  it('renderiza titulo y lista', async () => {
    render(<Presupuestos />);
    await waitFor(() => {
      expect(screen.getByText('Presupuesto Torre')).toBeInTheDocument();
    });
    expect(screen.getByText('presupuestos.titulo')).toBeInTheDocument();
  });
});
