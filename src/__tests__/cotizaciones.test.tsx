import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import Cotizaciones from '../erp/screens/Cotizaciones';

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', cliente: 'Cliente A', tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ' },
  { id: 'proy-2', nombre: 'Torre Comercial', cliente: 'Cliente B', tipologia: 'comercial', tipoObra: 'remodelacion', moneda: 'USD' },
];

const mockCotizaciones = [
  {
    id: 'cot-1',
    proyectoId: 'proy-1',
    tipo: 'construccion' as const,
    numero: 'COT-1-2024',
    fecha: '2024-01-10',
    fechaVencimiento: '2024-02-10',
    clienteNombre: 'Constructora Aurora',
    clienteNit: '1234567-8',
    clienteTelefono: '555-0101',
    clienteEmail: 'contacto@aurora.com',
    clienteDireccion: 'Zona 10',
    descripcion: 'Casa de 2 niveles',
    alcance: 'Obra nueva completa',
    renglones: [],
    costoDirectoTotal: 100000,
    precioVentaTotal: 130000,
    estado: 'borrador' as const,
    notas: '',
    createdAt: '2024-01-10T09:00:00Z',
  },
  {
    id: 'cot-2',
    proyectoId: 'proy-2',
    tipo: 'planos_registro' as const,
    numero: 'COT-2-2024',
    fecha: '2024-01-15',
    fechaVencimiento: '',
    clienteNombre: 'Inversiones Torre',
    clienteNit: '',
    clienteTelefono: '',
    clienteEmail: 'ventas@torre.com',
    clienteDireccion: '',
    descripcion: 'Planos de registro',
    alcance: '',
    renglones: [],
    costoDirectoTotal: 50000,
    precioVentaTotal: 75000,
    estado: 'aprobada' as const,
    notas: '',
    createdAt: '2024-01-15T10:00:00Z',
  },
];

const mockUseErp = {
  proyectos: mockProyectos,
  user: {
    nombre: 'Usuario Test',
    rol: 'Administrador',
  },
  cotizacionesNegocio: mockCotizaciones,
  addCotizacion: vi.fn(),
  updateCotizacion: vi.fn(),
  deleteCotizacion: vi.fn(),
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
  canUserDelete: () => true,
  sanitizarObjeto: (o: unknown) => o,
}));

vi.mock('../erp/export', () => ({
  exportCotizacionPDF: vi.fn(),
}));

vi.mock('../erp/ui', () => ({
  BUTTON_PRIMARY: 'flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-md',
  BUTTON_SECONDARY: 'px-4 py-2 border rounded-md',
  INPUT: 'w-full px-3 py-2 border rounded-md',
  MODAL_OVERLAY: 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center',
  MODAL_PANEL: 'bg-white rounded-xl shadow-xl',
  MODAL_HEADER: 'flex items-center justify-between p-4 border-b',
  MODAL_TITLE: 'text-lg font-bold',
  MODAL_CLOSE: 'p-2 rounded-md hover:bg-muted',
  COLOR_DANGER: 'text-red-600',
}));

vi.mock('../erp/components/ProyectoFilter', () => ({
  default: ({ value, onChange, proyectos }: any) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Todos los proyectos</option>
      {proyectos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  ),
}));

describe('Cotizaciones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.cotizacionesNegocio = [...mockCotizaciones];
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
  });

  it('renders the cotizaciones title', () => {
    render(<Cotizaciones />);
    expect(screen.getByRole('heading', { name: 'cotizaciones.titulo' })).toBeInTheDocument();
  });

  it('renders the cotizaciones list with client names', () => {
    render(<Cotizaciones />);
    expect(screen.getByText('Constructora Aurora')).toBeInTheDocument();
    expect(screen.getByText('Inversiones Torre')).toBeInTheDocument();
    expect(screen.getByText('COT-1-2024')).toBeInTheDocument();
    expect(screen.getByText('COT-2-2024')).toBeInTheDocument();
  });

  it('renders KPI summary values', () => {
    render(<Cotizaciones />);
    expect(screen.getByText('cotizaciones.total')).toBeInTheDocument();
    expect(screen.getByText('cotizaciones.enviadas')).toBeInTheDocument();
    expect(screen.getByText('cotizaciones.aprobadas')).toBeInTheDocument();
    expect(screen.getByText('cotizaciones.monto_aprobado')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows status badges for cotizaciones', () => {
    render(<Cotizaciones />);
    expect(screen.getByText('Borrador')).toBeInTheDocument();
    expect(screen.getByText('Aprobada')).toBeInTheDocument();
  });

  it('opens the creation form when nueva button is clicked', () => {
    render(<Cotizaciones />);
    const newButton = screen.getByRole('button', { name: /cotizaciones.nueva/i });
    fireEvent.click(newButton);
    expect(screen.getByPlaceholderText(/cotizaciones.placeholder_numero/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/common.nombre/i)).toBeInTheDocument();
  });

  it('handles form submission for a new cotizacion', () => {
    render(<Cotizaciones />);
    const newButton = screen.getByRole('button', { name: /cotizaciones.nueva/i });
    fireEvent.click(newButton);

    const nombreInput = screen.getByPlaceholderText(/common.nombre/i);
    fireEvent.change(nombreInput, { target: { value: 'Nueva Constructora' } });

    const crearButton = screen.getByRole('button', { name: /cotizaciones.crear/i });
    fireEvent.click(crearButton);

    expect(mockUseErp.addCotizacion).toHaveBeenCalled();
  });

  it('show validation error when form submitted without cliente nombre', () => {
    render(<Cotizaciones />);
    const newButton = screen.getByRole('button', { name: /cotizaciones.nueva/i });
    fireEvent.click(newButton);

    const crearButton = screen.getByRole('button', { name: /cotizaciones.crear/i });
    fireEvent.click(crearButton);

    expect(screen.getByText(/Nombre requerido/i)).toBeInTheDocument();
  });

  it('opens edit form when editar button is clicked', () => {
    render(<Cotizaciones />);
    const editButtons = screen.getAllByRole('button', { name: /common.editar/i });
    fireEvent.click(editButtons[0]);
    expect(screen.getByDisplayValue('Constructora Aurora')).toBeInTheDocument();
    expect(screen.getByDisplayValue('COT-1-2024')).toBeInTheDocument();
  });

  it('handles update when editing an existing cotizacion', () => {
    render(<Cotizaciones />);
    const editButtons = screen.getAllByRole('button', { name: /common.editar/i });
    fireEvent.click(editButtons[0]);

    const nombreInput = screen.getByDisplayValue('Constructora Aurora');
    fireEvent.change(nombreInput, { target: { value: 'Constructora Editada' } });

    const actualizarButton = screen.getByRole('button', { name: /common.editar/i });
    fireEvent.click(actualizarButton);

    expect(mockUseErp.updateCotizacion).toHaveBeenCalledWith('cot-1', expect.objectContaining({ clienteNombre: 'Constructora Editada' }));
  });

  it('marks cotizacion as enviada when enviar_cliente button clicked', () => {
    render(<Cotizaciones />);
    const enviarButtons = screen.getAllByRole('button', { name: /cotizaciones.enviar_cliente/i });
    fireEvent.click(enviarButtons[0]);
    expect(mockUseErp.updateCotizacion).toHaveBeenCalledWith('cot-1', expect.objectContaining({ estado: 'enviada' }));
  });

  it('duplicates a cotizacion when duplicar button clicked', () => {
    render(<Cotizaciones />);
    const duplicarButtons = screen.getAllByRole('button', { name: /cotizaciones.duplicar/i });
    fireEvent.click(duplicarButtons[0]);
    expect(mockUseErp.addCotizacion).toHaveBeenCalled();
  });

  it('deletes cotizacion when eliminar button clicked and confirmed', async () => {
    render(<Cotizaciones />);
    const eliminarButtons = screen.getAllByRole('button', { name: /cotizaciones.eliminar/i });
    fireEvent.click(eliminarButtons[0]);
    await waitFor(() => expect(mockUseErp.deleteCotizacion).toHaveBeenCalledWith('cot-1'));
  });

  it('exports PDF when exportar_pdf button clicked', async () => {
    render(<Cotizaciones />);
    const exportButtons = screen.getAllByRole('button', { name: /cotizaciones.exportar_pdf/i });
    fireEvent.click(exportButtons[0]);
    const exportModule = await import('../erp/export');
    expect(exportModule.exportCotizacionPDF).toHaveBeenCalled();
  });

  it('opens the calculadora modal when motor_calculo button clicked', () => {
    render(<Cotizaciones />);
    const newButton = screen.getByRole('button', { name: /cotizaciones.nueva/i });
    fireEvent.click(newButton);
    const calculadoraButton = screen.getByRole('button', { name: /cotizaciones.motor_calculo/i });
    fireEvent.click(calculadoraButton);
    expect(screen.getByRole('dialog', { name: /cotizaciones.calculadora/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cotizaciones.pavimentos/i })).toBeInTheDocument();
  });

  it('shows empty state when there are no cotizaciones', () => {
    mockUseErp.cotizacionesNegocio = [];
    render(<Cotizaciones />);
    expect(screen.getByText('cotizaciones.sin_cotizaciones')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cotizaciones.crear_primera/i })).toBeInTheDocument();
  });
});
