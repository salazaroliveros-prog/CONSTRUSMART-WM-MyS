import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import Seguimiento from '../erp/screens/Seguimiento';

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', cliente: 'Cliente A', tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ', estado: 'planificacion', avanceFisico: 0, avanceFinanciero: 0, presupuestoTotal: 500000, montoContrato: 480000 },
];

const mockMovimientos = [
  { id: 'mov-1', proyectoId: 'proy-1', tipo: 'ingreso', monto: 100000, fecha: '2024-01-10' },
];

const mockUseErp = {
  proyectos: mockProyectos,
  movimientos: mockMovimientos,
  bitacora: [],
  hitos: [],
  riesgos: [],
  currentProjectId: 'proy-1',
  setCurrentProjectId: vi.fn(),
  proyectoWeather: [],
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

vi.mock('../erp/ui', () => ({
  BUTTON_PRIMARY: 'flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-md',
  BUTTON_SECONDARY: 'px-4 py-2 border rounded-md',
  INPUT: 'w-full px-3 py-2 border rounded-md',
}));

vi.mock('../components/shared', () => ({
  ProyectoSelector: ({ proyectos, currentProyectoId, onProyectoChange }: any) => (
    <select value={currentProyectoId} onChange={(e) => onProyectoChange(e.target.value)} data-testid="proyecto-selector">
      {proyectos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  ),
  TableWithRowActions: ({ data, columns, emptyState }: any) => (
    <div data-testid="seguimiento-table">
      {data.length === 0 && <div>{emptyState?.title || 'empty'}</div>}
      {data.length > 0 && <div data-testid="table-rows">{data.length} rows</div>}
    </div>
  ),
}));

vi.mock('../components/seguimiento', () => ({
  SeguimientoStatusBar: () => <div data-testid="status-bar">StatusBar</div>,
  SeguimientoAnalysisPanel: () => <div data-testid="analysis-panel">AnalysisPanel</div>,
  SeguimientoTabBar: ({ activeTab, onChange }: any) => (
    <div data-testid="tab-bar">
      <button onClick={() => onChange('analysis')}>analysis</button>
      <button onClick={() => onChange('bitacora')}>bitacora</button>
      <button onClick={() => onChange('cronograma')}>cronograma</button>
      <button onClick={() => onChange('riesgos')}>riesgos</button>
    </div>
  ),
  SeguimientoBitacoraPanel: () => <div data-testid="bitacora-panel">BitacoraPanel</div>,
  SeguimientoCronogramaPanel: () => <div data-testid="cronograma-panel">CronogramaPanel</div>,
  SeguimientoRiesgosPanel: () => <div data-testid="riesgos-panel">RiesgosPanel</div>,
}));

vi.mock('../components/Charts', () => ({
  Progress: ({ value }: any) => <div data-testid="progress">{value}%</div>,
}));

describe('Seguimiento', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.movimientos = [...mockMovimientos];
    mockUseErp.bitacora = [];
    mockUseErp.hitos = [];
    mockUseErp.riesgos = [];
    mockUseErp.currentProjectId = 'proy-1';
    mockUseErp.setCurrentProjectId = vi.fn();
    mockUseErp.proyectoWeather = [];
  });

  it('renders the seguimiento title', () => {
    render(<Seguimiento />);
    expect(screen.getByRole('heading', { name: /seguimiento.titulo_completo/i })).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<Seguimiento />);
    expect(screen.getByText('seguimiento.descripcion')).toBeInTheDocument();
  });

  it('renders without crashing when proyectos exist', () => {
    render(<Seguimiento />);
    const projectTexts = screen.getAllByText('Residencial Aurora');
    expect(projectTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders empty state when no proyectos', () => {
    mockUseErp.proyectos = [];
    mockUseErp.currentProjectId = '';
    render(<Seguimiento />);
    expect(screen.getByText('Sin proyectos para seguimiento')).toBeInTheDocument();
  });
});
