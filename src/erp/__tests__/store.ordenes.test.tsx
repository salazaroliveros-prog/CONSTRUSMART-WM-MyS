import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

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
  const { ordenes, addOrden, addMovimiento } = useErp();

  useEffect(() => {
    (async () => {
      await addOrden({
        proyectoId: 'test-proy',
        proveedorId: 'test-prov',
        fecha: new Date().toISOString().slice(0, 10),
        estado: 'pendiente',
        total: 150,
        items: [{ materialId: 'mat-1', cantidad: 5, precioUnitario: 30 }],
      });
      await addMovimiento({
        tipo: 'gasto',
        proyectoId: 'test-proy',
        descripcion: 'Movimiento de prueba',
        cantidad: 1,
        unidad: 'u',
        categoria: 'materiales',
        costoUnitario: 150,
        costoTotal: 150,
        fecha: new Date().toISOString().slice(0, 10),
      });
    })();
  }, [addOrden, addMovimiento]);

  return (
    <div>
      <div data-testid="ordenes-count">{ordenes.length}</div>
    </div>
  );
};

describe('Store Ordenes', () => {
  test('adds orden and movimiento', async () => {
    render(
      <ErpProvider>
        <TestComponent />
      </ErpProvider>
    );

    await waitFor(() => expect(screen.getByTestId('ordenes-count')).toBeInTheDocument());
    await waitFor(() => expect(Number(screen.getByTestId('ordenes-count').textContent)).toBeGreaterThanOrEqual(1));
  });
});
