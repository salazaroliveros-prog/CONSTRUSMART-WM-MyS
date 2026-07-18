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

let mockNotificaciones: any[] = [];
let mockProyectos: any[] = [];

vi.mock('../erp/store', () => ({
  useErp: () => ({
    notificaciones: mockNotificaciones,
    proyectos: mockProyectos,
    appSettings: {},
    markNotificacionLeida: vi.fn(),
    marcarTodasLeidas: vi.fn(),
  }),
}));

vi.mock('../hooks/useNotificationSound', () => ({
  useNotificationSound: () => vi.fn(),
}));

vi.mock('../components/PaginationBar', () => ({
  default: () => null,
}));

import Notificaciones from '../erp/screens/Notificaciones';

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

beforeEach(() => {
  mockProyectos = [{ id: 'proj-1', nombre: 'Torre Norte' }];
  mockNotificaciones = [
    { id: 'n-1', tipo: 'stock_critico', titulo: 'Stock Bajo', mensaje: 'Stock bajo en cemento', leido: false, proyectoId: 'proj-1', createdAt: new Date().toISOString() },
  ];
});

afterEach(cleanup);

describe('Notificaciones Screen', () => {
  it('renderiza notificaciones', async () => {
    render(<Notificaciones />);
    await waitFor(() => {
      expect(screen.getByText('Stock Bajo')).toBeInTheDocument();
      expect(screen.getByText('Stock bajo en cemento')).toBeInTheDocument();
    });
  });
});
