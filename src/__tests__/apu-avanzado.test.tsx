import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ErpProvider } from '../erp/store';
import APUAvanzado from '../erp/screens/APUAvanzado';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

const mockProyectos = [
  { id: 'proy-1', nombre: 'Residencial Aurora', cliente: 'Cliente A', tipologia: 'residencial', tipoObra: 'nueva', moneda: 'GTQ' },
  { id: 'proy-2', nombre: 'Torre Comercial', cliente: 'Cliente B', tipologia: 'comercial', tipoObra: 'remodelacion', moneda: 'USD' },
];

const mockApuItems = [
  {
    id: 'ins-1',
    nombre: 'Cemento Portland',
    categoria: 'material',
    unidad: 'saco',
    precioReferencia: 95.5,
    rubro: 'Cimentacion',
    fechaActualizacion: '2024-01-10',
  },
  {
    id: 'ins-2',
    nombre: 'Varilla 3/8',
    categoria: 'material',
    unidad: 'vara',
    precioReferencia: 42.0,
    rubro: 'Estructura',
    fechaActualizacion: '2024-01-10',
  },
  {
    id: 'ins-3',
    nombre: 'Arena',
    categoria: 'material',
    unidad: 'm3',
    precioReferencia: 60.0,
    rubro: 'Estructura',
    fechaActualizacion: '2024-01-10',
  },
];

const mockUseErp = {
  proyectos: mockProyectos,
  user: {
    nombre: 'Usuario Test',
    rol: 'Administrador',
  },
  apuItems: mockApuItems,
  insumosBase: mockApuItems,
  updateProyecto: vi.fn(),
};

const mockT = (key: string, options?: Record<string, string>) => {
  if (key === 'apu.ver_pestana' && options?.tab) return options.tab;
  return key;
};

vi.mock('../erp/store', () => ({
  useErp: () => mockUseErp,
  ErpProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

vi.mock('../erp/services/motorCalculo', () => ({
  ServicioMotorCalculo: {
    calcularDosificacion: vi.fn().mockResolvedValue({}),
    calcularDesgloseAcero: vi.fn().mockResolvedValue({}),
    calcularMovimientoTierra: vi.fn().mockResolvedValue({}),
    obtenerFactorClimatico: vi.fn().mockResolvedValue({}),
    calcularPavimento: vi.fn().mockResolvedValue({}),
    calcularRedInfraestructura: vi.fn().mockResolvedValue({}),
    calcularMuroContencion: vi.fn().mockResolvedValue({}),
  },
  registrarCalculo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../erp/services/validacionCalculos', () => ({
  ServicioValidacionCalculos: {
    validarPavimento: vi.fn().mockResolvedValue([]),
    validarRedInfraestructura: vi.fn().mockResolvedValue([]),
    validarMuroContencion: vi.fn().mockResolvedValue([]),
  },
  mostrarValidaciones: vi.fn().mockReturnValue(true),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
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
  default: ({ value, onChange, proyectos }: any) => (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Todos los proyectos</option>
      {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
    </select>
  ),
}));

describe('APUAvanzado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseErp.apuItems = [...mockApuItems];
    mockUseErp.insumosBase = [...mockApuItems];
    mockUseErp.proyectos = [...mockProyectos];
    mockUseErp.user = { nombre: 'Usuario Test', rol: 'Administrador' };
    mockUseErp.updateProyecto = vi.fn();
  });

  it('renders the APU avanzado title and section', () => {
    render(<APUAvanzado />);
    expect(screen.getByRole('heading', { name: /apu.apu_avanzado/i })).toBeInTheDocument();
    expect(screen.getByText(/apu.precios_referencia/i)).toBeInTheDocument();
  });

  it('renders tab navigation with all sections', () => {
    render(<APUAvanzado />);
    expect(screen.getByRole('button', { name: /apu.insumos_base/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apu.sobrecosto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apu.dosificacion_concreto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apu.calculo_apu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apu.historico_precios/i })).toBeInTheDocument();
  });

  it('renders the APU items (insumos) table with items', () => {
    render(<APUAvanzado />);
    expect(screen.getByRole('heading', { name: /apu.catalogo_insumos_base/i })).toBeInTheDocument();
    expect(screen.getByText('Cemento Portland')).toBeInTheDocument();
    expect(screen.getByText('Varilla 3/8')).toBeInTheDocument();
    expect(screen.getByText('Arena')).toBeInTheDocument();
    expect(screen.getByText(/apu.insumos_count/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no insumos', () => {
    mockUseErp.apuItems = [];
    mockUseErp.insumosBase = [];
    render(<APUAvanzado />);
    expect(screen.getByText(/apu.sin_insumos/i)).toBeInTheDocument();
  });

  it('filters insumos by search input', async () => {
    render(<APUAvanzado />);
    const searchInput = screen.getByPlaceholderText(/apu.buscar_insumo/i);
    fireEvent.change(searchInput, { target: { value: 'Cemento' } });
    await waitFor(() => {
      expect(screen.getByText('Cemento Portland')).toBeInTheDocument();
      expect(screen.queryByText('Varilla 3/8')).not.toBeInTheDocument();
      expect(screen.queryByText('Arena')).not.toBeInTheDocument();
    });
  });

  it('opens the sobrecosto section with factor KPIs when tab clicked', () => {
    render(<APUAvanzado />);
    const sobrecostoTab = screen.getByRole('button', { name: /apu.sobrecosto/i });
    fireEvent.click(sobrecostoTab);
    expect(screen.getByText(/apu.factor_sobrecosto/i)).toBeInTheDocument();
    expect(screen.getByText(/apu.total_sobrecosto/i)).toBeInTheDocument();
    expect(screen.getByText(/apu.factor_multiplicador/i)).toBeInTheDocument();
  });

  it('saves the factor when guardar clicked', () => {
    render(<APUAvanzado />);
    const sobrecostoTab = screen.getByRole('button', { name: /apu.sobrecosto/i });
    fireEvent.click(sobrecostoTab);

    const editButton = screen.getByRole('button', { name: /apu.editar_factor_sobrecosto|apu.editar/i });
    fireEvent.click(editButton);

    const guardarButton = screen.getByRole('button', { name: /apu.guardar_factor_sobrecosto|apu.guardar/i });
    fireEvent.click(guardarButton);

    expect(toast.success).toHaveBeenCalled();
  });

  it('opens the calculo automatico section showing KPIs', () => {
    render(<APUAvanzado />);
    const calculoTab = screen.getByRole('button', { name: /apu.calculo_apu/i });
    fireEvent.click(calculoTab);
    expect(screen.getByText(/apu.calculo_automatico/i)).toBeInTheDocument();
    expect(screen.getByText(/apu.materiales_label/i)).toBeInTheDocument();
    expect(screen.getByText(/apu.mano_obra_label/i)).toBeInTheDocument();
    expect(screen.getByText(/apu.equipo_label/i)).toBeInTheDocument();
    expect(screen.getByText(/apu.costo_directo/i)).toBeInTheDocument();
    expect(screen.getByText(/apu.precio_venta/i)).toBeInTheDocument();
  });

  it('opens dosificacion section and calculates when button clicked', async () => {
    render(<APUAvanzado />);
    const dosificacionTab = screen.getByRole('button', { name: /apu.dosificacion_concreto/i });
    fireEvent.click(dosificacionTab);

    const calcularButton = screen.getByRole('button', { name: /apu.calcular_dosificacion/i });
    fireEvent.click(calcularButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('apu.dosificacion_exito');
    });
  });

  it('opens acero section and calculates when button clicked', async () => {
    render(<APUAvanzado />);
    const aceroTab = screen.getByRole('button', { name: /apu.desglose_acero/i });
    fireEvent.click(aceroTab);

    const calcularButton = screen.getByRole('button', { name: /apu.calcular_acero/i });
    fireEvent.click(calcularButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('apu.acero_exito');
    });
  });

  it('opens movimiento de tierra section and calculates when button clicked', async () => {
    render(<APUAvanzado />);
    const tab = screen.getByRole('button', { name: /apu.movimiento_tierra/i });
    fireEvent.click(tab);

    const calcularButton = screen.getByRole('button', { name: /apu.calcular_mov_tierra/i });
    fireEvent.click(calcularButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('apu.movimiento_tierra_exito');
    });
  });

  it('opens parametros climaticos section and calculates when button clicked', async () => {
    render(<APUAvanzado />);
    const tab = screen.getByRole('button', { name: /apu.parametros_climaticos/i });
    fireEvent.click(tab);

    const calcularButton = screen.getByRole('button', { name: /apu.calcular_climaticos/i });
    fireEvent.click(calcularButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('apu.climaticos_exito');
    });
  });

  it('opens pavimentos section and calculates when button clicked', async () => {
    render(<APUAvanzado />);
    const tab = screen.getByRole('button', { name: /apu.pavimentos/i });
    fireEvent.click(tab);

    const calcularButton = screen.getByRole('button', { name: /apu.calcular_pavimento/i });
    fireEvent.click(calcularButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('apu.pavimento_exito');
    });
  });

  it('opens redes de infraestructura section and calculates when button clicked', async () => {
    render(<APUAvanzado />);
    const tab = screen.getByRole('button', { name: /apu.redes_infraestructura/i });
    fireEvent.click(tab);

    const calcularButton = screen.getByRole('button', { name: /apu.calcular_redes/i });
    fireEvent.click(calcularButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('apu.red_infraestructura_exito');
    });
  });

  it('opens muros de contencion section and calculates when button clicked', async () => {
    render(<APUAvanzado />);
    const tab = screen.getByRole('button', { name: /apu.muros_contencion/i });
    fireEvent.click(tab);

    const calcularButton = screen.getByRole('button', { name: /apu.calcular_muros/i });
    fireEvent.click(calcularButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('apu.muro_contencion_exito');
    });
  });

  it('opens rendimientos section and shows empty state', () => {
    render(<APUAvanzado />);
    const tab = screen.getByRole('button', { name: /apu.rendimientos/i });
    fireEvent.click(tab);
    expect(screen.getByText(/apu.rendimientos_cuadrilla/i)).toBeInTheDocument();
    expect(screen.getByText(/apu.sin_rendimientos/i)).toBeInTheDocument();
  });

  it('shows historico section with chart when insumos have dates', () => {
    render(<APUAvanzado />);
    const tab = screen.getByRole('button', { name: /apu.historico_precios/i });
    fireEvent.click(tab);
    expect(screen.getByText(/apu.historico_titulo/i)).toBeInTheDocument();
    expect(screen.getByText(/apu.cemento_ugc_label/i)).toBeInTheDocument();
  });

  it('shows empty historico state when no insumos', () => {
    mockUseErp.apuItems = [];
    mockUseErp.insumosBase = [];
    render(<APUAvanzado />);
    const tab = screen.getByRole('button', { name: /apu.historico_precios/i });
    fireEvent.click(tab);
    expect(screen.getByText(/apu.sin_historico/i)).toBeInTheDocument();
  });
});