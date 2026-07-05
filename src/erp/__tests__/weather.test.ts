import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateWeatherImpact,
  calculateConstructionMetrics,
  calculateSchedulingWindows,
  isWeatherDataStale,
  formatWeatherDescription,
  getWeatherIconUrl,
  getHistoricalWeatherImpact,
} from '../services/weatherService';
import { weatherDataSchema, proyectoWeatherSchema } from '../store/schemas/weather';

const mockWeatherData = {
  current: {
    temp: 32,
    feels_like: 35,
    humidity: 72,
    wind_speed: 8,
    wind_deg: 180,
    visibility: 10000,
    weather: [{ id: 800, main: 'Clear', description: 'cielo despejado', icon: '01d' }],
  },
  forecast: [
    {
      dt: Math.floor(Date.now() / 1000) + 3600,
      main: { temp: 30, temp_min: 28, temp_max: 33, humidity: 70 },
      weather: [{ id: 802, main: 'Clouds', description: 'nubes dispersas', icon: '03d' }],
      wind: { speed: 6, deg: 200 },
    },
    {
      dt: Math.floor(Date.now() / 1000) + 7200,
      main: { temp: 28, temp_min: 26, temp_max: 30, humidity: 75 },
      weather: [{ id: 500, main: 'Rain', description: 'lluvia ligera', icon: '10d' }],
      wind: { speed: 10, deg: 210 },
    },
  ],
  location: 'Guatemala City',
  lat: 14.6349,
  lon: -90.5069,
  fetched_at: Date.now(),
} as const;

const mockEmptyForecast = {
  ...mockWeatherData,
  forecast: Array(40).fill(null).map((_, i) => ({
    dt: Math.floor(Date.now() / 1000) + i * 3600,
    main: { temp: 25, temp_min: 22, temp_max: 28, humidity: 60 },
    weather: [{ id: 800, main: 'Clear', description: 'cielo despejado', icon: '01d' }],
    wind: { speed: 4, deg: 180 },
  })),
};

describe('calculateWeatherImpact', () => {
  it('calcula impacto bajo en condiciones normales', () => {
    const impact = calculateWeatherImpact({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, wind_speed: 3, humidity: 50, temp: 25 },
    });
    expect(impact.level).toBe('low');
    expect(impact.score).toBeLessThan(30);
  });

  it('detecta vientos fuertes', () => {
    const impact = calculateWeatherImpact({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, wind_speed: 12 },
    });
    expect(impact.factors).toContain('Vientos fuertes');
    expect(impact.score).toBeGreaterThanOrEqual(20);
  });

  it('detecta humedad alta', () => {
    const impact = calculateWeatherImpact({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, humidity: 90 },
    });
    expect(impact.factors).toContain('Humedad alta');
    expect(impact.score).toBeGreaterThanOrEqual(15);
  });

  it('detecta lluvia actual', () => {
    const impact = calculateWeatherImpact({
      ...mockWeatherData,
      current: {
        ...mockWeatherData.current,
        weather: [{ id: 501, main: 'Rain', description: 'lluvia', icon: '10d' }],
      },
    });
    expect(impact.factors).toContain('Lluvia actual');
    expect(impact.score).toBeGreaterThanOrEqual(30);
  });

  it('detecta temperatura extrema alta (>35°C)', () => {
    const impact = calculateWeatherImpact({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, temp: 38 },
    });
    expect(impact.factors).toContain('Temperatura extrema alta');
    expect(impact.score).toBeGreaterThanOrEqual(25);
  });

  it('detecta temperatura extrema baja (<5°C)', () => {
    const impact = calculateWeatherImpact({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, temp: 2 },
    });
    expect(impact.factors).toContain('Temperatura extrema baja');
    expect(impact.score).toBeGreaterThanOrEqual(25);
  });

  it('nivel critical para score >= 70', () => {
    const impact = calculateWeatherImpact({
      ...mockWeatherData,
      current: {
        ...mockWeatherData.current,
        wind_speed: 15, humidity: 90, temp: 40,
        weather: [{ id: 501, main: 'Rain', description: 'lluvia', icon: '10d' }],
      },
    });
    expect(impact.level).toBe('critical');
    expect(impact.score).toBeGreaterThanOrEqual(70);
  });

  it('nivel high para score >= 50', () => {
    const impact = calculateWeatherImpact({
      ...mockWeatherData,
      current: {
        ...mockWeatherData.current,
        wind_speed: 12, temp: 38, humidity: 88,
      },
    });
    expect(impact.level).toBe('high' as const);
    expect(impact.score).toBeGreaterThanOrEqual(50);
    expect(impact.score).toBeLessThan(70);
  });

  it('nivel medium para score >= 30', () => {
    const impact = calculateWeatherImpact({
      ...mockWeatherData,
      current: {
        ...mockWeatherData.current,
        wind_speed: 12, humidity: 88,
      },
    });
    expect(impact.level).toBe('medium' as const);
    expect(impact.score).toBeGreaterThanOrEqual(30);
    expect(impact.score).toBeLessThan(50);
  });
});

describe('calculateConstructionMetrics', () => {
  it('concreteCuring suitable en condiciones normales', () => {
    const metrics = calculateConstructionMetrics({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, temp: 22, humidity: 60 },
    });
    expect(metrics.concreteCuring.suitable).toBe(true);
  });

  it('concreteCuring no suitable con temperatura extrema', () => {
    const metrics = calculateConstructionMetrics({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, temp: 38, humidity: 60 },
    });
    expect(metrics.concreteCuring.suitable).toBe(false);
    expect(metrics.concreteCuring.recommendations.length).toBeGreaterThan(0);
  });

  it('cranes no suitable con vientos fuertes', () => {
    const metrics = calculateConstructionMetrics({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, wind_speed: 18 },
    });
    expect(metrics.equipmentOperation.cranes.suitable).toBe(false);
  });

  it('cranes suitable con vientos normales', () => {
    const metrics = calculateConstructionMetrics({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, wind_speed: 5 },
    });
    expect(metrics.equipmentOperation.cranes.suitable).toBe(true);
  });

  it('welding no suitable con viento > 8 m/s', () => {
    const metrics = calculateConstructionMetrics({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, wind_speed: 10, humidity: 50 },
    });
    expect(metrics.equipmentOperation.welding.suitable).toBe(false);
  });

  it('workforceSafety heatStressRisk moderate con calor', () => {
    const metrics = calculateConstructionMetrics({
      ...mockWeatherData,
      current: { ...mockWeatherData.current, temp: 35, humidity: 50 },
    });
    expect(metrics.workforceSafety.heatStressRisk).toBe('moderate');
    expect(metrics.workforceSafety.hydrationRequired).toBe(true);
  });

  it('materialProtection detecta materiales a proteger en lluvia', () => {
    const metrics = calculateConstructionMetrics({
      ...mockWeatherData,
      current: {
        ...mockWeatherData.current,
        weather: [{ id: 501, main: 'Rain', description: 'lluvia', icon: '10d' }],
        humidity: 85,
      },
    });
    expect(metrics.materialProtection.protectionRequired).toBe(true);
    expect(metrics.materialProtection.materialsToProtect).toContain('Cemento');
    expect(metrics.materialProtection.materialsToProtect).toContain('Madera');
  });
});

describe('calculateSchedulingWindows', () => {
  it('genera ventanas para forecast de 7 días', () => {
    const windows = calculateSchedulingWindows(mockEmptyForecast, 7);
    expect(windows.length).toBeLessThanOrEqual(7);
    expect(windows.length).toBeGreaterThan(0);
  });

  it('calcula score y suitable correctamente', () => {
    const windows = calculateSchedulingWindows(mockEmptyForecast, 3);
    windows.forEach(w => {
      expect(w.score).toBeGreaterThanOrEqual(0);
      expect(w.score).toBeLessThanOrEqual(100);
      expect(w.conditions.length).toBeGreaterThan(0);
    });
  });

  it('incluye bestActivities y avoidActivities', () => {
    const windows = calculateSchedulingWindows(mockEmptyForecast, 3);
    windows.forEach(w => {
      expect(Array.isArray(w.bestActivities)).toBe(true);
      expect(Array.isArray(w.avoidActivities)).toBe(true);
    });
  });
});

describe('isWeatherDataStale', () => {
  it('retorna false para datos recién obtenidos', () => {
    const freshData = { ...mockWeatherData, fetched_at: Date.now() };
    expect(isWeatherDataStale(freshData, 60)).toBe(false);
  });

  it('retorna true para datos viejos', () => {
    const staleData = { ...mockWeatherData, fetched_at: Date.now() - 3600000 * 2 };
    expect(isWeatherDataStale(staleData, 60)).toBe(true);
  });

  it('usa maxAgeMinutes correctamente', () => {
    const data = { ...mockWeatherData, fetched_at: Date.now() - 1800000 };
    expect(isWeatherDataStale(data, 10)).toBe(true);
    expect(isWeatherDataStale(data, 60)).toBe(false);
  });
});

describe('formatWeatherDescription', () => {
  it('capitaliza primera letra', () => {
    expect(formatWeatherDescription('cielo despejado')).toBe('Cielo despejado');
  });

  it('maneja string vacío', () => {
    expect(formatWeatherDescription('')).toBe('');
  });
});

describe('getWeatherIconUrl', () => {
  it('genera URL correcta', () => {
    const url = getWeatherIconUrl('01d');
    expect(url).toBe('https://openweathermap.org/img/wn/01d@2x.png');
  });
});

describe('getHistoricalWeatherImpact', () => {
  it('retorna correlación 0 sin datos históricos', () => {
    const result = getHistoricalWeatherImpact(mockWeatherData, []);
    expect(result.correlation).toBe(0);
    expect(result.recommendations).toContain('Recolectar más datos históricos para análisis preciso');
  });

  it('calcula probabilidad de retraso con datos históricos', () => {
    const result = getHistoricalWeatherImpact(mockWeatherData, [10, 20, 15]);
    expect(result.weatherDelayProbability).toBeGreaterThan(0);
    expect(result.weatherDelayProbability).toBeLessThanOrEqual(0.9);
  });
});

describe('Schema Validation', () => {
  it('weatherDataSchema valida datos correctos', () => {
    const result = weatherDataSchema.safeParse(mockWeatherData);
    expect(result.success).toBe(true);
  });

  it('weatherDataSchema rechaza datos inválidos', () => {
    const invalid = { ...mockWeatherData, current: null };
    const result = weatherDataSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('proyectoWeatherSchema valida proyecto weather', () => {
    const pw = {
      proyectoId: 'test-id',
      weatherData: mockWeatherData,
      impact: calculateWeatherImpact(mockWeatherData),
      lastUpdated: new Date().toISOString(),
      enabled: true,
      autoRefresh: true,
      refreshInterval: 60,
      alertThreshold: 'high' as const,
    };
    const result = proyectoWeatherSchema.safeParse(pw);
    expect(result.success).toBe(true);
  });
});
