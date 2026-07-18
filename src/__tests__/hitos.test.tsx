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

let mockHitos: any[] = [];
let mockProyectos: any[] = [];

beforeEach(() => {
  mockProyectos = [{ id: 'proj-1', nombre: 'Torre Norte' }];
  mockHitos = [
    { id: 'h-1', nombre: 'Hito 1', proyectoId: 'proj-1', fecha: '2024-01-01', completado: false },
  ];
});

vi.mock('../erp/store', () => ({
  useErp: () => ({
    hitos: mockHitos,
    proyectos: mockProyectos,
    addHito: vi.fn(),
    updateHito: vi.fn(),
    deleteHito: vi.fn(),
  }),
}));

import Hitos from '../erp/screens/Hitos';

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

describe('Hitos Screen', () => {
  it('renderiza hitos', async () => {
    render(<Hitos />);
    await waitFor(() => {
      expect(screen.getByText('Hito 1')).toBeInTheDocument();
    });
  });
});
