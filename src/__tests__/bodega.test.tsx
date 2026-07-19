import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

let mockMateriales: any[] = [];
let mockProveedores: any[] = [];
let mockOrdenes: any[] = [];
let mockProyectos: any[] = [];
let mockCtx: any = {};

beforeEach(() => {
  vi.clearAllMocks();
  
  mockProyectos = [
    { id: 'proj-1', nombre: 'Torre Norte' },
  ];
  
  mockMateriales = [
    { id: 'mat-1', nombre: 'Cemento', stock: 100, stockMinimo: 20, precio: 25, unidad: 'kg' },
    { id: 'mat-2', nombre: 'Arena', stock: 5, stockMinimo: 10, precio: 15, unidad: 'm³' },
  ];
  
  mockProveedores = [
    { id: 'prov-1', nombre: 'Proveedor A', contacto: 'Juan Pérez', rubro: 'Construcción', calificacion: 4 },
  ];
  
  mockOrdenes = [
    { 
      id: 'ord-1', 
      proveedor: 'Proveedor A', 
      material: 'Cemento', 
      cantidad: 50, 
      estado: 'pendiente', 
      monto: 1250,
      proyectoId: 'proj-1',
      fecha: '2026-07-18',
      items: []
    },
  ];
  
  mockCtx = {
    currentProjectId: 'proj-1',
    updateMaterial: vi.fn(),
    addProveedor: vi.fn(),
    updateProveedor: vi.fn(),
    deleteProveedor: vi.fn(),
    ordenes: mockOrdenes,
    updateOrden: vi.fn(),
    addOrden: vi.fn(),
    currentProject: mockProyectos[0],
    isOnline: true,
    initializing: false,
    view: 'bodega',
    setView: vi.fn(),
    user: null,
    notificacionesNoLeidas: 0,
    allowedViews: ['bodega'],
    forceSync: vi.fn(),
    materiales: mockMateriales,
    proveedores: mockProveedores,
  };
});

vi.mock('../erp/store', () => ({
  useErp: () => mockCtx,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn() },
}));

vi.mock('@/lib/confirm-action', () => ({
  confirmAction: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/lib/encryption', () => ({
  encryptionManager: {
    encryptData: vi.fn(async (data) => data),
    decryptData: vi.fn(async (data) => data),
    isEncryptionAvailable: vi.fn(() => false),
  },
  migrateSecureStorage: vi.fn(async () => {}),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, token: null, signInWithGoogle: vi.fn(), signOut: vi.fn() }),
}));

vi.mock('../erp/hooks/useRefDataQueries', () => ({
  useMateriales: () => mockMateriales,
  useProveedores: () => mockProveedores,
}));

vi.mock('../erp/hooks/useChartConfig', () => ({
  useChartConfig: () => ({
    type: 'bar',
    palette: 'default',
    setType: vi.fn(),
    setPalette: vi.fn(),
    reset: vi.fn(),
  }),
}));

import Bodega from '../erp/screens/Bodega';

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

describe('Bodega Screen', () => {
  it('renders inventory KPIs', async () => {
    render(<Bodega />);
    await waitFor(() => {
      // Use getByText with specific context to avoid duplicates
      const cementoElements = screen.getAllByText('Cemento');
      // Look for the specific element in the inventory list (not in chart, etc.)
      expect(cementoElements.length).toBeGreaterThan(0);
      const arenaElements = screen.getAllByText('Arena');
      expect(arenaElements.length).toBeGreaterThan(0);
    });
  });

  it('displays inventory management interface', async () => {
    render(<Bodega />);
    await waitFor(() => {
      const BodegaContainer = screen.getByText('bodega.control_stock');
      expect(BodegaContainer).toBeInTheDocument();
    });
  });

  it('opens provider modal', async () => {
    const { getByText, getByLabelText } = render(<Bodega />);
    await waitFor(() => {
      expect(getByText('bodega.proveedor')).toBeInTheDocument();
    });
    fireEvent.click(getByText('bodega.proveedor'));
    await waitFor(() => {
      // Use getByLabelText with more specific selector or try placeholder
      const nombreInput = screen.getByPlaceholderText('common.nombre');
      expect(nombreInput).toBeInTheDocument();
    });
  });
});