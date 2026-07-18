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

let mockPublicaciones: any[] = [];
let mockProyectos: any[] = [];

beforeEach(() => {
  mockProyectos = [{ id: 'proj-1', nombre: 'Torre Norte' }];
  mockPublicaciones = [
    { id: 'pub-1', texto: 'Avance del dia', tipo: 'avance', proyectoId: 'proj-1', likes: 3, comentarios: [], createdAt: new Date().toISOString() },
  ];
});

vi.mock('../erp/store', () => ({
  useErp: () => ({
    publicacionesMuro: mockPublicaciones,
    proyectos: mockProyectos,
    addPublicacionMuro: vi.fn(),
    addComentarioMuro: vi.fn(),
    likePublicacionMuro: vi.fn(),
  }),
}));

vi.mock('../components/ProyectoFilter', () => ({
  default: () => null,
}));

vi.mock('../ui', () => ({
  INPUT: '',
  BUTTON_PRIMARY: '',
  BUTTON_SECONDARY: '',
}));

import MuroObra from '../erp/screens/MuroObra';

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

describe('MuroObra Screen', () => {
  it('renderiza sin crash', async () => {
    const { container } = render(<MuroObra />);
    await waitFor(() => {
      expect(container.innerHTML).not.toBe('');
    });
  });
});
