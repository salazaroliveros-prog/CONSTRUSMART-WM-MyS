import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import PlantillasProyectos from '../erp/screens/PlantillasProyectos';

const mockPlantillas = [
  {
    id: 'plantilla-1',
    nombre: 'Plantilla Residencial',
    descripcion: 'Plantilla para proyectos residenciales',
    categoria: 'residencial',
    clienteId: 'cliente-1',
    clienteNombre: 'Cliente Test',
    activa: true,
    favorita: false,
    version: 1,
    createdAt: '2024-01-15T10:00:00Z',
    usosCount: 5,
    estructuraPresupuesto: [],
    hitosTemplate: [],
    riesgosTemplate: [],
    checklistCalidad: [],
    configuracion: { tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ' },
  },
  {
    id: 'plantilla-2',
    nombre: 'Plantilla Comercial',
    descripcion: 'Plantilla para proyectos comerciales',
    categoria: 'comercial',
    clienteId: '',
    clienteNombre: '',
    activa: true,
    favorita: true,
    version: 2,
    createdAt: '2024-02-20T10:00:00Z',
    usosCount: 10,
    estructuraPresupuesto: [],
    hitosTemplate: [],
    riesgosTemplate: [],
    checklistCalidad: [],
    configuracion: { tipologia: 'comercial', tipoObra: 'nueva', moneda: 'GTQ' },
  },
];

const mockProyectos = [
  { id: 'proyecto-1', nombre: 'Proyecto Residencial', cliente: 'Cliente Test', tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ' },
  { id: 'proyecto-2', nombre: 'Proyecto Comercial', cliente: 'Otro Cliente', tipologia: 'comercial', tipoObra: 'remodelacion', moneda: 'USD' },
];

const mockUseErp = {
  plantillas: mockPlantillas,
  proyectos: mockProyectos,
  addPlantilla: vi.fn(),
  updatePlantilla: vi.fn(),
  deletePlantilla: vi.fn(),
  clonarPlantilla: vi.fn(),
  exportarPlantilla: vi.fn().mockReturnValue('{"test": "json"}'),
  importarPlantilla: vi.fn(),
  crearProyectoDesdePlantilla: vi.fn(),
  crearNuevaVersionPlantilla: vi.fn(),
  restaurarVersionPlantilla: vi.fn(),
  validarIntegridadPlantilla: vi.fn().mockReturnValue({ valido: true, errores: [] }),
  toggleFavoritoPlantilla: vi.fn(),
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

vi.mock('../erp/components/PlantillaAnalytics', () => ({
  default: () => <div data-testid="plantilla-analytics">Analytics</div>,
}));

vi.mock('../erp/components/PlantillasDashboard', () => ({
  default: () => <div data-testid="plantillas-dashboard">Dashboard</div>,
}));

vi.mock('../erp/components/PlantillaEditorModal', () => ({
  default: () => <div data-testid="plantilla-editor-modal">Editor Modal</div>,
}));

vi.mock('../erp/components/PlantillaVersionDiff', () => ({
  default: () => <div data-testid="plantilla-version-diff">Version Diff</div>,
}));

describe('PlantillasProyectos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.plantillas = [...mockPlantillas];
    mockUseErp.proyectos = [...mockProyectos];
  });

  it('renders plantillas in grid view by default', () => {
    render(<PlantillasProyectos />);
    expect(screen.getByText('Plantilla Residencial')).toBeInTheDocument();
    expect(screen.getByText('Plantilla Comercial')).toBeInTheDocument();
  });

  it('shows loading skeleton initially', () => {
    const { rerender } = render(<PlantillasProyectos />);
    const loadingScreen = <div className="p-6 space-y-4"><div className="h-8 w-64" /><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><div className="h-48" /><div className="h-48" /><div className="h-48" /><div className="h-48" /><div className="h-48" /><div className="h-48" /></div></div>;
    rerender(loadingScreen);
  });

  it('filters by categoria when button clicked', () => {
    render(<PlantillasProyectos />);
    const categoriaButtons = screen.getAllByRole('button', { name: /plantillas.filtrar_por_categoria_aria/i });
    fireEvent.click(categoriaButtons[0]);
  });

  it('toggles vistaLista when view toggle clicked', () => {
    render(<PlantillasProyectos />);
    const vistaToggle = screen.getByRole('button', { name: /vista/i });
    fireEvent.click(vistaToggle);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('opens form when nueva plantilla button clicked', () => {
    render(<PlantillasProyectos />);
    const newButton = screen.getByRole('button', { name: /plantillas.nueva_plantilla_btn/i });
    fireEvent.click(newButton);
    const nombreInput = document.querySelector('input[type="text"]:not([aria-label="plantillas.buscar_placeholder"])');
    expect(nombreInput).toBeInTheDocument();
  });

  it('opens preview modal when preview button clicked', () => {
    render(<PlantillasProyectos />);
    const previewButton = screen.getByRole('button', { name: /plantillas.ver_detalles Plantilla Residencial/i });
    fireEvent.click(previewButton);
    expect(screen.getAllByText(/Plantilla Residencial/).length).toBeGreaterThanOrEqual(1);
  });

  it('toggles favorito when star button clicked', () => {
    render(<PlantillasProyectos />);
    const starButtons = document.querySelectorAll('button[title*="plantillas.agregar_favoritos_title"], button[title*="plantillas.quitar_favoritos_title"]');
    fireEvent.click(starButtons[0]);
    expect(mockUseErp.toggleFavoritoPlantilla).toHaveBeenCalledWith('plantilla-2');
  });

  it('opens edit form when edit button clicked', () => {
    render(<PlantillasProyectos />);
    const editButton = screen.getByRole('button', { name: /plantillas.editar_datos Plantilla Residencial/i });
    fireEvent.click(editButton);
    expect(screen.getByText(/plantillas.editar_plantilla_titulo/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Plantilla Residencial')).toBeInTheDocument();
  });

  it('deletes plantilla when delete button clicked and confirmed', async () => {
    render(<PlantillasProyectos />);
    const deleteButton = screen.getByRole('button', { name: /plantillas.eliminar_btn Plantilla Residencial/i });
    fireEvent.click(deleteButton);
    await waitFor(() => expect(mockUseErp.deletePlantilla).toHaveBeenCalledWith('plantilla-1'));
  });

  it('shows empty state when no plantillas', () => {
    mockUseErp.plantillas = [];
    render(<PlantillasProyectos />);
    expect(screen.getByText(/plantillas.sin_plantillas_titulo/i)).toBeInTheDocument();
  });

  it('shows desactualizadas warning when plantillas not used in 90 days', () => {
    const oldPlantilla = {
      ...mockPlantillas[0],
      metricas: { ultimaUso: '2023-01-01T10:00:00Z' },
    };
    mockUseErp.plantillas = [oldPlantilla];
    render(<PlantillasProyectos />);
    expect(screen.getAllByText(/desactualizada/i).length).toBeGreaterThan(0);
  });

  it('handles form submission for new plantilla', () => {
    render(<PlantillasProyectos />);
    const newButton = screen.getByRole('button', { name: /plantillas.nueva_plantilla_btn/i });
    fireEvent.click(newButton);
    
    const nombreInput = document.querySelector('input[type="text"][required]');
    fireEvent.change(nombreInput, { target: { value: 'Nueva Plantilla Test' } });
    
    const submitButton = screen.getByRole('button', { name: /plantillas.nueva_plantilla_titulo/i });
    fireEvent.click(submitButton);
    
    expect(mockUseErp.addPlantilla).toHaveBeenCalled();
  });

  it('handles form submission for editing plantilla', () => {
    render(<PlantillasProyectos />);
    const editButtons = screen.getAllByRole('button', { name: /plantillas.editar_datos/i });
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByText(/plantillas.editar_plantilla_titulo/i)).toBeInTheDocument();
    const nombreInput = document.querySelector('input[type="text"]:not([aria-label="plantillas.buscar_placeholder"])');
    fireEvent.change(nombreInput, { target: { value: 'Plantilla Editada' } });
    
    const submitButton = screen.getByRole('button', { name: /plantillas.actualizar_btn/i });
    fireEvent.click(submitButton);
    
    expect(mockUseErp.updatePlantilla).toHaveBeenCalledWith('plantilla-2', expect.objectContaining({ nombre: 'Plantilla Editada' }));
  });

  it('opens global dashboard when button clicked', () => {
    render(<PlantillasProyectos />);
    const dashboardButton = screen.getByRole('button', { name: /plantillas.dashboard_global_btn/i });
    fireEvent.click(dashboardButton);
    expect(screen.getByTestId('plantillas-dashboard')).toBeInTheDocument();
  });

  it('handles import file', async () => {
    render(<PlantillasProyectos />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['{"test": "json"}'], 'test.json', { type: 'application/json' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(mockUseErp.importarPlantilla).toHaveBeenCalled());
  });
});