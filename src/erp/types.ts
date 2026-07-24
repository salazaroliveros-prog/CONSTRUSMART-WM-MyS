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

export type PublicacionMuro = Muro;

export type ComentarioMuro = {
  id: string;
  autor: string;
  autorAvatar?: string | null;
  contenido: string;
  createdAt: string;
};

export interface ErpData {
  proyectos: Proyecto[]; movimientos: Movimiento[]; empleados: Empleado[]; materiales: Material[];
  ordenes: OrdenCompra[]; proveedores: Proveedor[]; eventos: EventoCalendario[]; presupuestos: Presupuesto[];
  avances: AvanceObra[]; cuentasCobrar: CuentaCobrar[]; cuentasPagar: CuentaPagar[];
  ordenesCambio: OrdenCambio[]; hitos: Hito[]; riesgos: Riesgo[]; licitaciones: Licitacion[];
  cotizacionesNegocio: CotizacionCliente[]; ventasPaquetes: VentaPaquete[]; bitacora: Bitacora[];
  pruebas: PruebaLaboratorio[]; ncs: NoConformidad[]; valesSalida: ValeSalida[];
  seguimientoEVM: SeguimientoEVM[]; incidentes: Incidente[]; publicacionesMuro: PublicacionMuro[];
  liberaciones: LiberacionPartida[]; planos: Plano[]; rfis: RFI[]; submittals: Submittal[];
  activos: ActivoHerramienta[]; cuadros: CuadroComparativo[]; pagosProveedor: PagoProveedor[];
  destajos: Destajo[]; calculosProyecto: CalculoProyecto[]; recepciones: RecepcionAlmacen[]; centrosCosto: CentroCosto[];
  plantillas: Plantilla[];
  insumosBase: InsumoBase[];
  departamentos: DepartamentoGT[];
  municipios: MunicipioGT[];
  projectProfitabilities: ProjectProfitability[];
  clientProfitabilities: ClientProfitability[];
  resourceEfficiencies: ResourceEfficiency[];
  profitabilityTrends: ProfitabilityTrend[];
  reglasFactores: ReglaFactor[]; normativasDepartamentales: NormativaDepartamental[];
  escalasProduccion: EscalaProduccion[]; estacionalidad: Estacionalidad[];
  historialReglas: HistorialAplicacionRegla[];
  ajustesEstacionalesActividad: AjusteEstacionalActividad[];
  aplicacionEscalas: AplicacionEscala[];
  cumplimientoNormativo: CumplimientoNormativo[];
  mutationQueue: Mutation[]; syncMessage: string; syncCooldown: boolean; notificaciones: Notificacion[];
  auditLog: LogAuditoria[]; syncStatus: 'idle' | 'loading' | 'synced' | 'queued' | 'error';
  lastSyncedAt?: string; syncError?: string;
  isOnline: boolean; currentProjectId: string | null; appSettings: AppSettings;
  userRol: string | null; proyectoWeather: ProyectoWeather[];
  errorLogs: ErrorLogEntry[];
  anticipos: Anticipo[];
  cajasChicas: CajaChica[];
  rendimientosCampo: RendimientoCampo[];
}

export interface ErpActions {
  setProyectos: (v: Proyecto[] | ((prev: Proyecto[]) => Proyecto[])) => void;
  setMovimientos: (v: Movimiento[] | ((prev: Movimiento[]) => Movimiento[])) => void;
  setEmpleados: (v: Empleado[] | ((prev: Empleado[]) => Empleado[])) => void;
  setMateriales: (v: Material[] | ((prev: Material[]) => Material[])) => void;
  setOrdenes: (v: OrdenCompra[] | ((prev: OrdenCompra[]) => OrdenCompra[])) => void;
  setProveedores: (v: Proveedor[] | ((prev: Proveedor[]) => Proveedor[])) => void;
  setEventos: (v: EventoCalendario[] | ((prev: EventoCalendario[]) => EventoCalendario[])) => void;
  setPresupuestos: (v: Presupuesto[] | ((prev: Presupuesto[]) => Presupuesto[])) => void;
  setAvances: (v: AvanceObra[] | ((prev: AvanceObra[]) => AvanceObra[])) => void;
  setCuentasCobrar: (v: CuentaCobrar[] | ((prev: CuentaCobrar[]) => CuentaCobrar[])) => void;
  setCuentasPagar: (v: CuentaPagar[] | ((prev: CuentaPagar[]) => CuentaPagar[])) => void;
  setOrdenesCambio: (v: OrdenCambio[] | ((prev: OrdenCambio[]) => OrdenCambio[])) => void;
  setHitos: (v: Hito[] | ((prev: Hito[]) => Hito[])) => void;
  setRiesgos: (v: Riesgo[] | ((prev: Riesgo[]) => Riesgo[])) => void;
  setLicitaciones: (v: Licitacion[] | ((prev: Licitacion[]) => Licitacion[])) => void;
  setCotizacionesNegocio: (v: CotizacionCliente[] | ((prev: CotizacionCliente[]) => CotizacionCliente[])) => void;
  setVentasPaquetes: (v: VentaPaquete[] | ((prev: VentaPaquete[]) => VentaPaquete[])) => void;
  setBitacora: (v: Bitacora[] | ((prev: Bitacora[]) => Bitacora[])) => void;
  setPruebas: (v: PruebaLaboratorio[] | ((prev: PruebaLaboratorio[]) => PruebaLaboratorio[])) => void;
  setNcs: (v: NoConformidad[] | ((prev: NoConformidad[]) => NoConformidad[])) => void;
  setValesSalida: (v: ValeSalida[] | ((prev: ValeSalida[]) => ValeSalida[])) => void;
  setSeguimientoEVM: (v: SeguimientoEVM[] | ((prev: SeguimientoEVM[]) => SeguimientoEVM[])) => void;
  setIncidentes: (v: Incidente[] | ((prev: Incidente[]) => Incidente[])) => void;
  setPublicacionesMuro: (v: PublicacionMuro[] | ((prev: PublicacionMuro[]) => PublicacionMuro[])) => void;
  setLiberaciones: (v: LiberacionPartida[] | ((prev: LiberacionPartida[]) => LiberacionPartida[])) => void;
  setPlanos: (v: Plano[] | ((prev: Plano[]) => Plano[])) => void;
  setRfis: (v: RFI[] | ((prev: RFI[]) => RFI[])) => void;
  setSubmittals: (v: Submittal[] | ((prev: Submittal[]) => Submittal[])) => void;
  setActivos: (v: ActivoHerramienta[] | ((prev: ActivoHerramienta[]) => ActivoHerramienta[])) => void;
  setCuadros: (v: CuadroComparativo[] | ((prev: CuadroComparativo[]) => CuadroComparativo[])) => void;
  setPagosProveedor: (v: PagoProveedor[] | ((prev: PagoProveedor[]) => PagoProveedor[])) => void;
  setDestajos: (v: Destajo[] | ((prev: Destajo[]) => Destajo[])) => void;
  setCalculosProyecto: (v: CalculoProyecto[] | ((prev: CalculoProyecto[]) => CalculoProyecto[])) => void;
  setRecepciones: (v: RecepcionAlmacen[] | ((prev: RecepcionAlmacen[]) => RecepcionAlmacen[])) => void;
  setCentrosCosto: (v: CentroCosto[] | ((prev: CentroCosto[]) => CentroCosto[])) => void;
  setAnticipos: (v: Anticipo[] | ((prev: Anticipo[]) => Anticipo[])) => void;
  setCajasChicas: (v: CajaChica[] | ((prev: CajaChica[]) => CajaChica[])) => void;
  setPlantillas: (v: Plantilla[] | ((prev: Plantilla[]) => Plantilla[])) => void;
  setInsumosBase: (v: InsumoBase[] | ((prev: InsumoBase[]) => InsumoBase[])) => void;
  setProyectoWeather: (v: ProyectoWeather[] | ((prev: ProyectoWeather[]) => ProyectoWeather[])) => void;
  setErrorLogs: (v: ErrorLogEntry[] | ((prev: ErrorLogEntry[]) => ErrorLogEntry[])) => void;
  resolveError: (id: string, notes?: string) => void;
  deleteError: (id: string) => void;
  cleanupOldErrors: (daysOld?: number) => void;
  setMutationQueue: (v: Mutation[] | ((prev: Mutation[]) => Mutation[])) => void;
  setSyncMessage: (v: string) => void;
  setSyncCooldown: (v: boolean) => void;
  setSyncStatus: (v: ErpData['syncStatus']) => void;
  setLastSyncedAt: (v?: string) => void;
  setSyncError: (v?: string) => void;
  deleteProyecto: (id: string) => void;
  clearProyectos: () => void;
  clearAllData: () => void;
  exportStoreData: () => Record<string, unknown>;
  importStoreData: (data: Record<string, unknown>) => void;
  setNotificaciones: (v: Notificacion[] | ((prev: Notificacion[]) => Notificacion[])) => void;
  setIsOnline: (v: boolean) => void;
  setCurrentProjectId: (v: string | null) => void;
  setAppSettings: (v: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  updateAppSettings: (patch: Partial<AppSettings>) => void;
  deleteOrden: (id: string) => void;
  addNotificacion: (tipo: Notificacion['tipo'], titulo: string, mensaje: string, proyectoId?: string, referenciaId?: string) => void;
  markNotificacionLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
  deleteNotificacion: (id: string) => void;
  verificarStockCritico: () => void;
  verificarOrdenesCambioPendientes: () => void;
  verificarChecklistRechazado: () => void;
  addCentroCosto: (c: Omit<CentroCosto, 'id'>) => void;
  updateCentroCosto: (id: string, patch: Partial<CentroCosto>) => void;
  deleteCentroCosto: (id: string) => void;
  deleteReglaFactor: (id: string) => void;
  deleteNormativaDepartamental: (id: string) => void;
  deleteEscalaProduccion: (id: string) => void;
  deleteEstacionalidad: (id: string) => void;
  setReglasFactores: (v: ReglaFactor[] | ((prev: ReglaFactor[]) => ReglaFactor[])) => void;
  setNormativasDepartamentales: (v: NormativaDepartamental[] | ((prev: NormativaDepartamental[]) => NormativaDepartamental[])) => void;
  setEscalasProduccion: (v: EscalaProduccion[] | ((prev: EscalaProduccion[]) => EscalaProduccion[])) => void;
  setEstacionalidad: (v: Estacionalidad[] | ((prev: Estacionalidad[]) => Estacionalidad[])) => void;
  deleteAjusteEstacionalActividad: (id: string) => void;
  updateReglaFactor: (id: string, patch: Partial<ReglaFactor>) => void;
  updateNormativaDepartamental: (id: string, patch: Partial<NormativaDepartamental>) => void;
  updateEscalaProduccion: (id: string, patch: Partial<EscalaProduccion>) => void;
  updateEstacionalidad: (id: string, patch: Partial<Estacionalidad>) => void;
  updateAjusteEstacionalActividad: (id: string, patch: Partial<AjusteEstacionalActividad>) => void;
  updateAplicacionEscala: (id: string, patch: Partial<AplicacionEscala>) => void;
  updateCumplimientoNormativo: (id: string, patch: Partial<CumplimientoNormativo>) => void;
  addPlantilla: (p: Omit<Plantilla, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePlantilla: (id: string, patch: Partial<Plantilla>) => void;
  deletePlantilla: (id: string) => void;
  clonarPlantilla: (plantillaId: string, nuevoNombre: string) => void;
  exportarPlantilla: (plantillaId: string) => string;
  importarPlantilla: (plantillaJson: string) => void;
  sugerirPlantillas: (caracteristicas: { tipologia?: string; cliente?: string; tipoObra?: string }) => Plantilla[];
  crearNuevaVersionPlantilla: (plantillaId: string, cambios: string, usuario?: string) => void;
  restaurarVersionPlantilla: (plantillaId: string, version: number) => void;
  crearProyectoDesdePlantilla: (plantillaId: string, proyectoData: Partial<Proyecto>) => void;
  actualizarMetricasPlantilla: (plantillaId: string) => void;
  actualizarMetricasTodasPlantillas: () => void;
  validarIntegridadPlantilla: (plantillaId: string) => { valido: boolean; errores: string[] };
  toggleFavoritoPlantilla: (plantillaId: string) => void;
  updateProyectoWeather: (proyectoId: string, weatherData: WeatherData | undefined, impactData: ProyectoWeather['impact'] & Partial<Omit<ProyectoWeather, 'proyectoId' | 'weatherData' | 'updatedAt'>>) => void;
  getProyectoWeather: (proyectoId: string) => ProyectoWeather | undefined;
  setUserRol: (rol: string | null) => void;
  enqueueMutation: (type: string, payload: Record<string, unknown>) => string;
  addAuditEntry: (entry: Omit<LogAuditoria, 'id' | 'createdAt'>) => void;
  setAuditLog: (v: LogAuditoria[] | ((prev: LogAuditoria[]) => LogAuditoria[])) => void;
  getSupplierPerformance: (proveedorId: string) => SupplierPerformance | null;
  getAllSupplierPerformance: (filtroProyectoId?: string) => SupplierPerformance[];
  updateAvance: (id: string, patch: Partial<AvanceObra>) => void;
  updatePublicacionMuro: (id: string, patch: Partial<PublicacionMuro>) => void;
  deletePublicacionMuro: (id: string) => void;
  updateNotificacion: (id: string, patch: Partial<Notificacion>) => void;
  updateRecepcion: (id: string, patch: Partial<RecepcionAlmacen>) => void;
  updateVentaPaquete: (id: string, patch: Partial<VentaPaquete>) => void;
  deleteVentaPaquete: (id: string) => void;
  likePublicacionMuro: (publicacionId: string) => void;
  addError: (entry: Omit<ErrorLogEntry, "id" | "createdAt" | "updatedAt">) => void;
  duplicarCotizacion: (id: string) => void;
  addProyecto: (p: Omit<Proyecto, 'id'>) => void;
  updateProyecto: (id: string, patch: Partial<Proyecto>) => void;
  addMovimiento: (m: Omit<Movimiento, 'id'>) => void;
  updateMovimiento: (id: string, patch: Partial<Movimiento>) => void;
  deleteMovimiento: (id: string) => void;
  addEmpleado: (e: Omit<Empleado, 'id'>) => void;
  updateEmpleado: (id: string, patch: Partial<Empleado>) => void;
  deleteEmpleado: (id: string) => void;
  addMaterial: (m: Omit<Material, 'id'>) => void;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  addOrden: (o: Omit<OrdenCompra, 'id'>) => void;
  updateOrden: (id: string, patch: Partial<OrdenCompra>) => void;
  addProveedor: (p: Omit<Proveedor, 'id'>) => void;
  updateProveedor: (id: string, patch: Partial<Proveedor>) => void;
  deleteProveedor: (id: string) => void;
  addEvento: (e: Omit<EventoCalendario, 'id'>) => void;
  updateEvento: (id: string, patch: Partial<EventoCalendario>) => void;
  deleteEvento: (id: string) => void;
  addBitacora: (b: Omit<Bitacora, 'id'>) => void;
  updateBitacora: (id: string, patch: Partial<Bitacora>) => void;
  deleteBitacora: (id: string) => void;
  addPresupuesto: (p: Omit<Presupuesto, 'id'>) => void;
  updatePresupuesto: (id: string, patch: Partial<Presupuesto>) => void;
  deletePresupuesto: (id: string) => void;
  addLicitacion: (l: Omit<Licitacion, 'id'>) => void;
  updateLicitacion: (id: string, patch: Partial<Licitacion>) => void;
  deleteLicitacion: (id: string) => void;
  addCotizacion: (c: Omit<CotizacionCliente, 'id'>) => void;
  updateCotizacion: (id: string, patch: Partial<CotizacionCliente>) => void;
  deleteCotizacion: (id: string) => void;
  addAvance: (a: Omit<AvanceObra, 'id'>) => void;
  deleteAvance: (id: string) => void;
  addSeguimiento: (s: Omit<SeguimientoEVM, 'id'>) => void;
  updateSeguimiento: (id: string, patch: Partial<SeguimientoEVM>) => void;
  deleteSeguimiento: (id: string) => void;
  updateValeSalida: (id: string, patch: Partial<ValeSalida>) => void;
  addValeSalida: (v: Omit<ValeSalida, 'id'>) => void;
  deleteValeSalida: (id: string) => void;
  addCuentaCobrar: (c: Omit<CuentaCobrar, 'id'>) => void;
  updateCuentaCobrar: (id: string, patch: Partial<CuentaCobrar>) => void;
  deleteCuentaCobrar: (id: string) => void;
  addCuentaPagar: (c: Omit<CuentaPagar, 'id'>) => void;
  updateCuentaPagar: (id: string, patch: Partial<CuentaPagar>) => void;
  deleteCuentaPagar: (id: string) => void;
  addOrdenCambio: (o: Omit<OrdenCambio, 'id'>) => void;
  updateOrdenCambio: (id: string, patch: Partial<OrdenCambio>) => void;
  deleteOrdenCambio: (id: string) => void;
  addHito: (h: Omit<Hito, 'id'>) => void;
  updateHito: (id: string, patch: Partial<Hito>) => void;
  deleteHito: (id: string) => void;
  addRiesgo: (r: Omit<Riesgo, 'id'>) => void;
  updateRiesgo: (id: string, patch: Partial<Riesgo>) => void;
  deleteRiesgo: (id: string) => void;
  addAnticipo: (a: Omit<Anticipo, 'id'>) => void;
  updateAnticipo: (id: string, patch: Partial<Anticipo>) => void;
  deleteAnticipo: (id: string) => void;
  addCajaChica: (c: Omit<CajaChica, 'id'>) => void;
  updateCajaChica: (id: string, patch: Partial<CajaChica>) => void;
  deleteCajaChica: (id: string) => void;
  addRendimientoCampo: (r: Omit<RendimientoCampo, 'id'>) => void;
  updateRendimientoCampo: (id: string, patch: Partial<RendimientoCampo>) => void;
  deleteRendimientoCampo: (id: string) => void;
  deleteRiesgo: (id: string) => void;
  addPlano: (p: Omit<Plano, 'id'>) => void;
  updatePlano: (id: string, patch: Partial<Plano>) => void;
  deletePlano: (id: string) => void;
  addRfi: (r: Omit<RFI, 'id'>) => void;
  updateRfi: (id: string, patch: Partial<RFI>) => void;
  deleteRfi: (id: string) => void;
  addSubmittal: (s: Omit<Submittal, 'id'>) => void;
  updateSubmittal: (id: string, patch: Partial<Submittal>) => void;
  deleteSubmittal: (id: string) => void;
  addActivo: (a: Omit<ActivoHerramienta, 'id'>) => void;
  updateActivo: (id: string, patch: Partial<ActivoHerramienta>) => void;
  deleteActivo: (id: string) => void;
  addCuadro: (c: Omit<CuadroComparativo, 'id'>) => void;
  updateCuadro: (id: string, patch: Partial<CuadroComparativo>) => void;
  deleteCuadro: (id: string) => void;
  addPagoProveedor: (p: Omit<PagoProveedor, 'id'>) => void;
  updatePagoProveedor: (id: string, patch: Partial<PagoProveedor>) => void;
  deletePagoProveedor: (id: string) => void;
  addIncidente: (i: Omit<Incidente, 'id'>) => void;
  updateIncidente: (id: string, patch: Partial<Incidente>) => void;
  deleteIncidente: (id: string) => void;
  addDestajo: (d: Omit<Destajo, 'id'>) => void;
  updateDestajo: (id: string, patch: Partial<Destajo>) => void;
  deleteDestajo: (id: string) => void;
  addInsumoBase: (i: Omit<InsumoBase, 'id'>) => void;
  updateInsumoBase: (id: string, patch: Partial<InsumoBase>) => void;
  deleteInsumoBase: (id: string) => void;
  addCalculoProyecto: (d: Omit<CalculoProyecto, 'id'>) => void;
  updateCalculoProyecto: (id: string, patch: Partial<CalculoProyecto>) => void;
  deleteCalculoProyecto: (id: string) => void;
  addRecepcion: (r: Omit<RecepcionAlmacen, 'id'>) => void;
  deleteRecepcion: (id: string) => void;
  addPublicacionMuro: (p: Omit<PublicacionMuro, 'id'>) => void;
  updatePublicacionMuro: (id: string, patch: Partial<PublicacionMuro>) => void;
  addComentarioMuro: (publicacionId: string, comentario: Omit<ComentarioMuro, 'id' | 'createdAt'>) => void;
  addPrueba: (p: Omit<PruebaLaboratorio, 'id'>) => void;
  updatePrueba: (id: string, patch: Partial<PruebaLaboratorio>) => void;
  deletePrueba: (id: string) => void;
  addNC: (nc: Omit<NoConformidad, 'id'>) => void;
  updateNC: (id: string, patch: Partial<NoConformidad>) => void;
  deleteNC: (id: string) => void;
  addLiberacion: (l: Omit<LiberacionPartida, 'id'>) => void;
  updateLiberacion: (id: string, patch: Partial<LiberacionPartida>) => void;
  deleteLiberacion: (id: string) => void;
  syncPresupuestoAprobadoToProyecto: (presupuesto: Presupuesto) => void;
}

export type ErpStore = ErpData & ErpActions;
