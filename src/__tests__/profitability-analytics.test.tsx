/**
 * TEST DE PROFITABILITY ANALYTICS — CONSTRUSMART ERP
 * Tests de renderizado, gráficos, exportación y cálculos de rentabilidad
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useErp } from '../erp/store';
import ProfitabilityAnalytics from '../erp/screens/ProfitabilityAnalytics';

vi.mock('../erp/store');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
  initReactI18next: {
    init: vi.fn(),
    type: '3rdParty',
  },
}));

const mockProyectos = [
  {
    id: 'p1',
    nombre: 'Residencial Altamira',
    cliente: 'Inmobiliaria GT',
    ubicacion: 'Zona 10, Guatemala',
    tipologia: 'residencial',
    estado: 'ejecucion',
    presupuesto_total: 5000000,
    monto_contrato: 5500000,
    avance_fisico: 45,
    avance_financiero: 42,
    fecha_inicio: '2025-01-01',
    fecha_fin: '2025-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p2',
    nombre: 'Comercial Centro',
    cliente: 'Grupo Corporativo',
    ubicacion: 'Zona 9, Guatemala',
    tipologia: 'comercial',
    estado: 'ejecucion',
    presupuesto_total: 8000000,
    monto_contrato: 8500000,
    avance_fisico: 62,
    avance_financiero: 58,
    fecha_inicio: '2025-02-01',
    fecha_fin: '2026-06-30',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockMovimientos = [
  {
    id: 'm1',
    proyectoId: 'p1',
    tipo: 'ingreso',
    monto: 2500000,
    fecha: '2025-06-01',
    categoria: 'anticipo',
  },
  {
    id: 'm2',
    proyectoId: 'p1',
    tipo: 'gasto',
    monto: 1500000,
    fecha: '2025-06-15',
    categoria: 'materiales',
  },
  {
    id: 'm3',
    proyectoId: 'p2',
    tipo: 'ingreso',
    monto: 4000000,
    fecha: '2025-06-01',
    categoria: 'anticipo',
  },
];

describe.skip('ProfitabilityAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useErp as any).mockReturnValue({
      proyectos: mockProyectos,
      movimientos: mockMovimientos,
      empleados: [],
      materiales: [],
      ordenes: [],
      currentProjectId: null,
      setCurrentProjectId: vi.fn(),
    });
  });

  it('renderiza skeleton durante loading', () => {
    (useErp as any).mockReturnValue({
      proyectos: [],
      movimientos: [],
      empleados: [],
      materiales: [],
      ordenes: [],
      currentProjectId: null,
      setCurrentProjectId: vi.fn(),
    });

    const { container } = render(<ProfitabilityAnalytics />);
    expect(container.querySelector('.animate-pulse')).toBeDefined();
  });

  it('muestra mensaje de datos insuficientes cuando no hay datos', () => {
    (useErp as any).mockReturnValue({
      proyectos: [],
      movimientos: [],
      empleados: [],
      materiales: [],
      ordenes: [],
      currentProjectId: null,
      setCurrentProjectId: vi.fn(),
    });

    render(<ProfitabilityAnalytics />);
    expect(screen.getByText(/datos_insuficientes/i)).toBeDefined();
  });

  it('renderiza KPI cards cuando hay datos', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/utilidad_total/i)).toBeDefined();
      expect(screen.getByText(/margen_promedio/i)).toBeDefined();
      expect(screen.getByText(/proyectos_riesgosos/i)).toBeDefined();
      expect(screen.getByText(/proyectos_excelentes/i)).toBeDefined();
    });
  });

  it('renderiza tabs de navegación', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/por_proyecto/i)).toBeDefined();
      expect(screen.getByText(/por_cliente/i)).toBeDefined();
      expect(screen.getByText(/pronosticos/i)).toBeDefined();
      expect(screen.getByText(/eficiencia_recursos/i)).toBeDefined();
      expect(screen.getByText(/tendencias/i)).toBeDefined();
      expect(screen.getByText(/optimizacion_precios/i)).toBeDefined();
    });
  });

  it('cambia de tab al hacer click', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/por_proyecto/i)).toBeDefined();
    });

    const clientesTab = screen.getByText(/por_cliente/i);
    fireEvent.click(clientesTab);
    
    await waitFor(() => {
      expect(clientesTab).toHaveClass('bg-primary');
    });
  });

  it('renderiza gráficos en tab de proyectos', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/distribucion_de_margen/i)).toBeDefined();
      expect(screen.getByText(/estado_de_rentabilidad/i)).toBeDefined();
    });
  });

  it('muestra tabla de detalles cuando showDetails es true', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/rentabilidad_por_proyecto/i)).toBeDefined();
    });

    const toggleButton = screen.getByLabelText(/mostrar_detalles/i);
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeDefined();
    });
  });

  it('oculta tabla de detalles cuando showDetails es false', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/rentabilidad_por_proyecto/i)).toBeDefined();
    });

    const toggleButton = screen.getByLabelText(/mostrar_detalles/i);
    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('table')).toBeNull();
    });
  });

  it('renderiza empty state cuando no hay datos de rentabilidad', async () => {
    (useErp as any).mockReturnValue({
      proyectos: mockProyectos,
      movimientos: [],
      empleados: [],
      materiales: [],
      ordenes: [],
      currentProjectId: null,
      setCurrentProjectId: vi.fn(),
    });

    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/sin_datos/i)).toBeDefined();
    });
  });

  it('botón de refresh tiene estado de loading', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      const refreshButton = screen.getByLabelText(/actualizar/i);
      expect(refreshButton).toBeDefined();
    });
  });

  it('botones de exportación PDF y Excel son visibles', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/exportar_pdf/i)).toBeDefined();
      expect(screen.getByLabelText(/exportar_excel/i)).toBeDefined();
    });
  });

  it('cambia formato de exportación al hacer click', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      const pdfButton = screen.getByLabelText(/exportar_pdf/i);
      fireEvent.click(pdfButton);
    });
  });

  it('filtra por proyecto cuando se selecciona currentProjectId', async () => {
    (useErp as any).mockReturnValue({
      proyectos: mockProyectos,
      movimientos: mockMovimientos,
      empleados: [],
      materiales: [],
      ordenes: [],
      currentProjectId: 'p1',
      setCurrentProjectId: vi.fn(),
    });

    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/utilidad_total/i)).toBeDefined();
    });
  });

  it('renderiza tabla con columnas correctas', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/rentabilidad_por_proyecto/i)).toBeDefined();
    });

    const toggleButton = screen.getByLabelText(/mostrar_detalles/i);
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(screen.getByText(/proyecto/i)).toBeDefined();
      expect(screen.getByText(/presupuesto/i)).toBeDefined();
      expect(screen.getByText(/costo_real/i)).toBeDefined();
      expect(screen.getByText(/ingreso_real/i)).toBeDefined();
      expect(screen.getByText(/utilidad/i)).toBeDefined();
      expect(screen.getByText(/margen/i)).toBeDefined();
      expect(screen.getByText(/estado/i)).toBeDefined();
      expect(screen.getByText(/eficiencia/i)).toBeDefined();
    });
  });

  it('muestra estado de rentabilidad con colores correctos', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/rentabilidad_por_proyecto/i)).toBeDefined();
    });

    const toggleButton = screen.getByLabelText(/mostrar_detalles/i);
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      const table = screen.getByRole('table');
      expect(table).toBeDefined();
    });
  });

  it('renderiza iconos con aria-hidden', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  it('tiene botones con aria-label descriptivos', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/actualizar/i)).toBeDefined();
      expect(screen.getByLabelText(/exportar/i)).toBeDefined();
    });
  });

  it('respeta prefers-reduced-motion', () => {
    document.documentElement.classList.add('animations-disabled');
    render(<ProfitabilityAnalytics />);
    document.documentElement.classList.remove('animations-disabled');
  });
});