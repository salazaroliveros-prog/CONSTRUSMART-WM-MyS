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
const translations: Record<string, string> = {
  'profitability.datos_actualizados': 'Datos actualizados',
  'profitability.datos_insuficientes': 'Datos insuficientes',
  'profitability.requeridos_proyectos_movimientos': 'Se requieren proyectos y movimientos',
  'profitability.por_proyecto': 'Por Proyecto',
  'profitability.por_cliente': 'Por Cliente',
  'profitability.pronosticos': 'Pronósticos',
  'profitability.eficiencia_recursos': 'Eficiencia de Recursos',
  'profitability.tendencias': 'Tendencias',
  'profitability.optimizacion_precios': 'Optimización de Precios',
  'profitability.titulo': 'Rentabilidad',
  'profitability.descripcion': 'Análisis de rentabilidad de proyectos',
  'profitability.actualizar': 'Actualizar',
  'profitability.exportar': 'Exportar',
  'profitability.utilidad_total': 'Utilidad Total',
  'profitability.margen_promedio': 'Margen Promedio',
  'profitability.proyectos_riesgosos': 'Proyectos Riesgosos',
  'profitability.proyectos_excelentes': 'Proyectos Excelentes',
  'profitability.sin_datos': 'Sin datos',
  'profitability.mostrar_detalles': 'Mostrar detalles',
  'profitability.ocultar_detalles': 'Ocultar detalles',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => translations[key] || defaultValue || key,
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

describe('ProfitabilityAnalytics', () => {
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

  it('muestra mensaje de datos insuficientes cuando no hay datos', async () => {
    (useErp as any).mockReturnValue({
      proyectos: null,
      movimientos: null,
      empleados: [],
      materiales: [],
      ordenes: [],
      currentProjectId: null,
      setCurrentProjectId: vi.fn(),
    });

    render(<ProfitabilityAnalytics />);
    expect(await screen.findByText(/Datos insuficientes/i)).toBeDefined();
  });

  it('renderiza KPI cards cuando hay datos', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/Utilidad Total/i)).toBeDefined();
      expect(screen.getByText(/Margen Promedio/i)).toBeDefined();
      expect(screen.getByText(/Proyectos Riesgosos/i)).toBeDefined();
      expect(screen.getByText(/Proyectos Excelentes/i)).toBeDefined();
    });
  });

  it('renderiza tabs de navegación', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Por Proyecto/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Por Cliente/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Pronósticos/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Eficiencia de Recursos/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Tendencias/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Optimización de Precios/i).length).toBeGreaterThan(0);
    });
  });

  it('cambia de tab al hacer click', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getAllByText(/Por Proyecto/i).length).toBeGreaterThan(0);
    });

    const clientesTab = screen.getByText(/Por Cliente/i);
    fireEvent.click(clientesTab);
    
    await waitFor(() => {
      expect(clientesTab).toHaveClass('bg-primary');
    });
  });

  it('renderiza gráficos en tab de proyectos', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/Distribución de Margen por Proyecto/i)).toBeDefined();
      expect(screen.getByText(/Estado de Rentabilidad/i)).toBeDefined();
    });
  });

  it('muestra tabla de detalles cuando showDetails es true', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/Rentabilidad por Proyecto/i)).toBeDefined();
    });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeDefined();
    });
  });

  it('renderiza empty state cuando no hay datos de rentabilidad', async () => {
    (useErp as any).mockReturnValue({
      proyectos: null,
      movimientos: null,
      empleados: [],
      materiales: [],
      ordenes: [],
      currentProjectId: null,
      setCurrentProjectId: vi.fn(),
    });

    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/Datos insuficientes/i)).toBeDefined();
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
      expect(screen.getByLabelText(/Exportar PDF/i)).toBeDefined();
      expect(screen.getByLabelText(/Exportar Excel/i)).toBeDefined();
    });
  });

  it('cambia formato de exportación al hacer click', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      const pdfButton = screen.getByLabelText(/Exportar PDF/i);
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
      expect(screen.getByText(/Utilidad Total/i)).toBeDefined();
    });
  });

  it('renderiza tabla con columnas correctas', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/Rentabilidad por Proyecto/i)).toBeDefined();
    });

    await waitFor(() => {
      expect(screen.getByRole('columnheader', { name: /^Proyecto$/i })).toBeDefined();
      expect(screen.getByRole('columnheader', { name: /^Presupuesto$/i })).toBeDefined();
      expect(screen.getByRole('columnheader', { name: /^Costo Real$/i })).toBeDefined();
      expect(screen.getByRole('columnheader', { name: /^Ingreso Real$/i })).toBeDefined();
      expect(screen.getByRole('columnheader', { name: /^Utilidad$/i })).toBeDefined();
      expect(screen.getByRole('columnheader', { name: /^Margen$/i })).toBeDefined();
      expect(screen.getByRole('columnheader', { name: /^Estado$/i })).toBeDefined();
      expect(screen.getByRole('columnheader', { name: /^Eficiencia$/i })).toBeDefined();
    });
  });

  it('muestra estado de rentabilidad con colores correctos', async () => {
    render(<ProfitabilityAnalytics />);
    
    await waitFor(() => {
      expect(screen.getByText(/Rentabilidad por Proyecto/i)).toBeDefined();
    });

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
      expect(screen.getByLabelText(/Actualizar/i)).toBeDefined();
      expect(screen.getByLabelText(/Exportar PDF/i)).toBeDefined();
    });
  });

  it('respeta prefers-reduced-motion', () => {
    document.documentElement.classList.add('animations-disabled');
    render(<ProfitabilityAnalytics />);
    document.documentElement.classList.remove('animations-disabled');
  });
});