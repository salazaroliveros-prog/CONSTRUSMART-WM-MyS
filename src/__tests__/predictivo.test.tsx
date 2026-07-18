import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

let mockProyectos: any[] = [];
let mockMovimientos: any[] = [];
let mockPresupuestos: any[] = [];
let mockAvances: any[] = [];
let mockEmpleados: any[] = [];
let mockCurrentProjectId: string = '';
const mockSetCurrentProjectId = vi.fn();
let mockProyectoWeather: any[] = [];

vi.mock('../erp/store', () => ({
  useErp: () => ({
    proyectos: mockProyectos,
    movimientos: mockMovimientos,
    presupuestos: mockPresupuestos,
    avances: mockAvances,
    empleados: mockEmpleados,
    currentProjectId: mockCurrentProjectId,
    setCurrentProjectId: mockSetCurrentProjectId,
    proyectoWeather: mockProyectoWeather,
  }),
}));

vi.mock('../services/weatherService', () => ({
  calculateWeatherImpact: vi.fn(() => ({
    score: 45,
    level: 'medium',
    factors: ['Lluvia'],
    recommendations: ['Proteger materiales'],
  })),
}));

import DashboardPredictivo from '../erp/screens/DashboardPredictivo';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  mockProyectos = [
    { id: 'proj-1', nombre: 'Torre Norte', estado: 'ejecucion', presupuestoTotal: 500000, avanceFisico: 35, fechaInicio: '2026-01-01', fechaFin: '2026-12-31' },
    { id: 'proj-2', nombre: 'Edificio Sur', estado: 'planeacion', presupuestoTotal: 300000, avanceFisico: 0, fechaInicio: '2026-06-01', fechaFin: '2027-06-01' },
  ];
  mockMovimientos = [
    { id: 'mv-1', proyectoId: 'proj-1', tipo: 'gasto', monto: 120000, costoTotal: 120000 },
  ];
  mockPresupuestos = [
    { id: 'pre-1', proyectoId: 'proj-1', tipologia: 'residencial', renglones: [
      { id: 'r-1', nombre: 'Cimentacion', costoDirecto: 100000, precioVenta: 150000 },
      { id: 'r-2', nombre: 'Estructura', costoDirecto: 200000, precioVenta: 300000 },
    ], estado: 'aprobado', totalCalculado: 500000, costoDirectoTotal: 400000, fechaCreacion: '2026-01-01', fechaActualizacion: '2026-03-01' },
  ];
  mockAvances = [
    { id: 'av-1', proyectoId: 'proj-1', renglonId: 'r-1', renglonNombre: 'Cimentacion', fecha: '2026-03-01', avanceFisico: 80 },
    { id: 'av-2', proyectoId: 'proj-1', renglonId: 'r-2', renglonNombre: 'Estructura', fecha: '2026-03-01', avanceFisico: 20 },
  ];
  mockEmpleados = [
    { id: 'emp-1', nombre: 'Juan Perez', salarioDiario: 150, tipo: 'planilla', activo: true, proyectoIds: ['proj-1'] },
  ];
  mockCurrentProjectId = 'proj-1';
  mockProyectoWeather = [
    { id: 'pw-1', proyectoId: 'proj-1', weatherData: { current: { temp: 25, feels_like: 27, humidity: 60, wind_speed: 10, wind_deg: 180, visibility: 10000, weather: [{ id: 800, main: 'Clear', description: 'cielo claro', icon: '01d' }] }, forecast: [], location: 'Guatemala', lat: 14.6, lon: -90.5, fetched_at: Date.now() }, impact: { score: 45, level: 'medium', factors: ['Lluvia'], recommendations: ['Proteger materiales'] }, history: [
      { date: '2026-03-01', temp: 25, tempMin: 18, tempMax: 28, humidity: 60, windSpeed: 10, condition: 'cielo claro', icon: '01d', precipitation: 0, impactScore: 20, impactLevel: 'low' },
    ], lastUpdated: '2026-03-02', createdAt: '2026-03-01', updatedAt: '2026-03-02', enabled: true, autoRefresh: true, refreshInterval: 60, alertThreshold: 'high' },
  ];
});

afterEach(cleanup);

describe('DashboardPredictivo Screen', () => {
  describe('Renderizado inicial', () => {
    it('renderiza titulo y selector de proyecto', async () => {
      render(<DashboardPredictivo />);
      await waitFor(() => {
        expect(screen.getByText('Dashboard Predictivo')).toBeInTheDocument();
        expect(screen.getByLabelText('Seleccionar proyecto para dashboard predictivo')).toBeInTheDocument();
      });
    });

    it('renderiza tarjetas KPI BAC, AC, EAC, CPI', async () => {
      render(<DashboardPredictivo />);
      await waitFor(() => {
        expect(screen.getAllByText('Presupuesto (BAC)').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Ejecutado (AC)')).toBeInTheDocument();
        expect(screen.getByText('Costo Final Estimado (EAC)')).toBeInTheDocument();
        expect(screen.getByText('CPI (Rend. Costo)')).toBeInTheDocument();
      });
    });

    it('renderiza barra de progreso EAC vs BAC', async () => {
      render(<DashboardPredictivo />);
      await waitFor(() => {
        expect(screen.getByText('Estimado Final (EAC)')).toBeInTheDocument();
      });
    });
  });

  describe('Tarjetas de fechas y avance', () => {
    it('renderiza tarjetas de fecha planificada y estimada', async () => {
      render(<DashboardPredictivo />);
      await waitFor(() => {
        expect(screen.getByText('Fecha Planificada')).toBeInTheDocument();
        expect(screen.getByText('Fecha Estimada')).toBeInTheDocument();
      });
    });

    it('renderiza avance fisico y dias transcurridos', async () => {
      render(<DashboardPredictivo />);
      await waitFor(() => {
        expect(screen.getByText(/Avance Físico/)).toBeInTheDocument();
        expect(screen.getByText(/Días Transcurridos/)).toBeInTheDocument();
      });
    });

    it('renderiza ritmos esperado y actual', async () => {
      render(<DashboardPredictivo />);
      await waitFor(() => {
        expect(screen.getByText('Ritmo esperado')).toBeInTheDocument();
        expect(screen.getByText('Ritmo actual')).toBeInTheDocument();
      });
    });
  });

  describe('Riesgos', () => {
    it('renderiza recomendaciones cuando hay sobrecosto', async () => {
      mockMovimientos = [
        { id: 'mv-1', proyectoId: 'proj-1', tipo: 'gasto', monto: 600000, costoTotal: 600000 },
      ];
      render(<DashboardPredictivo />);
      await waitFor(() => {
        expect(screen.getByText(/sobre presupuesto/)).toBeInTheDocument();
      });
    });
  });

  describe('Impacto climatico', () => {
    it('renderiza tarjeta de impacto climatico', async () => {
      render(<DashboardPredictivo />);
      await waitFor(() => {
        expect(screen.getByText(/Impacto Climático/)).toBeInTheDocument();
      });
    });

    it('renderiza quema de horas hombre', async () => {
      render(<DashboardPredictivo />);
      await waitFor(() => {
        expect(screen.getByText(/quema de horas/i)).toBeInTheDocument();
      });
    });
  });

  describe('Estados vacios', () => {
    it('muestra estado vacio cuando no hay proyecto seleccionado', async () => {
      mockCurrentProjectId = '';
      render(<DashboardPredictivo />);
      await waitFor(() => {
        expect(screen.getByText('Selecciona un proyecto')).toBeInTheDocument();
        expect(screen.getByText('Para ver las predicciones de costo, plazo y riesgos')).toBeInTheDocument();
      });
    });
  });

  describe('Navegacion', () => {
    it('cambiar proyecto actualiza metricas', async () => {
      render(<DashboardPredictivo />);
      await waitFor(() => expect(screen.getAllByText('Presupuesto (BAC)').length).toBeGreaterThanOrEqual(1));
      const select = screen.getByLabelText('Seleccionar proyecto para dashboard predictivo');
      fireEvent.change(select, { target: { value: 'proj-2' } });
      expect(mockSetCurrentProjectId).toHaveBeenCalledWith('proj-2');
    });
  });
});
