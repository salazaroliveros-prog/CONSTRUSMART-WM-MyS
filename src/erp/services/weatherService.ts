import { safeLogger } from '@/lib/safeLogger';
import type {
  WeatherData, WeatherImpact, ConstructionMetrics, SchedulingWindow, WeatherHistoryItem
} from '../store/schemas/weather';

interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  visibility: number;
  weather: { id: number; main: string; description: string; icon: string }[];
}

interface ForecastItem {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  wind: { speed: number; deg: number };
  rain?: { '3h': number };
  snow?: { '3h': number };
}

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const CACHE_PREFIX = 'weather_cache_';
const CACHE_PREFIX_FORECAST = 'weather_forecast_cache_';
const CACHE_DURATION_CURRENT  = 30 * 60 * 1000;   // 30 min — clima actual
const CACHE_DURATION_FORECAST = 7 * 24 * 60 * 60 * 1000; // 7 días — pronóstico

const WEATHER_RATE_LIMIT_MS = 60000;
const WEATHER_MAX_CALLS = 10;
const weatherCallTimestamps: number[] = [];

function checkWeatherRateLimit(): boolean {
  const now = Date.now();
  const windowStart = now - WEATHER_RATE_LIMIT_MS;
  while (weatherCallTimestamps.length > 0 && weatherCallTimestamps[0] < windowStart) {
    weatherCallTimestamps.shift();
  }
  if (weatherCallTimestamps.length >= WEATHER_MAX_CALLS) {
    safeLogger.warn('[Weather RateLimit] Excedido límite de 10 llamadas por minuto');
    return false;
  }
  weatherCallTimestamps.push(now);
  return true;
}

function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

function getCachedData(lat: number, lon: number): WeatherData | null {
  try {
    const cacheKey = `${CACHE_PREFIX}${lat}_${lon}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    const data = JSON.parse(cached) as WeatherData;
    const age = Date.now() - data.fetched_at;
    if (age > CACHE_DURATION_CURRENT) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return data;
  } catch (error) {
    safeLogger.error('Error reading weather cache:', error);
    return null;
  }
}

/** Devuelve el pronóstico cacheado si tiene menos de 7 días. */
function getCachedForecast(lat: number, lon: number): ForecastItem[] | null {
  try {
    const key = `${CACHE_PREFIX_FORECAST}${lat}_${lon}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: ForecastItem[]; ts: number };
    if (Date.now() - ts > CACHE_DURATION_FORECAST) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedForecast(lat: number, lon: number, data: ForecastItem[]): void {
  try {
    const key = `${CACHE_PREFIX_FORECAST}${lat}_${lon}`;
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch (error) {
    console.error('Error caching forecast data:', error);
  }
}

function setCachedData(data: WeatherData): void {
  try {
    const cacheKey = `${CACHE_PREFIX}${data.lat}_${data.lon}`;
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    safeLogger.error('Error writing weather cache:', error);
  }
}

function clearWeatherCache(): void {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_PREFIX_FORECAST))
      .forEach(key => localStorage.removeItem(key));
  } catch (error) {
    safeLogger.error('Error clearing weather cache:', error);
  }
}

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      
      if (response.status === 401) {
        throw new Error('Invalid API key - check VITE_OPENWEATHER_API_KEY');
      }
      if (response.status === 429) {
        throw new Error('API rate limit exceeded - please try again later');
      }
      if (response.status >= 500) {
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
          continue;
        }
      }
      
      throw new Error(`Weather API error: ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      if (!isOnline()) throw new Error('No internet connection');
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather | null> {
  if (!API_KEY) {
    safeLogger.warn('OpenWeatherMap API key not configured');
    return null;
  }

  if (!checkWeatherRateLimit()) {
    safeLogger.warn('[Weather] Rate limit alcanzado, usando caché');
    const cached = getCachedData(lat, lon);
    return cached?.current || null;
  }

  if (!isOnline()) {
    safeLogger.warn('Offline mode - using cached data if available');
    const cached = getCachedData(lat, lon);
    return cached?.current || null;
  }

  try {
    const response = await fetchWithRetry(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
    );

    const data = await response.json();
    return {
      temp: data.main.temp,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
      wind_speed: data.wind.speed,
      wind_deg: data.wind.deg,
      visibility: data.visibility,
      weather: data.weather,
    };
  } catch (error) {
    safeLogger.error('Error fetching current weather:', error);
    const cached = getCachedData(lat, lon);
    if (cached) {
      safeLogger.info('Using cached weather data');
      return cached.current;
    }
    return null;
  }
}

export async function getForecast(lat: number, lon: number, days: number = 7): Promise<ForecastItem[] | null> {
  if (!API_KEY) {
    safeLogger.warn('OpenWeatherMap API key not configured');
    return null;
  }

  if (!checkWeatherRateLimit()) {
    safeLogger.warn('[Weather] Rate limit alcanzado, usando caché de pronóstico');
    const cachedForecast = getCachedForecast(lat, lon);
    if (cachedForecast) return cachedForecast;
    return getCachedData(lat, lon)?.forecast || null;
  }

  // Usar caché de 7 días antes de ir a la red
  const cachedForecast = getCachedForecast(lat, lon);
  if (cachedForecast) {
    safeLogger.info('Using 7-day cached forecast');
    return cachedForecast;
  }

  if (!isOnline()) {
    safeLogger.warn('Offline mode - no forecast cache available');
    return getCachedData(lat, lon)?.forecast || null;
  }

  try {
    const response = await fetchWithRetry(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es&cnt=${days * 8}`
    );
    const data = await response.json();
    const list: ForecastItem[] = data.list;
    setCachedForecast(lat, lon, list);
    return list;
  } catch (error) {
    safeLogger.error('Error fetching forecast:', error);
    return getCachedData(lat, lon)?.forecast || null;
  }
}

export async function getCompleteWeatherData(lat: number, lon: number, location: string): Promise<WeatherData | null> {
  const cached = getCachedData(lat, lon);
  if (cached && !isWeatherDataStale(cached, 30)) {
    safeLogger.info('Using cached weather data (still fresh)');
    return cached;
  }

  const [current, forecast] = await Promise.all([
    getCurrentWeather(lat, lon),
    getForecast(lat, lon),
  ]);

  if (!current || !forecast) {
    if (cached) {
      safeLogger.info('API failed, returning cached data');
      return cached;
    }
    return null;
  }

  const weatherData: WeatherData = {
    current,
    forecast,
    location,
    lat,
    lon,
    fetched_at: Date.now(),
  };

  setCachedData(weatherData);
  return weatherData;
}

export { clearWeatherCache };

export function calculateWeatherImpact(weather: WeatherData): WeatherImpact {
  const factors: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  const { current, forecast } = weather;

  if (current.wind_speed > 10) {
    score += 20;
    factors.push('Vientos fuertes');
    recommendations.push('Suspender trabajos en altura');
  }

  if (current.humidity > 85) {
    score += 15;
    factors.push('Humedad alta');
    recommendations.push('Evitar pintura y acabados');
  }

  if (current.weather.some(w => w.main === 'Rain' || w.main === 'Drizzle')) {
    score += 30;
    factors.push('Lluvia actual');
    recommendations.push('Proteger materiales y equipos');
  }

  if (current.weather.some(w => w.main === 'Snow')) {
    score += 40;
    factors.push('Nieve');
    recommendations.push('Suspender actividades al exterior');
  }

  if (current.temp > 35) {
    score += 25;
    factors.push('Temperatura extrema alta');
    recommendations.push('Implementar pausas hidratación');
  }

  if (current.temp < 5) {
    score += 25;
    factors.push('Temperatura extrema baja');
    recommendations.push('Proteger contra congelamiento');
  }

  const next3Days = forecast.slice(0, 24);
  const rainDays = next3Days.filter(day => 
    day.weather.some(w => w.main === 'Rain' || w.main === 'Drizzle' || w.main === 'Thunderstorm')
  ).length;

  if (rainDays >= 2) {
    score += 20;
    factors.push('Lluvia pronosticada múltiples días');
    recommendations.push('Reprogramar actividades críticas');
  }

  const level: WeatherImpact['level'] = 
    score >= 70 ? 'critical' : 
    score >= 50 ? 'high' : 
    score >= 30 ? 'medium' : 'low';

  return { score, level, factors, recommendations };
}

export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

export function formatWeatherDescription(description: string): string {
  return description.charAt(0).toUpperCase() + description.slice(1);
}

export function isWeatherDataStale(weather: WeatherData, maxAgeMinutes: number = 60): boolean {
  const age = Date.now() - weather.fetched_at;
  return age > maxAgeMinutes * 60 * 1000;
}

export function calculateConstructionMetrics(weather: WeatherData): ConstructionMetrics {
  const { current, forecast } = weather;
  
  const concreteCuring = {
    suitable: current.temp >= 5 && current.temp <= 32 && current.humidity >= 40 && current.humidity <= 85,
    tempRange: current.temp >= 5 && current.temp <= 32 ? 'Adecuada (5-32°C)' : 'Inadecuada',
    humidityRange: current.humidity >= 40 && current.humidity <= 85 ? 'Adecuada (40-85%)' : 'Inadecuada',
    recommendations: []
  };
  
  if (!concreteCuring.suitable) {
    if (current.temp < 5) concreteCuring.recommendations.push('Usar aditivos anticongelantes');
    if (current.temp > 32) concreteCuring.recommendations.push('Curar con agua fresca, proteger del sol');
    if (current.humidity < 40) concreteCuring.recommendations.push('Mantener humedad constante');
    if (current.humidity > 85) concreteCuring.recommendations.push('Ventilar para evitar exceso de humedad');
  }
  
  const equipmentOperation = {
    cranes: {
      suitable: current.wind_speed < 15,
      reason: current.wind_speed >= 15 ? 'Vientos fuertes (>15 m/s) riesgo de volteo' : 'Condiciones normales'
    },
    excavators: {
      suitable: !current.weather.some(w => w.main === 'Rain' || w.main === 'Thunderstorm'),
      reason: current.weather.some(w => w.main === 'Rain') ? 'Lluvia afecta estabilidad' : 'Condiciones normales'
    },
    welding: {
      suitable: current.wind_speed < 8 && current.humidity < 70,
      reason: current.wind_speed >= 8 ? 'Viento afecta arco eléctrico' : current.humidity >= 70 ? 'Humedad alta afecta soldadura' : 'Condiciones normales'
    }
  };
  
  const heatIndex = calculateHeatIndex(current.temp, current.humidity);
  let heatStressRisk: ConstructionMetrics['workforceSafety']['heatStressRisk'] = 'low';
  if (heatIndex >= 54) heatStressRisk = 'extreme';
  else if (heatIndex >= 41) heatStressRisk = 'high';
  else if (heatIndex >= 32) heatStressRisk = 'moderate';
  
  const workforceSafety = {
    heatIndex,
    heatStressRisk,
    hydrationRequired: heatIndex >= 32,
    workScheduleAdjustment: heatIndex >= 41 ? 'Trabajo nocturno o pausas cada 30 min' : 
                           heatIndex >= 32 ? 'Pausas cada 45 min' : 'Horario normal'
  };
  
  const materialsToProtect: string[] = [];
  if (current.weather.some(w => w.main === 'Rain' || w.main === 'Drizzle')) {
    materialsToProtect.push('Cemento', 'Yeso', 'Materiales secos', 'Acero sin tratar');
  }
  if (current.humidity > 80) {
    materialsToProtect.push('Madera', 'Pinturas', 'Adhesivos');
  }
  if (current.temp > 35) {
    materialsToProtect.push('Pinturas', 'Adhesivos', 'Plásticos');
  }
  
  const next24HoursRain = forecast.slice(0, 8).some(f => 
    f.weather.some(w => w.main === 'Rain' || w.main === 'Thunderstorm')
  );
  
  const materialProtection = {
    materialsToProtect,
    protectionRequired: materialsToProtect.length > 0,
    urgency: (next24HoursRain ? 'high' : materialsToProtect.length > 2 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
  };
  
  return { concreteCuring, equipmentOperation, workforceSafety, materialProtection };
}

function calculateHeatIndex(tempC: number, humidity: number): number {
  const tempF = tempC * 9 / 5 + 32;
  if (tempF < 80) return tempC;
  
  const T = tempF;
  const RH = humidity;
  
  let HI = 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094));
  
  if (HI >= 80) {
    HI = -42.379 + 2.04901523 * T + 10.14333127 * RH 
         - 0.22475541 * T * RH - 0.00683783 * T * T 
         - 0.05481717 * RH * RH + 0.00122874 * T * T * RH 
         + 0.00085282 * T * RH * RH - 0.00000199 * T * T * RH * RH;
  }
  
  return (HI - 32) * 5 / 9;
}

export function calculateSchedulingWindows(weather: WeatherData, days: number = 7): SchedulingWindow[] {
  const windows: SchedulingWindow[] = [];
  const dailyForecasts = groupForecastByDay(weather.forecast);
  
  dailyForecasts.forEach((dayData, index) => {
    if (index >= days) return;
    
    const date = new Date(dayData[0].dt * 1000).toISOString().slice(0, 10);
    const avgTemp = dayData.reduce((sum, f) => sum + f.main.temp, 0) / dayData.length;
    const avgWind = dayData.reduce((sum, f) => sum + f.wind.speed, 0) / dayData.length;
    const hasRain = dayData.some(f => f.weather.some(w => w.main === 'Rain' || w.main === 'Thunderstorm'));
    const hasSnow = dayData.some(f => f.weather.some(w => w.main === 'Snow'));
    
    let score = 100;
    const conditions: string[] = [];
    const bestActivities: string[] = [];
    const avoidActivities: string[] = [];
    
    if (hasRain) {
      score -= 30;
      conditions.push('Lluvia esperada');
      avoidActivities.push('Trabajos exteriores', 'Pintura', 'Concreto fresco');
      bestActivities.push('Trabajos interiores', 'Planeación', 'Revisión de planos');
    }
    
    if (hasSnow) {
      score -= 50;
      conditions.push('Nieve esperada');
      avoidActivities.push('Todos los trabajos exteriores');
      bestActivities.push('Trabajos interiores', 'Mantenimiento de equipos');
    }
    
    if (avgWind > 10) {
      score -= 20;
      conditions.push('Vientos fuertes');
      avoidActivities.push('Grúas', 'Trabajos en altura', 'Soldadura exterior');
      bestActivities.push('Trabajos a nivel de suelo', 'Trabajos interiores');
    }
    
    if (avgTemp > 35) {
      score -= 15;
      conditions.push('Temperatura alta');
      avoidActivities.push('Trabajos intensivos al exterior', 'Pintura');
      bestActivities.push('Trabajos interiores', 'Trabajos matutinos');
    }
    
    if (avgTemp < 5) {
      score -= 15;
      conditions.push('Temperatura baja');
      avoidActivities.push('Concreto sin aditivos', 'Pintura');
      bestActivities.push('Trabajos interiores', 'Excavación (suelo congelado)');
    }
    
    if (score >= 80) conditions.push('Condiciones excelentes');
    else if (score >= 60) conditions.push('Condiciones buenas');
    else if (score >= 40) conditions.push('Condiciones aceptables');
    else conditions.push('Condiciones difíciles');
    
    if (bestActivities.length === 0) {
      bestActivities.push('Concreto', 'Estructuras', 'Instalaciones', 'Acabados');
    }
    
    windows.push({
      date,
      suitable: score >= 50,
      conditions,
      score,
      bestActivities,
      avoidActivities
    });
  });
  
  return windows;
}

function groupForecastByDay(forecast: ForecastItem[]): ForecastItem[][] {
  const days: Map<string, ForecastItem[]> = new Map();
  
  forecast.forEach(item => {
    const date = new Date(item.dt * 1000).toISOString().slice(0, 10);
    if (!days.has(date)) {
      days.set(date, []);
    }
    days.get(date)!.push(item);
  });
  
  return Array.from(days.values());
}

export function getHistoricalWeatherImpact(weather: WeatherData, historicalDelays: number[]): {
  correlation: number;
  weatherDelayProbability: number;
  recommendations: string[];
} {
  if (historicalDelays.length === 0) {
    return {
      correlation: 0,
      weatherDelayProbability: 0.2,
      recommendations: ['Recolectar más datos históricos para análisis preciso']
    };
  }
  
  const currentImpact = calculateWeatherImpact(weather);
  const avgHistoricalDelay = historicalDelays.reduce((a, b) => a + b, 0) / historicalDelays.length;
  
  let correlation = 0;
  if (currentImpact.level === 'critical') correlation = 0.8;
  else if (currentImpact.level === 'high') correlation = 0.6;
  else if (currentImpact.level === 'medium') correlation = 0.4;
  else correlation = 0.2;
  
  const weatherDelayProbability = Math.min(0.9, correlation * 0.8 + (avgHistoricalDelay / 100));
  
  const recommendations: string[] = [];
  if (weatherDelayProbability > 0.6) {
    recommendations.push('Considerar buffer del 15-20% en cronograma');
    recommendations.push('Tener planes de contingencia listos');
  }
  if (weatherDelayProbability > 0.4) {
    recommendations.push('Monitorear clima diariamente');
    recommendations.push('Priorizar actividades críticas en ventanas buenas');
  }
  
  return { correlation, weatherDelayProbability, recommendations };
}

