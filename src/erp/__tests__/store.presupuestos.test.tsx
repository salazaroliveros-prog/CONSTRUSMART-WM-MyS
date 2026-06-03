import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock supabase to avoid external calls during tests
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: async () => ({ data: [] }),
      insert: async () => ({ data: [], error: null }),
      update: async () => ({ data: [], error: null }),
      delete: async () => ({ data: [], error: null }),
      order: () => ({ select: async () => ({ data: [] }) }),
    }),
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: null } }),
      signInWithPassword: async () => ({}),
      signInWithOAuth: async () => ({ data: {} }),
    }
  }
}));

import { ErpProvider, useErp } from '../store';

const TestComponent: React.FC = () => {
  const { presupuestos, addPresupuesto } = useErp();
  useEffect(() => {
    (async () => {
      await addPresupuesto({
        proyectoId: 'test-proy',
        tipologia: 'residencial',
        renglones: [],
        totalCalculado: 100,
        costoDirectoTotal: 80,
        estado: 'borrador',
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        notas: 'test'
      });
    })();
  }, [addPresupuesto]);
  return <div data-testid="count">{presupuestos.length}</div>;
};

describe('Store Presupuestos', () => {
  test('provider initializes and can add presupuesto', async () => {
    render(
      <ErpProvider>
        <TestComponent />
      </ErpProvider>
    );

    await waitFor(() => expect(screen.getByTestId('count')).toBeInTheDocument());
    await waitFor(() => expect(Number(screen.getByTestId('count').textContent)).toBeGreaterThanOrEqual(1));
  });
});
