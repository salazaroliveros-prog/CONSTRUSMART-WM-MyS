import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import Riesgos from '../erp/screens/Riesgos';

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', cliente: 'Cliente A', tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ' },
];

const mockRiesgos = [
  {
    id: 'riesgo-1',
    proyectoId: 'proy-1',
    nombre: 'Fallo en cimentación',
    descripcion: 'Riesgo de colapso estructural',
    tipo: 'tecnico' as const,
    probabilidad: 4 as const,
    impacto: 5 as const,
    nivel: 'critico' as const,
    planMitigacion: 'Reforzar pilotes',
    responsable: 'Ing. Pérez',
    fechaIdentificacion: '2024-01-10',
    estado: 'identificado' as const,
    createdAt: '2024-01-10T09:00:00Z',
  },
];

const mockUseErp = {
  proyectos: mockProyectos,
  currentProjectId: null as string | null,
  setCurrentProjectId: vi.fn(),
  proyectoWeather: [],
  user: {
    nombre: 'Usuario Test',
    rol: 'Administrador',
  },
  riesgos: mockRiesgos,
  addRiesgo: vi.fn(),
  updateRiesgo: vi.fn(),
  deleteRiesgo: vi.fn(),
  addNotificacion: vi.fn(),
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

vi.mock('../services/weatherService', () => ({
  calculateWeatherImpact: () => ({ score: 0, level: 'low', factors: [] }),
}));

vi.mock('../erp/components/ProyectoFilter', () => ({
  default: ({ value, onChange, proyectos }: any) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Todos los proyectos</option>
      {proyectos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  ),
}));

describe('Riesgos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.riesgos = [...mockRiesgos];
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.currentProjectId = null;
    mockUseErp.proyectoWeather = [];
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
  });

  it('renders the title', () => {
    render(<Riesgos />);
    expect(screen.getByText('riesgos.titulo')).toBeInTheDocument();
  });

  it('renders the riesgos list', () => {
    render(<Riesgos />);
    expect(screen.getByText('Fallo en cimentación')).toBeInTheDocument();
  });

  it('opens the form when nuevo button clicked', () => {
    render(<Riesgos />);
    const newButton = screen.getByRole('button', { name: /riesgos.nuevo/i });
    fireEvent.click(newButton);
    expect(screen.getByPlaceholderText(/riesgos.nombre_placeholder/i)).toBeInTheDocument();
  });

  it('handles form submission for a new riesgo', () => {
    render(<Riesgos />);
    const newButton = screen.getByRole('button', { name: /riesgos.nuevo/i });
    fireEvent.click(newButton);

    const nombreInput = screen.getByPlaceholderText(/riesgos.nombre_placeholder/i);
    fireEvent.change(nombreInput, { target: { value: 'Riesgo de filtración' } });

    const proyectoSelect = screen.getByDisplayValue(/riesgos.seleccionar_proyecto/i);
    fireEvent.change(proyectoSelect, { target: { value: 'proy-1' } });

    const registrarButton = screen.getByRole('button', { name: /riesgos.registrar/i });
    fireEvent.click(registrarButton);

    expect(mockUseErp.addRiesgo).toHaveBeenCalled();
  });

  it('validates required fields on submission', () => {
    render(<Riesgos />);
    const newButton = screen.getByRole('button', { name: /riesgos.nuevo/i });
    fireEvent.click(newButton);

    const registrarButton = screen.getByRole('button', { name: /riesgos.registrar/i });
    fireEvent.click(registrarButton);

    expect(screen.getByText(/riesgos.nombre_requerido/i)).toBeInTheDocument();
    expect(screen.getByText(/riesgos.proyecto_requerido/i)).toBeInTheDocument();
  });

  it('shows empty state when no riesgos exist', () => {
    mockUseErp.riesgos = [];
    render(<Riesgos />);
    const emptyMessages = screen.getAllByText(/riesgos.sin_riesgos/i);
    expect(emptyMessages.length).toBeGreaterThanOrEqual(1);
  });
});
