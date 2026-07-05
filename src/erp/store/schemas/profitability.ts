import { z } from 'zod';

export const projectProfitabilitySchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  periodo: z.string(),
  presupuestoTotal: z.number().default(0),
  costoReal: z.number().default(0),
  ingresoReal: z.number().default(0),
  utilidadBruta: z.number().default(0),
  margenBruto: z.number().default(0),
  variacionPresupuesto: z.number().default(0),
  estadoRentabilidad: z.enum(['excelente','bueno','aceptable','riesgoso','critico'] as const).default('aceptable'),
  eficienciaLabor: z.number().default(0),
  desperdicioMateriales: z.number().default(0),
  utilizacionEquipo: z.number().default(0),
  scoreEficiencia: z.number().default(0),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString()),
});

export const clientProfitabilitySchema = z.object({
  id: z.string(),
  cliente: z.string(),
  clienteNit: z.string().optional().default(''),
  proyectosCount: z.number().default(0),
  valorTotalContratos: z.number().default(0),
  costoTotalReal: z.number().default(0),
  utilidadTotal: z.number().default(0),
  margenPromedio: z.number().default(0),
  proyectoMasRentable: z.string().optional(),
  proyectoMenosRentable: z.string().optional(),
  valorVidaCliente: z.number().default(0),
  probabilidadRetencion: z.number().default(0),
  segmento: z.enum(['vip','premium','estandar','bajo_margen'] as const).default('estandar'),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString()),
});

export const profitabilityForecastSchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  tipoProyeccion: z.enum(['rentabilidad','flujo_caja','plazo','margen'] as const).default('rentabilidad'),
  fechaProyeccion: z.string(),
  fechaBase: z.string(),
  valorActual: z.number().default(0),
  valorProyectado: z.number().default(0),
  confianza: z.number().default(0),
  factoresRiesgo: z.array(z.string()).default([]),
  factoresOportunidad: z.array(z.string()).default([]),
  escenarioOptimista: z.number().default(0),
  escenarioBase: z.number().default(0),
  escenarioPesimista: z.number().default(0),
  modeloVersion: z.string().default('v1.0'),
  createdAt: z.string().default(new Date().toISOString()),
});

export const resourceEfficiencySchema = z.object({
  id: z.string(),
  proyectoId: z.string(),
  tipoRecurso: z.enum(['mano_obra','materiales','equipo','subcontratos'] as const),
  costoPlaneado: z.number().default(0),
  costoReal: z.number().default(0),
  eficiencia: z.number().default(0),
  desperdicio: z.number().default(0),
  productividad: z.number().default(0),
  unidadesProducidas: z.number().default(0),
  unidadesPlaneadas: z.number().default(0),
  alertaDesviacion: z.boolean().default(false),
  umbralAlerta: z.number().default(0.15),
  createdAt: z.string().default(new Date().toISOString()),
  updatedAt: z.string().default(new Date().toISOString()),
});

export const profitabilityTrendSchema = z.object({
  id: z.string(),
  periodo: z.string(),
  tipoAnalisis: z.enum(['rentabilidad_global','por_tipologia','por_cliente','por_temporada'] as const),
  agrupador: z.string().optional(),
  proyectosActivos: z.number().default(0),
  rentabilidadPromedio: z.number().default(0),
  margenPromedio: z.number().default(0),
  tendencias: z.record(z.string(), z.number()).default({}),
  alertas: z.array(z.string()).default([]),
  oportunidades: z.array(z.string()).default([]),
  createdAt: z.string().default(new Date().toISOString()),
});

export const pricingOptimizationSchema = z.object({
  id: z.string(),
  tipologia: z.enum(['residencial','comercial','industrial','civil','publica'] as const),
  subtipo: z.string().optional(),
  margenHistoricoPromedio: z.number().default(0),
  margenObjetivo: z.number().default(0),
  factorRiesgo: z.number().default(0),
  complejidadPromedio: z.number().default(0),
  precioSugeridoBase: z.number().default(0),
  ajusteEstacional: z.number().default(0),
  ajusteDemanda: z.number().default(0),
  precioOptimizado: z.number().default(0),
  confianzaRecomendacion: z.number().default(0),
  fechaActualizacion: z.string().default(new Date().toISOString()),
  createdAt: z.string().default(new Date().toISOString()),
});

export type ProjectProfitability = z.infer<typeof projectProfitabilitySchema>;
export type ClientProfitability = z.infer<typeof clientProfitabilitySchema>;
export type ProfitabilityForecast = z.infer<typeof profitabilityForecastSchema>;
export type ResourceEfficiency = z.infer<typeof resourceEfficiencySchema>;
export type ProfitabilityTrend = z.infer<typeof profitabilityTrendSchema>;
export type PricingOptimization = z.infer<typeof pricingOptimizationSchema>;
