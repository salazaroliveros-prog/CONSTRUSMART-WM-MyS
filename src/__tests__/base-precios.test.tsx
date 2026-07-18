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

let mockInsumos: any[] = [];

beforeEach(() => {
  mockInsumos = [
    { id: 'ins-1', nombre: 'Cemento', rubro: 'concreto', unidad: 'saco', precio: 100 },
  ];
});

vi.mock('../erp/store', () => ({
  useErp: () => ({
    insumosBase: mockInsumos,
    addInsumoBase: vi.fn(),
    updateInsumoBase: vi.fn(),
    deleteInsumoBase: vi.fn(),
  }),
}));

import BasePrecios from '../erp/screens/BasePrecios';

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

describe('BasePrecios Screen', () => {
  it('renderiza insumos', async () => {
    render(<BasePrecios />);
    await waitFor(() => {
      expect(screen.getByText('Cemento')).toBeInTheDocument();
    });
  });
});
