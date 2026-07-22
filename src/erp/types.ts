import { z } from 'zod';
import {
  proyectoSchema,
  presupuestoSchema,
  cotizacionSchema,
  renglonPresupuestoZ,
  insumoZ,
  subRenglonZ,
  factorSobrecostoZ,
  movimientoSchema,
  cuentaCobrarSchema,
  cuentaPagarSchema,
  ventaPaqueteSchema,
  hitoSchema,
  riesgoSchema,
  avanceObraSchema,
  seguimientoSchema,
  clienteSchema,
  proveedorSchema,
  ordenCambioSchema,
  empleadoSchema,
  incidenteSchema,
  materialSchema,
  ordenSchema,
  valeSalidaSchema,
  activoSchema,
  licitacionSchema,
  cuadroSchema,
  pagoProveedorSchema,
  planoSchema,
  rfiSchema,
  submittalSchema,
  destajoSchema,
  recepcionAlmacenSchema,
  insumosBaseSchema,
  liberacionSchema,
  pruebaSchema,
  noConformidadSchema,
  eventoSchema,
  bitacoraSchema,
  muroSchema,
  notificacionSchema,
  centroCostoSchema,
  auditLogSchema,
  appSettingsSchema,
  plantillaSchema,
  weatherDataSchema,
  proyectoWeatherSchema,
  calculoProyectoSchema,
  snapshotCalculoSchema,
  comparacionCalculosSchema,
  historialAplicacionReglaSchema,
  reglaFactorSchema,
  normativaDepartamentalSchema,
  escalaProduccionSchema,
  estacionalidadSchema,
  ajusteEstacionalActividadSchema,
  aplicacionEscalaSchema,
  cumplimientoNormativoSchema,
  projectProfitabilitySchema,
  clientProfitabilitySchema,
  profitabilityForecastSchema,
  resourceEfficiencySchema,
  profitabilityTrendSchema,
  pricingOptimizationSchema,
  consumoHistoricoSchema,
  patronConsumoSchema,
  proveedorLeadTimeSchema,
  reorderSuggestionSchema,
  reorderConfigSchema,
  errorLogSchema,
  accessLogSchema,
  cajaChicaSchema,
  anticipoSchema,
  amortizacionSchema,
  rendimientoCuadrillaSchema,
  bodegaSchema,
  documentoSchema,
  permisoSchema,
  checklistSchema,
  configuracionSchema,
  apiKeySchema,
} from './store/schemas/index';

export type Tipologia = 'residencial' | 'comercial' | 'industrial' | 'civil' | 'publica';
export type EtapaObra = 'planificacion' | 'diseno' | 'preconstruccion' | 'construccion' | 'cierre';
export type TipoObra = 'nueva' | 'remodelacion' | 'ampliacion';
export type EstadoProyecto = 'planeado' | 'ejecucion' | 'pausado' | 'finalizado' | 'cancelado';
export type Moneda = 'GTQ' | 'USD';
export type Categoria = 'materiales' | 'mano_obra' | 'equipo' | 'subcontrato' | 'administracion' | 'transporte' | 'imprevistos' | 'marketing' | 'licencias' | 'seguros' | 'otros';

export const APP_STAGES: Record<string, string> = {
  planificacion: 'Planificación',
  diseno: 'Diseño',
  preconstruccion: 'Pre-construcción',
  construccion: 'Construcción',
  cierre: 'Cierre',
};

export type Proyecto = z.infer<typeof proyectoSchema>;
export type Presupuesto = z.infer<typeof presupuestoSchema>;
export type CotizacionCliente = z.infer<typeof cotizacionSchema>;
export type RenglonPresupuesto = z.infer<typeof renglonPresupuestoZ>;
export type Insumo = z.infer<typeof insumoZ>;
export type SubRenglon = z.infer<typeof subRenglonZ>;
export type FactorSobrecosto = z.infer<typeof factorSobrecostoZ>;
export type Movimiento = z.infer<typeof movimientoSchema>;
export type CuentaCobrar = z.infer<typeof cuentaCobrarSchema>;
export type CuentaPagar = z.infer<typeof cuentaPagarSchema>;
export type VentaPaquete = z.infer<typeof ventaPaqueteSchema>;
export type Hito = z.infer<typeof hitoSchema>;
export type Riesgo = z.infer<typeof riesgoSchema>;
export type AvanceObra = z.infer<typeof avanceObraSchema>;
export type Seguimiento = z.infer<typeof seguimientoSchema>;
export type SeguimientoEVM = Seguimiento;
export type Cliente = z.infer<typeof clienteSchema>;
export type Proveedor = z.infer<typeof proveedorSchema>;
export type OrdenCambio = z.infer<typeof ordenCambioSchema>;
export type Empleado = z.infer<typeof empleadoSchema>;
export type Incidente = z.infer<typeof incidenteSchema>;
export type Material = z.infer<typeof materialSchema>;
export type Orden = z.infer<typeof ordenSchema>;
export type ValeSalida = z.infer<typeof valeSalidaSchema>;
export type Activo = z.infer<typeof activoSchema>;
export type Licitacion = z.infer<typeof licitacionSchema>;
export type Plano = z.infer<typeof planoSchema>;
export type RFI = z.infer<typeof rfiSchema>;
export type Submittal = z.infer<typeof submittalSchema>;
export type Destajo = z.infer<typeof destajoSchema>;
export type RecepcionAlmacen = z.infer<typeof recepcionAlmacenSchema>;
export type InsumosBase = z.infer<typeof insumosBaseSchema>;
export type Liberacion = z.infer<typeof liberacionSchema>;
export type Prueba = z.infer<typeof pruebaSchema>;
export type NoConformidad = z.infer<typeof noConformidadSchema>;
export type Evento = z.infer<typeof eventoSchema>;
export type Bitacora = z.infer<typeof bitacoraSchema>;
export type Muro = z.infer<typeof muroSchema>;
export type Notificacion = z.infer<typeof notificacionSchema>;
export type CentroCosto = z.infer<typeof centroCostoSchema>;
export type LogAuditoria = z.infer<typeof auditLogSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
export type Plantilla = z.infer<typeof plantillaSchema>;
export type WeatherData = z.infer<typeof weatherDataSchema>;
export type ProyectoWeather = z.infer<typeof proyectoWeatherSchema>;
export type CalculoProyecto = z.infer<typeof calculoProyectoSchema>;
export type SnapshotCalculo = z.infer<typeof snapshotCalculoSchema>;
export type ComparacionCalculos = z.infer<typeof comparacionCalculosSchema>;
export type HistorialAplicacionRegla = z.infer<typeof historialAplicacionReglaSchema>;
export type ReglaFactor = z.infer<typeof reglaFactorSchema>;
export type NormativaDepartamental = z.infer<typeof normativaDepartamentalSchema>;
export type EscalaProduccion = z.infer<typeof escalaProduccionSchema>;
export type Estacionalidad = z.infer<typeof estacionalidadSchema>;
export type AjusteEstacionalActividad = z.infer<typeof ajusteEstacionalActividadSchema>;
export type AplicacionEscala = z.infer<typeof aplicacionEscalaSchema>;
export type CumplimientoNormativo = z.infer<typeof cumplimientoNormativoSchema>;
export type ProjectProfitability = z.infer<typeof projectProfitabilitySchema>;
export type ClientProfitability = z.infer<typeof clientProfitabilitySchema>;
export type ProfitabilityForecast = z.infer<typeof profitabilityForecastSchema>;
export type ResourceEfficiency = z.infer<typeof resourceEfficiencySchema>;
export type ProfitabilityTrend = z.infer<typeof profitabilityTrendSchema>;
export type PricingOptimization = z.infer<typeof pricingOptimizationSchema>;
export type ConsumoHistorico = z.infer<typeof consumoHistoricoSchema>;
export type PatronConsumo = z.infer<typeof patronConsumoSchema>;
export type ProveedorLeadTime = z.infer<typeof proveedorLeadTimeSchema>;
export type ReorderSuggestion = z.infer<typeof reorderSuggestionSchema>;
export type ReorderConfig = z.infer<typeof reorderConfigSchema>;
export type ErrorLogEntry = z.infer<typeof errorLogSchema>;
export type AccessLog = z.infer<typeof accessLogSchema>;
export type CajaChica = z.infer<typeof cajaChicaSchema>;
export type Anticipo = z.infer<typeof anticipoSchema>;
export type Amortizacion = z.infer<typeof amortizacionSchema>;
export type AmortizacionItem = Amortizacion;
export type RendimientoCuadrilla = z.infer<typeof rendimientoCuadrillaSchema>;
export type Bodega = z.infer<typeof bodegaSchema>;
export type Documento = z.infer<typeof documentoSchema>;
export type Permiso = z.infer<typeof permisoSchema>;
export type Checklist = z.infer<typeof checklistSchema>;
export type Configuracion = z.infer<typeof configuracionSchema>;
export type ApiKey = z.infer<typeof apiKeySchema>;

export interface EmpleadoProyecto {
  id: string;
  empleadoId: string;
  proyectoId: string;
  fechaAsignacion: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaterialProyecto {
  id: string;
  materialId: string;
  proyectoId: string;
  cantidadPresupuestada?: number;
  costoPresupuestado?: number;
  ultimaActualizacionPresupuesto?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierPerformance {
  proveedorId: string;
  proveedorNombre: string;
  totalOrdenes: number;
  ordenesCompletadas: number;
  ordenesRetrasadas: number;
  tiempoPromedioEntregaDias: number;
  calificacionPromedio: number;
  montoTotalComprado: number;
  proyectoId?: string;
}

export interface DepartamentoGT {
  codigo: string;
  nombre: string;
  codigoISO?: string;
}

export interface MunicipioGT {
  codigo: string;
  nombre: string;
  departamentoCodigo: string;
  altitudMsnm?: number;
}

export interface ActivoLogistica {
  id: string;
  nombre: string;
  tipo: string;
  costo: number;
  estado: string;
}

export interface CuadroComparativo {
  id: string;
  proveedorId: string;
  descripcion: string;
  montoTotal: number;
  estado: string;
}

export interface PagoProveedor {
  id: string;
  proveedorId: string;
  monto: number;
  estado: string;
  fecha: string;
}
