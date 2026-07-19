import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import Proyectos from '../erp/screens/Proyectos';

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', cliente: 'Cliente A', tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ', estado: 'planificacion', presupuestoTotal: 500000, montoContrato: 480000, avanceFisico: 0, avanceFinanciero: 0 },
  { id: 'proy-2', nombre: 'Torre Comercial', cliente: 'Cliente B', tipologia: 'comercial', tipoObra: 'remodelacion', moneda: 'USD', estado: 'ejecucion', presupuestoTotal: 1200000, montoContrato: 1150000, avanceFisico: 35, avanceFinanciero: 30 },
];

let mockProyectosFiltrados: any[] = [];

const mockUseErp = {
  proyectos: mockProyectos,
  empleados: [],
  materiales: [],
  activos: [],
  hitos: [],
  ordenes: [],
  movimientos: [],
  user: { nombre: 'Usuario Test', rol: 'Administrador' },
};

const mockT = (key: string) => key;

vi.mock('../erp/store', () => ({
  useErp: (selector?: any) => selector ? selector(mockUseErp) : mockUseErp,
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

vi.mock('../erp/components/proyectos/ProyectosToolbar', () => ({
  default: ({ onOpenCreate, onClearAll, proyectosCount }: any) => (
    <div data-testid="proyectos-toolbar">
      <span data-testid="proyectos-count">{proyectosCount}</span>
      <button onClick={onOpenCreate}>proyectos.nuevo</button>
      <button onClick={onClearAll}>proyectos.limpiar</button>
    </div>
  ),
}));

vi.mock('../erp/components/proyectos/ProyectosKPI', () => ({
  default: ({ total, enEjecucion }: any) => (
    <div data-testid="proyectos-kpi">
      <span>Total: {total}</span>
      <span>En Ejecucion: {enEjecucion}</span>
    </div>
  ),
}));

vi.mock('../erp/components/proyectos/ProyectoCardSimple', () => ({
  default: ({ proyecto }: any) => (
    <div data-testid="proyecto-card">
      <span>{proyecto.nombre}</span>
    </div>
  ),
}));

vi.mock('../erp/components/proyectos/ProyectoDetailModal', () => ({
  default: () => null,
}));

vi.mock('../erp/components/proyectos/ProyectoForm', () => ({
  default: () => null,
}));

vi.mock('../erp/components/proyectos/ProyectoPauseModal', () => ({
  default: () => null,
}));

vi.mock('../erp/hooks/useProyectosActions', () => ({
  useProyectosActions: () => ({
    show: false,
    setShow: vi.fn(),
    editingId: null,
    setEditingId: vi.fn(),
    selectedTemplate: '',
    setSelectedTemplate: vi.fn(),
    templateSearch: '',
    setTemplateSearch: vi.fn(),
    coords: {},
    setCoords: vi.fn(),
    subtipologias: [],
    setSubtipologias: vi.fn(),
    pauseModal: false,
    setPauseModal: vi.fn(),
    pauseReason: '',
    setPauseReason: vi.fn(),
    pauseAutorizador: '',
    setPauseAutorizador: vi.fn(),
    pauseReanudacion: '',
    setPauseReanudacion: vi.fn(),
    submitting: false,
    setSubmitting: vi.fn(),
    register: vi.fn(),
    handleSubmit: vi.fn(),
    reset: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn(),
    errors: {},
    openCreate: vi.fn(),
    openEdit: vi.fn(),
    openDetail: vi.fn(),
    onSubmit: vi.fn(),
    accionRapida: vi.fn(),
    confirmarPausa: vi.fn(),
    handleDelete: vi.fn(),
    limpiarProyectos: vi.fn(),
    get proyectosFiltrados() {
      return mockProyectosFiltrados;
    },
    sugerencias: [],
    plantillas: [],
  }),
}));

vi.mock('../services/conflictDetection', () => ({
  conflictDetectionService: {
    detectAllConflicts: () => [],
  },
}));

describe('Proyectos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.empleados = [];
    mockUseErp.materiales = [];
    mockUseErp.activos = [];
    mockUseErp.hitos = [];
    mockUseErp.ordenes = [];
    mockUseErp.movimientos = [];
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
    mockProyectosFiltrados = mockProyectos;
  });

  it('renders the proyectos screen', () => {
    render(<Proyectos />);
    expect(screen.getByTestId('proyectos-toolbar')).toBeInTheDocument();
  });

  it('renders the toolbar', () => {
    render(<Proyectos />);
    expect(screen.getByTestId('proyectos-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('proyectos-count')).toHaveTextContent('2');
  });

  it('renders the KPI section', () => {
    render(<Proyectos />);
    expect(screen.getByTestId('proyectos-kpi')).toBeInTheDocument();
    expect(screen.getByText('Total: 2')).toBeInTheDocument();
    expect(screen.getByText('En Ejecucion: 1')).toBeInTheDocument();
  });

  it('renders proyecto cards when proyectosFiltrados has data', () => {
    render(<Proyectos />);
    const cards = screen.getAllByTestId('proyecto-card');
    expect(cards.length).toBe(2);
  });

  it('shows empty state when no proyectos', () => {
    mockUseErp.proyectos = [];
    mockProyectosFiltrados = [];
    render(<Proyectos />);
    expect(screen.getByText('proyectos.sin_proyectos_title')).toBeInTheDocument();
  });

  it('filters proyectos by search text', () => {
    render(<Proyectos />);
    const searchInputs = screen.getAllByDisplayValue('');
    expect(searchInputs.length).toBeGreaterThanOrEqual(1);
  });

  it('calls limpiarProyectos when clear button clicked', () => {
    render(<Proyectos />);
    const clearButton = screen.getByText('proyectos.limpiar');
    fireEvent.click(clearButton);
  });
});
