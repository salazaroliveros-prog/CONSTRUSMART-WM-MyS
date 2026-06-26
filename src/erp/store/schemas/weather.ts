import { z } from 'zod';

const weatherConditionSchema = z.object({
  id: z.number(),
  main: z.string(),
  description: z.string(),
  icon: z.string(),
});

const currentWeatherSchema = z.object({
  temp: z.number(),
  feels_like: z.number(),
  humidity: z.number(),
  wind_speed: z.number(),
  wind_deg: z.number(),
  visibility: z.number(),
  weather: z.array(weatherConditionSchema),
});

const forecastItemSchema = z.object({
  dt: z.number(),
  main: z.object({
    temp: z.number(),
    temp_min: z.number(),
    temp_max: z.number(),
    humidity: z.number(),
  }),
  weather: z.array(weatherConditionSchema),
  wind: z.object({
    speed: z.number(),
    deg: z.number(),
  }),
  rain: z.object({ '3h': z.number() }).optional(),
  snow: z.object({ '3h': z.number() }).optional(),
});

const weatherImpactSchema = z.object({
  score: z.number(),
  level: z.enum(['low', 'medium', 'high', 'critical']),
  factors: z.array(z.string()),
  recommendations: z.array(z.string()),
});

const concreteCuringSchema = z.object({
  suitable: z.boolean(),
  tempRange: z.string(),
  humidityRange: z.string(),
  recommendations: z.array(z.string()),
});

const equipmentOperationSchema = z.object({
  cranes: z.object({ suitable: z.boolean(), reason: z.string() }),
  excavators: z.object({ suitable: z.boolean(), reason: z.string() }),
  welding: z.object({ suitable: z.boolean(), reason: z.string() }),
});

const workforceSafetySchema = z.object({
  heatIndex: z.number(),
  heatStressRisk: z.enum(['low', 'moderate', 'high', 'extreme']),
  hydrationRequired: z.boolean(),
  workScheduleAdjustment: z.string(),
});

const materialProtectionSchema = z.object({
  materialsToProtect: z.array(z.string()),
  protectionRequired: z.boolean(),
  urgency: z.enum(['low', 'medium', 'high']),
});

const constructionMetricsSchema = z.object({
  concreteCuring: concreteCuringSchema,
  equipmentOperation: equipmentOperationSchema,
  workforceSafety: workforceSafetySchema,
  materialProtection: materialProtectionSchema,
});

const schedulingWindowSchema = z.object({
  date: z.string(),
  suitable: z.boolean(),
  conditions: z.array(z.string()),
  score: z.number(),
  bestActivities: z.array(z.string()),
  avoidActivities: z.array(z.string()),
});

const historicalWeatherImpactSchema = z.object({
  correlation: z.number(),
  weatherDelayProbability: z.number(),
  recommendations: z.array(z.string()),
});

export const weatherDataSchema = z.object({
  current: currentWeatherSchema,
  forecast: z.array(forecastItemSchema),
  location: z.string(),
  lat: z.number(),
  lon: z.number(),
  fetched_at: z.number(),
});

export const proyectoWeatherSchema = z.object({
  proyectoId: z.string(),
  weatherData: weatherDataSchema.optional(),
  impact: weatherImpactSchema.optional(),
  constructionMetrics: constructionMetricsSchema.optional(),
  schedulingWindows: z.array(schedulingWindowSchema).optional(),
  historicalImpact: historicalWeatherImpactSchema.optional(),
  lastUpdated: z.string().optional(),
  enabled: z.boolean().default(true),
  autoRefresh: z.boolean().default(true),
  refreshInterval: z.number().default(60),
  alertThreshold: z.enum(['low', 'medium', 'high', 'critical']).default('high'),
});

export type WeatherData = z.infer<typeof weatherDataSchema>;
export type WeatherImpact = z.infer<typeof weatherImpactSchema>;
export type ConstructionMetrics = z.infer<typeof constructionMetricsSchema>;
export type SchedulingWindow = z.infer<typeof schedulingWindowSchema>;
export type HistoricalWeatherImpact = z.infer<typeof historicalWeatherImpactSchema>;
export type ProyectoWeather = z.infer<typeof proyectoWeatherSchema>;
export type ProyectoWeatherStore = ProyectoWeather[];