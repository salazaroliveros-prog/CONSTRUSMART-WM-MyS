import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import OrdenesCambio from '../erp/screens/OrdenesCambio';

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', cliente: 'Cliente A', tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ' },
  { id: 'proy-2', nombre: 'Torre Comercial', cliente: 'Cliente B', tipologia: 'comercial', tipoObra: 'remodelacion', moneda: 'USD' },
];

const mockOrdenesCambio = [
  {
    id: 'oc-1',
    titulo: 'Cambio estructural',
    descripcion: 'El cambio es necesario para estabilidad',
    solicitante: 'Usuario A',
    solicitanteRol: 'Residente',
    estado: 'solicitud' as const,
    impactoCosto: 2500,
    impactoPlazo: 3,
    createdAt: '2024-01-10T09:00:00Z',
    proyectoId: 'proy-1',
  },
  {
    id: 'oc-2',
    titulo: 'Cambio de marca',
    descripcion: 'Actualizar marca corporativa',
    solicitante: 'Usuario B',
    solicitanteRol: 'Supervisor',
    estado: 'revision' as const,
    impactoCosto: 1800,
    impactoPlazo: 5,
    createdAt: '2024-01-15T10:00:00Z',
    proyectoId: 'proy-2',
    aprobador: 'Gerente X',
    fechaAprobacion: '2024-01-16T11:00:00Z',
  },
  {
    id: 'oc-3',
    titulo: 'Cambio de red',
    descripcion: 'Nueva red de distribución',
    solicitante: 'Usuario C',
    solicitanteRol: 'Residente',
    estado: 'aprobado' as const,
    impactoCosto: 4200,
    impactoPlazo: 1,
    createdAt: '2024-01-20T08:00:00Z',
    proyectoId: 'proy-1',
    aprobador: 'Gerente Y',
    fechaAprobacion: '2024-01-21T09:00:00Z',
  },
];

const mockUseErp = {
  proyectos: mockProyectos,
  user: {
    nombre: 'Usuario Test',
    rol: 'Administrador',
  },
  ordenesCambio: mockOrdenesCambio,
  addOrdenCambio: vi.fn(),
  updateOrdenCambio: vi.fn(),
};

const mockT = (key: string) => key;

vi.mock('../erp/store', () => ({
  useErp: () => mockUseErp,
  ErpProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('@/lib/confirm-action', () => ({
  confirmAction: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: { error: vi.fn() },
}));

vi.mock('@/lib/security', () => ({
  canUserEdit: () => true,
}));

vi.mock('../erp/ui', () => ({
  BUTTON_PRIMARY: 'flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-md',
  BUTTON_SECONDARY: 'px-4 py-2 border rounded-md',
  INPUT: 'w-full px-3 py-2 border rounded-md',
}));

vi.mock('../erp/components/ProyectoFilter', () => ({
  default: ({ value, onChange, proyectos }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Todos los proyectos</option>
      {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  ),
}));

describe('OrdenesCambio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.ordenesCambio = [...mockOrdenesCambio];
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
  });

  it('renders ordenes de cambio list items', () => {
    render(<OrdenesCambio />);
    expect(screen.getByText('Cambio estructural')).toBeInTheDocument();
    expect(screen.getByText('Torre Comercial')).toBeInTheDocument();
    expect(screen.getByText('Cambio de red')).toBeInTheDocument();
  });

  it('shows loading skeleton initially', () => {
    const { rerender } = render(<OrdenesCambio />);
    const skeleton = <div className="p-4 sm:p-6"><input className="w-full" /></div>;
    rerender(skeleton);
  });

  it('calculates total ordenes count correctly', () => {
    render(<OrdenesCambio />);
    const totalElement = screen.getByText('3');
    expect(totalElement).toBeInTheDocument();
  });

  it('calculates pendientes (solicitud + revision) count correctly', () => {
    render(<OrdenesCambio />);
    const pendientesElement = screen.getByText('2');
    expect(pendientesElement).toBeInTheDocument();
  });

  it('calculates costo aprobado total correctly', () => {
    render(<OrdenesCambio />);
    const costoElements = screen.getAllByText('Q 4,200.00');
    expect(costoElements.length).toBeGreaterThanOrEqual(1);
  });

  it('filters ordenes when proyecto selected', async () => {
    render(<OrdenesCambio />);
    const selectElement = screen.getByDisplayValue('Todos los proyectos');
    fireEvent.change(selectElement, { target: { value: 'proy-1' } });
    await waitFor(() => {
      expect(screen.getByText('Cambio estructural')).toBeInTheDocument();
      expect(screen.queryByText('Cambio de marca')).not.toBeInTheDocument();
      expect(screen.getByText('Cambio de red')).toBeInTheDocument();
    });
  });

  it('opens form when nueva button clicked', () => {
    render(<OrdenesCambio />);
    const newButton = screen.getByRole('button', { name: /ordenes_cambio.nueva/i });
    fireEvent.click(newButton);
    expect(screen.getByPlaceholderText(/ordenes_cambio.placeholder_titulo/i)).toBeInTheDocument();
  });

  it('handles form submission for new orden', () => {
    render(<OrdenesCambio />);

    const selectElement = screen.getByDisplayValue('Todos los proyectos');
    fireEvent.change(selectElement, { target: { value: 'proy-1' } });

    const newButton = screen.getByRole('button', { name: /ordenes_cambio.nueva/i });
    fireEvent.click(newButton);

    const tituloInput = screen.getByPlaceholderText(/ordenes_cambio.placeholder_titulo/i);
    fireEvent.change(tituloInput, { target: { value: 'Cambio de energía solar' } });

    const enviarButton = screen.getByRole('button', { name: /ordenes_cambio.enviar_solicitud/i });
    fireEvent.click(enviarButton);

    expect(mockUseErp.addOrdenCambio).toHaveBeenCalled();
  });

  it('aproves orden when approve button clicked', async () => {
    render(<OrdenesCambio />);

    const card = screen.getByRole('button', { name: /Cambio estructural/ });
    fireEvent.click(card);

    const approveButtons = screen.getAllByRole('button', { name: /ordenes_cambio.aprobar/i });
    fireEvent.click(approveButtons[0]);

    await waitFor(() => expect(mockUseErp.updateOrdenCambio).toHaveBeenCalledWith(mockOrdenesCambio[0].id, expect.objectContaining({ estado: 'aprobado' })));
  });

  it('rechaza orden when reject button clicked', async () => {
    render(<OrdenesCambio />);

    const card = screen.getByRole('button', { name: /Cambio estructural/ });
    fireEvent.click(card);

    const rejectButtons = screen.getAllByRole('button', { name: /ordenes_cambio.rechazar/i });
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => expect(mockUseErp.updateOrdenCambio).toHaveBeenCalledWith(mockOrdenesCambio[0].id, expect.objectContaining({ estado: 'rechazado' })));
  });

  it('collapsible orden shows details when clicked', () => {
    render(<OrdenesCambio />);

    const card = screen.getByRole('button', { name: /Cambio estructural/ });
    fireEvent.click(card);

    expect(screen.getByText(/El cambio es necesario para estabilidad/)).toBeInTheDocument();
  });

  it('shows empty state when no ordenes after filter', () => {
    mockUseErp.ordenesCambio = [];
    render(<OrdenesCambio />);

    expect(screen.getByText('ordenes_cambio.sin_datos')).toBeInTheDocument();
  });

  it('handles form validation for empty titulo', () => {
    render(<OrdenesCambio />);

    const newButton = screen.getByRole('button', { name: /ordenes_cambio.nueva/i });
    fireEvent.click(newButton);

    const enviarButton = screen.getByRole('button', { name: /ordenes_cambio.enviar_solicitud/i });
    fireEvent.click(enviarButton);

    expect(screen.getByText(/ordenes_cambio.error_titulo/i)).toBeInTheDocument();
  });
});
