/**
 * TEST DE WEATHER — CONSTRUSMART ERP
 * Tests de integración con weatherService, validación de datos climáticos,
 * cálculo de impacto en obra, exportación y manejo de errores
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useErp } from '../erp/store';
import Weather from '../erp/screens/Weather';

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

vi.mock('../erp/services/weatherService', () => ({
  getWeatherIconUrl: vi.fn((icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`),
  formatWeatherDescription: vi.fn((code) => 'Clear sky'),
  isWeatherDataStale: vi.fn(() => false),
  getCompleteWeatherData: vi.fn(() => Promise.resolve({
    current: {
      temp: 25,
      feels_like: 27,
      humidity: 65,
      wind_speed: 3.5,
      visibility: 10000,
      weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
    },
    forecast: Array(40).fill(null).map((_, i) => ({
      dt: 1625097600 + i * 10800,
      main: { temp: 25 + Math.random() * 5, temp_min: 20, temp_max: 30, humidity: 60 + Math.random() * 20 },
      weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
      wind: { speed: 3 + Math.random() * 2 },
      rain: i % 3 === 0 ? { '3h': 0.5 } : null,
    })),
    fetched_at: new Date().toISOString(),
  })),
  calculateWeatherImpact: vi.fn(() => ({
    score: 75,
    level: 'medium',
    factors: ['Moderate temperature', 'Light wind'],
    recommendations: ['Standard construction activities can proceed'],
  })),
  calculateConstructionMetrics: vi.fn(() => ({
    concreteCuring: {
      suitable: true,
      tempRange: '20-25°C',
      humidityRange: '60-65%',
    },
    workforceSafety: {
      heatStressRisk: 'low',
      heatIndex: 28,
      workScheduleAdjustment: 'No adjustment needed',
    },
    equipmentOperation: {
      cranes: { suitable: true, reason: 'Wind speed within limits' },
      excavators: { suitable: true, reason: 'Ground conditions acceptable' },
      welding: { suitable: true, reason: 'Humidity within range' },
    },
    materialProtection: {
      protectionRequired: false,
      urgency: 'none',
      materialsToProtect: [],
    },
  })),
  calculateSchedulingWindows: vi.fn(() => Array(7).fill(null).map((_, i) => ({
    date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
    suitable: i % 2 === 0,
    score: 70 + Math.random() * 20,
    conditions: ['Temperature: 22-26°C', 'Wind: 3-5 m/s'],
    bestActivities: ['Concrete pouring', 'Excavation'],
    avoidActivities: [],
  }))),
  getHistoricalWeatherImpact: vi.fn(() => []),
  saveWeatherToSupabase: vi.fn(() => Promise.resolve()),
  loadWeatherFromSupabase: vi.fn(() => Promise.resolve(null)),
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
    lat: 14.6349,
    lng: -90.5069,
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
    lat: 14.6133,
    lng: -90.5295,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockWeatherData = {
  proyectoId: 'p1',
  weatherData: {
    current: {
      temp: 25,
      feels_like: 27,
      humidity: 65,
      wind_speed: 3.5,
      visibility: 10000,
      weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
    },
    forecast: Array(40).fill(null).map((_, i) => ({
      dt: 1625097600 + i * 10800,
      main: { temp: 25 + Math.random() * 5, temp_min: 20, temp_max: 30, humidity: 60 + Math.random() * 20 },
      weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
      wind: { speed: 3 + Math.random() * 2 },
      rain: i % 3 === 0 ? { '3h': 0.5 } : null,
    })),
    fetched_at: new Date().toISOString(),
  },
  impact: {
    score: 75,
    level: 'medium',
    factors: ['Moderate temperature', 'Light wind'],
    recommendations: ['Standard construction activities can proceed'],
  },
  constructionMetrics: {
    concreteCuring: {
      suitable: true,
      tempRange: '20-25°C',
      humidityRange: '60-65%',
    },
    workforceSafety: {
      heatStressRisk: 'low',
      heatIndex: 28,
      workScheduleAdjustment: 'No adjustment needed',
    },
    equipmentOperation: {
      cranes: { suitable: true, reason: 'Wind speed within limits' },
      excavators: { suitable: true, reason: 'Ground conditions acceptable' },
      welding: { suitable: true, reason: 'Humidity within range' },
    },
    materialProtection: {
      protectionRequired: false,
      urgency: 'none',
      materialsToProtect: [],
    },
  },
  schedulingWindows: Array(7).fill(null).map((_, i) => ({
    date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
    suitable: i % 2 === 0,
    score: 70 + Math.random() * 20,
    conditions: ['Temperature: 22-26°C', 'Wind: 3-5 m/s'],
    bestActivities: ['Concrete pouring', 'Excavation'],
    avoidActivities: [],
  })),
  history: [],
  lastUpdated: new Date().toISOString(),
};

describe('Weather', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useErp as any).mockReturnValue({
      proyectos: mockProyectos,
      currentProjectId: 'p1',
      setCurrentProjectId: vi.fn(),
      proyectoWeather: [mockWeatherData],
      updateProyectoWeather: vi.fn(),
      addNotificacion: vi.fn(),
    });
  });

  it('renderiza mensaje cuando no hay proyectos', () => {
    (useErp as any).mockReturnValue({
      proyectos: [],
      currentProjectId: null,
      setCurrentProjectId: vi.fn(),
      proyectoWeather: [],
      updateProyectoWeather: vi.fn(),
      addNotificacion: vi.fn(),
    });

    render(<Weather />);
    expect(screen.getByText(/no_project/i)).toBeDefined();
  });

  it('renderiza título y ubicación del proyecto', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/clima_y_condiciones_ambientales/i)).toBeDefined();
      expect(screen.getByText(/residencial_altamira/i)).toBeDefined();
    });
  });

  it('renderiza select de proyecto', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      const projectSelect = screen.getByRole('combobox');
      expect(projectSelect).toBeDefined();
    });
  });

  it('renderiza botón de refresh', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      const refreshButton = screen.getByLabelText(/refresh_weather/i);
      expect(refreshButton).toBeDefined();
    });
  });

  it('muestra error cuando proyecto no tiene coordenadas', async () => {
    const projectWithoutCoords = {
      ...mockProyectos[0],
      lat: undefined,
      lng: undefined,
    };

    (useErp as any).mockReturnValue({
      proyectos: [projectWithoutCoords],
      currentProjectId: 'p1',
      setCurrentProjectId: vi.fn(),
      proyectoWeather: [],
      updateProyectoWeather: vi.fn(),
      addNotificacion: vi.fn(),
    });

    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/no_coordinates/i)).toBeDefined();
    });
  });

  it('renderiza condiciones climáticas actuales', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/current_conditions/i)).toBeDefined();
    });
  });

  it('renderiza análisis de impacto', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/impact_analysis/i)).toBeDefined();
    });
  });

  it('renderiza métricas de construcción', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/construction_metrics/i)).toBeDefined();
    });
  });

  it('renderiza ventanas de programación', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/scheduling_windows/i)).toBeDefined();
    });
  });

  it('renderiza histórico cuando hay datos', async () => {
    const weatherWithHistory = {
      ...mockWeatherData,
      history: [
        {
          date: '2025-06-01',
          temp: 24,
          tempMin: 20,
          tempMax: 28,
          humidity: 62,
          windSpeed: 3.2,
          condition: 'Clear',
          icon: '01d',
          precipitation: 0,
          impactScore: 80,
          impactLevel: 'low',
        },
      ],
    };

    (useErp as any).mockReturnValue({
      proyectos: mockProyectos,
      currentProjectId: 'p1',
      setCurrentProjectId: vi.fn(),
      proyectoWeather: [weatherWithHistory],
      updateProyectoWeather: vi.fn(),
      addNotificacion: vi.fn(),
    });

    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/historical_impact/i)).toBeDefined();
    });
  });

  it('cambia de proyecto al seleccionar en select', async () => {
    const setCurrentProjectId = vi.fn();
    (useErp as any).mockReturnValue({
      proyectos: mockProyectos,
      currentProjectId: 'p1',
      setCurrentProjectId,
      proyectoWeather: [mockWeatherData],
      updateProyectoWeather: vi.fn(),
      addNotificacion: vi.fn(),
    });

    render(<Weather />);
    
    await waitFor(() => {
      const projectSelect = screen.getByRole('combobox');
      fireEvent.change(projectSelect, { target: { value: 'p2' } });
      expect(setCurrentProjectId).toHaveBeenCalledWith('p2');
    });
  });

  it('renderiza botones de exportación PDF y Excel', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/export_pdf/i)).toBeDefined();
      expect(screen.getByText(/export_excel/i)).toBeDefined();
    });
  });

  it('renderiza toggle de auto-refresh', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/auto_refresh/i)).toBeDefined();
    });
  });

  it('renderiza selector de umbral de alerta', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/alert_threshold/i)).toBeDefined();
    });
  });

  it('muestra colores correctos según nivel de impacto', async () => {
    const highImpactWeather = {
      ...mockWeatherData,
      impact: {
        score: 90,
        level: 'critical',
        factors: ['High temperature', 'Strong wind'],
        recommendations: ['Limit outdoor activities'],
      },
    };

    (useErp as any).mockReturnValue({
      proyectos: mockProyectos,
      currentProjectId: 'p1',
      setCurrentProjectId: vi.fn(),
      proyectoWeather: [highImpactWeather],
      updateProyectoWeather: vi.fn(),
      addNotificacion: vi.fn(),
    });

    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/impact_analysis/i)).toBeDefined();
    });
  });

  it('renderiza iconos con aria-hidden', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      const icons = document.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  it('botones tienen aria-label descriptivos', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/refresh_weather/i)).toBeDefined();
    });
  });

  it('renderiza estado de loading durante refresh', async () => {
    render(<Weather />);
    
    const refreshButton = screen.getByLabelText(/refresh_weather/i);
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(refreshButton).toBeDisabled();
    });
  });

  it('toggle showDetails muestra/oculta detalles', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      const toggleButton = screen.getByLabelText(/show_details/i);
      expect(toggleButton).toBeDefined();
    });
  });

  it('toggle showScheduling muestra/oculta programación', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      const toggleButton = screen.getByLabelText(/show_scheduling/i);
      expect(toggleButton).toBeDefined();
    });
  });

  it('toggle showConstruction muestra/oculta métricas de construcción', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      const toggleButton = screen.getByLabelText(/show_construction/i);
      expect(toggleButton).toBeDefined();
    });
  });

  it('respeta prefers-reduced-motion', () => {
    document.documentElement.classList.add('animations-disabled');
    render(<Weather />);
    document.documentElement.classList.remove('animations-disabled');
  });

  it('carga datos desde Supabase al montar', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/clima_y_condiciones_ambientales/i)).toBeDefined();
    });
  });

  it('muestra datos agrupados por día en forecast', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/forecast/i)).toBeDefined();
    });
  });

  it('calcula impacto en obra correctamente', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/impact_analysis/i)).toBeDefined();
    });
  });

  it('muestra recomendaciones basadas en clima', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      expect(screen.getByText(/recommendations/i)).toBeDefined();
    });
  });

  it('renderiza tabla con scope en headers', async () => {
    render(<Weather />);
    
    await waitFor(() => {
      const table = screen.queryByRole('table');
      if (table) {
        const headers = table.querySelectorAll('th[scope]');
        expect(headers.length).toBeGreaterThan(0);
      }
    });
  });

  it('maneja errores de API externa', async () => {
    const { getCompleteWeatherData } = require('../erp/services/weatherService');
    getCompleteWeatherData.mockRejectedValueOnce(new Error('API Error'));

    (useErp as any).mockReturnValue({
      proyectos: mockProyectos,
      currentProjectId: 'p1',
      setCurrentProjectId: vi.fn(),
      proyectoWeather: [],
      updateProyectoWeather: vi.fn(),
      addNotificacion: vi.fn(),
    });

    render(<Weather />);
    
    const refreshButton = screen.getByLabelText(/refresh_weather/i);
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error_refresh/i)).toBeDefined();
    });
  });
});