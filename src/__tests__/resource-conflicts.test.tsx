import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ResourceConflicts from '../erp/screens/ResourceConflicts';
import type { ResourceConflict, ResolutionSuggestion } from '../erp/types/conflicts';

const { mockDetectAllConflicts, mockGenerateSuggestions, mockApplyResolution, mockCalculateResolutionImpact, mockFmtQ, mockFmtPct } = vi.hoisted(() => ({
  mockDetectAllConflicts: vi.fn(),
  mockGenerateSuggestions: vi.fn(),
  mockApplyResolution: vi.fn(),
  mockCalculateResolutionImpact: vi.fn(),
  mockFmtQ: vi.fn((n: number) => `Q ${(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}`),
  mockFmtPct: vi.fn((n: number) => `${(n || 0).toFixed(1)}%`),
}));

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', estado: 'ejecucion', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', presupuestoTotal: 500000, montoContrato: 450000, avanceFisico: 60, cliente: 'Cliente A', tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ' },
  { id: 'proy-2', nombre: 'Torre Comercial', estado: 'ejecucion', fechaInicio: '2026-03-01', fechaFin: '2026-09-30', presupuestoTotal: 1200000, montoContrato: 1100000, avanceFisico: 40, cliente: 'Cliente B', tipologia: 'comercial', tipoObra: 'nueva', moneda: 'GTQ' },
  { id: 'proy-3', nombre: 'Puente Vehicular', estado: 'planeacion', fechaInicio: '2026-06-01', fechaFin: '2027-03-31', presupuestoTotal: 800000, montoContrato: 750000, avanceFisico: 5, cliente: 'Cliente C', tipologia: 'civil', tipoObra: 'nueva', moneda: 'GTQ' },
];

const mockEmpleados = [
  { id: 'emp-1', nombre: 'Carlos López', puesto: 'Ingeniero', salarioDiario: 500, tipo: 'permanente', activo: true, proyectoIds: ['proy-1', 'proy-2'] },
  { id: 'emp-2', nombre: 'Ana Martínez', puesto: 'Arquitecta', salarioDiario: 450, tipo: 'permanente', activo: true, proyectoIds: ['proy-2', 'proy-3'] },
  { id: 'emp-3', nombre: 'Pedro Ramírez', puesto: 'Supervisor', salarioDiario: 350, tipo: 'permanente', activo: true, proyectoIds: ['proy-1'] },
];

const mockMateriales = [
  { id: 'mat-1', nombre: 'Cemento', unidad: 'saco', stock: 100, stockMinimo: 50, precio: 85, precioUnitario: 85, categoria: 'materiales', critico: true, activo: true },
  { id: 'mat-2', nombre: 'Varilla', unidad: 'quintal', stock: 300, stockMinimo: 100, precio: 350, precioUnitario: 350, categoria: 'materiales', critico: false, activo: true },
];

const mockActivos = [
  { id: 'act-1', nombre: 'Excavadora CAT', activo: true, proyectoIds: ['proy-1'], valorAdquisicion: 500000 },
  { id: 'act-2', nombre: 'Grúa Torre', activo: true, proyectoIds: ['proy-2'], valorAdquisicion: 800000 },
];

const mockHitos = [
  { id: 'hito-1', proyectoId: 'proy-1', nombre: 'Cimentación', fecha: '2026-11-01', estado: 'pendiente' },
  { id: 'hito-2', proyectoId: 'proy-1', nombre: 'Estructura', fecha: '2025-12-01', estado: 'pendiente' },
  { id: 'hito-3', proyectoId: 'proy-2', nombre: 'Fachada', fecha: '2026-08-15', estado: 'completado' },
];

const mockOrdenes = [
  { id: 'ord-1', proyectoId: 'proy-1', materialId: 'mat-1', cantidad: 200, estado: 'pendiente', proveedor: 'Prov A', material: 'Cemento', monto: 17000 },
  { id: 'ord-2', proyectoId: 'proy-2', materialId: 'mat-1', cantidad: 300, estado: 'aprobado', proveedor: 'Prov B', material: 'Cemento', monto: 25500 },
];

const mockConflicts: ResourceConflict[] = [
  {
    id: 'conflict-1',
    tipo: 'empleado',
    severidad: 'alto',
    estado: 'detectado',
    titulo: 'Empleado asignado a múltiples proyectos simultáneos',
    descripcion: 'Carlos López está asignado a 2 proyectos con fechas superpuestas',
    recursoId: 'emp-1',
    recursoNombre: 'Carlos López',
    proyectos: [
      { proyectoId: 'proy-1', proyectoNombre: 'Residencial Aurora', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', porcentajeUso: 50, prioridad: 3 },
      { proyectoId: 'proy-2', proyectoNombre: 'Torre Comercial', fechaInicio: '2026-03-01', fechaFin: '2026-09-30', porcentajeUso: 50, prioridad: 2 },
    ],
    fechaDeteccion: '2026-07-19T00:00:00.000Z',
    impactoCosto: 15000,
    impactoPlazo: 6,
  },
  {
    id: 'conflict-2',
    tipo: 'material',
    severidad: 'critico',
    estado: 'detectado',
    titulo: 'Stock insuficiente para material crítico',
    descripcion: 'Cemento: Se requieren 500 unidades, solo 100 disponibles',
    recursoId: 'mat-1',
    recursoNombre: 'Cemento',
    proyectos: [
      { proyectoId: 'proy-1', proyectoNombre: 'Residencial Aurora', fechaInicio: '2026-01-01', fechaFin: '2026-12-31', porcentajeUso: 40, prioridad: 3 },
      { proyectoId: 'proy-2', proyectoNombre: 'Torre Comercial', fechaInicio: '2026-03-01', fechaFin: '2026-09-30', porcentajeUso: 60, prioridad: 2 },
    ],
    fechaDeteccion: '2026-07-19T00:00:00.000Z',
    impactoCosto: 80000,
    impactoPlazo: 14,
  },
];

const mockSuggestions: ResolutionSuggestion[] = [
  {
    id: 'sug-1',
    conflictoId: 'conflict-1',
    tipo: 'reasignar',
    titulo: 'Mantener en proyecto prioritario',
    descripcion: 'Asignar Carlos López exclusivamente a Residencial Aurora y buscar reemplazo para Torre Comercial',
    ventajas: ['Maximiza eficiencia en proyecto crítico', 'Elimina conflicto de schedule', 'Mantiene especialización del empleado'],
    desventajas: ['Requiere contratar personal adicional', 'Puede aumentar costos temporales', 'Necesita periodo de capacitación'],
    costoEstimado: 12000,
    impactoPlazo: 7,
    probabilidadExito: 85,
    esfuerzoImplementacion: 'medio',
  },
  {
    id: 'sug-2',
    conflictoId: 'conflict-1',
    tipo: 'reprogramar',
    titulo: 'Programar por turnos',
    descripcion: 'Establecer turnos escalonados para atender múltiples proyectos sin superposición',
    ventajas: ['Mantiene empleado en todos los proyectos', 'No requiere contratación adicional', 'Optimiza utilización de recurso'],
    desventajas: ['Reduce disponibilidad por proyecto', 'Puede extender plazos', 'Requiere coordinación compleja'],
    costoEstimado: 3000,
    impactoPlazo: 3,
    probabilidadExito: 70,
    esfuerzoImplementacion: 'bajo',
  },
];

const mockUseErp = {
  empleados: mockEmpleados,
  materiales: mockMateriales,
  activos: mockActivos,
  proyectos: mockProyectos,
  hitos: mockHitos,
  ordenes: mockOrdenes,
};

const mockT = (key: string) => key;

vi.mock('../erp/store', () => ({
  useErp: () => mockUseErp,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('../erp/services/conflictDetection', () => ({
  conflictDetectionService: {
    detectAllConflicts: mockDetectAllConflicts,
  },
}));

vi.mock('../erp/services/conflictResolution', () => ({
  conflictResolutionService: {
    generateSuggestions: mockGenerateSuggestions,
    applyResolution: mockApplyResolution,
    calculateResolutionImpact: mockCalculateResolutionImpact,
  },
}));

vi.mock('../erp/ui', () => ({
  CARD: 'bg-card rounded-xl border border-border/40',
  SECTION_TITLE: 'text-lg sm:text-xl font-black text-foreground mb-3 flex items-center gap-2',
  BUTTON_PRIMARY: 'bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold',
  BUTTON_SECONDARY: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium',
  BUTTON_ICON: 'text-muted-foreground hover:text-foreground p-1.5 rounded-md',
  COLOR_PRIMARY: 'text-primary',
}));

vi.mock('../erp/utils', () => ({
  fmtQ: mockFmtQ,
  fmtPct: mockFmtPct,
}));

vi.mock('@/lib/safeLogger', () => ({
  safeLogger: { error: vi.fn() },
}));

describe('ResourceConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUseErp.empleados = [...mockEmpleados];
    mockUseErp.materiales = [...mockMateriales];
    mockUseErp.activos = [...mockActivos];
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.hitos = [...mockHitos];
    mockUseErp.ordenes = [...mockOrdenes];
    mockDetectAllConflicts.mockReturnValue(mockConflicts);
    mockGenerateSuggestions.mockReturnValue(mockSuggestions);
    mockApplyResolution.mockReturnValue({
      tipo: 'reasignar',
      descripcion: 'Asignar Carlos López exclusivamente a Residencial Aurora',
      costoEstimado: 12000,
      impactoPlazo: 7,
      responsable: 'Usuario actual',
      fechaImplementacion: '2026-07-19T00:00:00.000Z',
    });
    mockCalculateResolutionImpact.mockReturnValue({ costoSavings: 3000, plazoReduction: 3 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders title and description after loading', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('conflicts.title')).toBeInTheDocument();
    expect(screen.getByText('conflicts.description')).toBeInTheDocument();
  });

  it('shows loading skeleton initially (uses 500ms timer)', () => {
    render(<ResourceConflicts />);
    expect(screen.queryByText('conflicts.total_conflicts')).not.toBeInTheDocument();
  });

  it('shows 4 KPI cards after loading', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('conflicts.total_conflicts')).toBeInTheDocument();
    expect(screen.getByText('conflicts.critical_conflicts')).toBeInTheDocument();
    expect(screen.getByText('conflicts.cost_impact')).toBeInTheDocument();
    expect(screen.getByText('conflicts.schedule_impact')).toBeInTheDocument();
  });

  it('shows correct KPI values from mock conflicts', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls detectAllConflicts on mount with all entities', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(mockDetectAllConflicts).toHaveBeenCalledWith(
      mockEmpleados,
      mockMateriales,
      mockActivos,
      mockProyectos,
      mockHitos,
      mockOrdenes,
    );
  });

  it('shows empty state when no conflicts detected', () => {
    mockDetectAllConflicts.mockReturnValue([]);
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('conflicts.no_conflicts')).toBeInTheDocument();
  });

  it('renders conflict list with data from detection service', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
    expect(screen.getByText('Cemento')).toBeInTheDocument();
    expect(screen.getByText('Alto')).toBeInTheDocument();
    expect(screen.getByText('Critico')).toBeInTheDocument();
  });

  it('filters by severity', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    const severitySelect = screen.getByLabelText('conflicts.filter_severity');
    fireEvent.change(severitySelect, { target: { value: 'critico' } });
    expect(screen.getByText('Cemento')).toBeInTheDocument();
    expect(screen.queryByText('Carlos López')).not.toBeInTheDocument();
  });

  it('filters by type', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    const typeSelect = screen.getByLabelText('conflicts.filter_type');
    fireEvent.change(typeSelect, { target: { value: 'material' } });
    expect(screen.getByText('Cemento')).toBeInTheDocument();
    expect(screen.queryByText('Carlos López')).not.toBeInTheDocument();
  });

  it('filters by status', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    const statusSelect = screen.getByLabelText('conflicts.filter_status');
    fireEvent.change(statusSelect, { target: { value: 'resuelto' } });
    expect(screen.queryByText('Carlos López')).not.toBeInTheDocument();
    expect(screen.queryByText('Cemento')).not.toBeInTheDocument();
    expect(screen.getByText('conflicts.no_conflicts')).toBeInTheDocument();
  });

  it('toggles showDetails (Eye EyeOff button)', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getAllByText('conflicts.affected_projects').length).toBeGreaterThanOrEqual(1);
    const toggleBtn = screen.getByLabelText('conflicts.hide_details');
    fireEvent.click(toggleBtn);
    expect(screen.queryByText('conflicts.affected_projects')).not.toBeInTheDocument();
    const showBtn = screen.getByLabelText('conflicts.show_details');
    fireEvent.click(showBtn);
    expect(screen.getAllByText('conflicts.affected_projects').length).toBeGreaterThanOrEqual(1);
  });

  it('opens suggestions modal when clicking lightbulb button', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    const lightbulbButtons = screen.getAllByLabelText('conflicts.view_solutions');
    fireEvent.click(lightbulbButtons[0]);
    expect(screen.getByText('conflicts.resolution_suggestions')).toBeInTheDocument();
    expect(mockGenerateSuggestions).toHaveBeenCalledWith(mockConflicts[0]);
  });

  it('shows resolution suggestions in modal', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    const lightbulbButtons = screen.getAllByLabelText('conflicts.view_solutions');
    fireEvent.click(lightbulbButtons[0]);
    expect(screen.getByText('Mantener en proyecto prioritario')).toBeInTheDocument();
    expect(screen.getByText('Programar por turnos')).toBeInTheDocument();
  });

  it('applies resolution from suggestion', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    const lightbulbButtons = screen.getAllByLabelText('conflicts.view_solutions');
    fireEvent.click(lightbulbButtons[0]);
    const applyButtons = screen.getAllByText('conflicts.apply_solution');
    fireEvent.click(applyButtons[0]);
    expect(mockApplyResolution).toHaveBeenCalledWith(
      mockConflicts[0],
      mockSuggestions[0],
      'Usuario actual',
    );
    expect(mockCalculateResolutionImpact).toHaveBeenCalled();
    expect(screen.queryByText('conflicts.resolution_suggestions')).not.toBeInTheDocument();
  });

  it('refresh button triggers re-detection', async () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    mockDetectAllConflicts.mockClear();
    const refreshBtn = screen.getByLabelText('conflicts.refresh');
    fireEvent.click(refreshBtn);
    vi.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(mockDetectAllConflicts).toHaveBeenCalled();
  });

  it('closes suggestions modal with X button', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    const lightbulbButtons = screen.getAllByLabelText('conflicts.view_solutions');
    fireEvent.click(lightbulbButtons[0]);
    expect(screen.getByText('conflicts.resolution_suggestions')).toBeInTheDocument();
    const closeBtn = screen.getByLabelText('conflicts.close');
    fireEvent.click(closeBtn);
    expect(screen.queryByText('conflicts.resolution_suggestions')).not.toBeInTheDocument();
  });

  it('shows success probability in suggestions', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    const lightbulbButtons = screen.getAllByLabelText('conflicts.view_solutions');
    fireEvent.click(lightbulbButtons[0]);
    const elements = screen.getAllByText('conflicts.success_probability:');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows advantages and disadvantages in suggestions', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    const lightbulbButtons = screen.getAllByLabelText('conflicts.view_solutions');
    fireEvent.click(lightbulbButtons[0]);
    const advantages = screen.getAllByText('conflicts.advantages:');
    expect(advantages.length).toBeGreaterThanOrEqual(1);
    const disadvantages = screen.getAllByText('conflicts.disadvantages:');
    expect(disadvantages.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Maximiza eficiencia en proyecto crítico')).toBeInTheDocument();
  });

  it('shows severity badge colors by type', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Alto')).toBeInTheDocument();
    expect(screen.getByText('Critico')).toBeInTheDocument();
  });

  it('handles null undefined empleados gracefully', () => {
    mockUseErp.empleados = undefined as unknown as typeof mockEmpleados;
    mockDetectAllConflicts.mockReturnValue([]);
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('conflicts.no_conflicts')).toBeInTheDocument();
  });

  it('handles null undefined materiales gracefully', () => {
    mockUseErp.materiales = undefined as unknown as typeof mockMateriales;
    mockDetectAllConflicts.mockReturnValue([]);
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('conflicts.no_conflicts')).toBeInTheDocument();
  });

  it('shows cost impact KPI with formatted value', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(mockFmtQ).toHaveBeenCalledWith(95000);
  });

  it('shows schedule impact KPI in days', () => {
    render(<ResourceConflicts />);
    act(() => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('20 días')).toBeInTheDocument();
  });
});
