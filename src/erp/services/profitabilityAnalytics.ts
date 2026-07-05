import type { Proyecto, Movimiento, Empleado, Material, OrdenCompra } from '../types';
import type { ProjectProfitability, ClientProfitability, ProfitabilityForecast, ResourceEfficiency, ProfitabilityTrend, PricingOptimization } from '../store/schemas/profitability';
import { uid } from '../store';

export interface ProfitabilityMetrics {
  presupuestoTotal: number;
  costoReal: number;
  ingresoReal: number;
  utilidadBruta: number;
  margenBruto: number;
  variacionPresupuesto: number;
  estadoRentabilidad: 'excelente' | 'bueno' | 'aceptable' | 'riesgoso' | 'critico';
  eficienciaLabor: number;
  desperdicioMateriales: number;
  utilizacionEquipo: number;
  scoreEficiencia: number;
}

export interface ClientMetrics {
  cliente: string;
  clienteNit: string;
  proyectosCount: number;
  valorTotalContratos: number;
  costoTotalReal: number;
  utilidadTotal: number;
  margenPromedio: number;
  proyectoMasRentable: string;
  proyectoMenosRentable: string;
  valorVidaCliente: number;
  probabilidadRetencion: number;
  segmento: 'vip' | 'premium' | 'estandar' | 'bajo_margen';
}

export interface ForecastParameters {
  proyectoId: string;
  tipoProyeccion: 'rentabilidad' | 'flujo_caja' | 'plazo' | 'margen';
  fechaBase: string;
  diasProyeccion: number;
}

export interface ResourceMetrics {
  tipoRecurso: 'mano_obra' | 'materiales' | 'equipo' | 'subcontratos';
  costoPlaneado: number;
  costoReal: number;
  eficiencia: number;
  desperdicio: number;
  productividad: number;
  unidadesProducidas: number;
  unidadesPlaneadas: number;
  alertaDesviacion: boolean;
}

export function calculateProjectProfitability(
  proyecto: Proyecto,
  movimientos: Movimiento[],
  empleados: Empleado[],
  materiales: Material[],
  ordenes: OrdenCompra[]
): ProjectProfitability {
  const proyectoMovimientos = movimientos.filter(m => m.proyectoId === proyecto.id);
  
  const costoReal = proyectoMovimientos
    .filter(m => m.tipo === 'gasto')
    .reduce((sum, m) => sum + (m.monto || m.costoTotal || 0), 0);
  
  const ingresoReal = proyectoMovimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + (m.monto || m.costoTotal || 0), 0);
  
  const utilidadBruta = ingresoReal - costoReal;
  const margenBruto = ingresoReal > 0 ? (utilidadBruta / ingresoReal) * 100 : 0;
  const variacionPresupuesto = proyecto.presupuestoTotal > 0 
    ? ((costoReal - proyecto.presupuestoTotal) / proyecto.presupuestoTotal) * 100 
    : 0;
  
  const estadoRentabilidad = determineProfitabilityStatus(margenBruto, variacionPresupuesto);
  
  const eficienciaLabor = calculateLaborEfficiency(proyecto.id, empleados, movimientos);
  const desperdicioMateriales = calculateMaterialWaste(proyecto.id, materiales, movimientos);
  const utilizacionEquipo = calculateEquipmentUtilization(proyecto.id, ordenes, movimientos);
  const scoreEficiencia = (eficienciaLabor + (100 - desperdicioMateriales) + utilizacionEquipo) / 3;
  
  const periodo = new Date().toISOString().slice(0, 7);
  
  return {
    id: uid(),
    proyectoId: proyecto.id,
    periodo,
    presupuestoTotal: proyecto.presupuestoTotal,
    costoReal,
    ingresoReal,
    utilidadBruta,
    margenBruto,
    variacionPresupuesto,
    estadoRentabilidad,
    eficienciaLabor,
    desperdicioMateriales,
    utilizacionEquipo,
    scoreEficiencia,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function determineProfitabilityStatus(margen: number, variacion: number): 'excelente' | 'bueno' | 'aceptable' | 'riesgoso' | 'critico' {
  if (margen >= 20 && variacion <= 5) return 'excelente';
  if (margen >= 15 && variacion <= 10) return 'bueno';
  if (margen >= 10 && variacion <= 15) return 'aceptable';
  if (margen >= 5 && variacion <= 20) return 'riesgoso';
  return 'critico';
}

function calculateLaborEfficiency(proyectoId: string, empleados: Empleado[], movimientos: Movimiento[]): number {
  const laborCosts = movimientos
    .filter(m => m.proyectoId === proyectoId && m.categoria === 'mano_obra')
    .reduce((sum, m) => sum + (m.monto || 0), 0);
  
  const totalBudget = movimientos
    .filter(m => m.proyectoId === proyectoId)
    .reduce((sum, m) => sum + (m.monto || 0), 0);
  
  if (totalBudget === 0) return 0;
  
  const laborRatio = (laborCosts / totalBudget) * 100;
  const targetLaborRatio = 35;
  
  const efficiency = 100 - Math.abs(laborRatio - targetLaborRatio);
  return Math.max(0, Math.min(100, efficiency));
}

function calculateMaterialWaste(proyectoId: string, materiales: Material[], movimientos: Movimiento[]): number {
  const materialCosts = movimientos
    .filter(m => m.proyectoId === proyectoId && m.categoria === 'materiales')
    .reduce((sum, m) => sum + (m.monto || 0), 0);
  
  const totalBudget = movimientos
    .filter(m => m.proyectoId === proyectoId)
    .reduce((sum, m) => sum + (m.monto || 0), 0);
  
  if (totalBudget === 0) return 0;
  
  const materialRatio = (materialCosts / totalBudget) * 100;
  const targetMaterialRatio = 45;
  
  const waste = Math.abs(materialRatio - targetMaterialRatio) * 2;
  return Math.max(0, Math.min(100, waste));
}

function calculateEquipmentUtilization(proyectoId: string, ordenes: OrdenCompra[], movimientos: Movimiento[]): number {
  const equipmentCosts = movimientos
    .filter(m => m.proyectoId === proyectoId && m.categoria === 'equipo')
    .reduce((sum, m) => sum + (m.monto || 0), 0);
  
  const totalBudget = movimientos
    .filter(m => m.proyectoId === proyectoId)
    .reduce((sum, m) => sum + (m.monto || 0), 0);
  
  if (totalBudget === 0) return 0;
  
  const equipmentRatio = (equipmentCosts / totalBudget) * 100;
  const targetEquipmentRatio = 10;
  
  const utilization = 100 - Math.abs(equipmentRatio - targetEquipmentRatio) * 3;
  return Math.max(0, Math.min(100, utilization));
}

export function calculateClientProfitability(
  cliente: string,
  clienteNit: string,
  proyectos: Proyecto[],
  movimientos: Movimiento[]
): ClientProfitability {
  const clienteProyectos = proyectos.filter(p => p.cliente === cliente);
  
  const valorTotalContratos = clienteProyectos.reduce((sum, p) => sum + p.montoContrato, 0);
  
  const proyectoIds = clienteProyectos.map(p => p.id);
  const costoTotalReal = movimientos
    .filter(m => proyectoIds.includes(m.proyectoId) && m.tipo === 'gasto')
    .reduce((sum, m) => sum + (m.monto || m.costoTotal || 0), 0);
  
  const ingresoTotalReal = movimientos
    .filter(m => proyectoIds.includes(m.proyectoId) && m.tipo === 'ingreso')
    .reduce((sum, m) => sum + (m.monto || m.costoTotal || 0), 0);
  
  const utilidadTotal = ingresoTotalReal - costoTotalReal;
  const margenPromedio = valorTotalContratos > 0 ? (utilidadTotal / valorTotalContratos) * 100 : 0;
  
  const projectProfitabilities = clienteProyectos.map(p => {
    const pMovimientos = movimientos.filter(m => m.proyectoId === p.id);
    const pCosto = pMovimientos.filter(m => m.tipo === 'gasto').reduce((sum, m) => sum + (m.monto || 0), 0);
    const pIngreso = pMovimientos.filter(m => m.tipo === 'ingreso').reduce((sum, m) => sum + (m.monto || 0), 0);
    return { proyecto: p.nombre, utilidad: pIngreso - pCosto };
  });
  
  projectProfitabilities.sort((a, b) => b.utilidad - a.utilidad);
  
  const proyectoMasRentable = projectProfitabilities[0]?.proyecto;
  const proyectoMenosRentable = projectProfitabilities[projectProfitabilities.length - 1]?.proyecto;
  
  const valorVidaCliente = utilidadTotal * (clienteProyectos.length > 1 ? 1.2 : 1);
  const probabilidadRetencion = calculateRetentionProbability(margenPromedio, clienteProyectos.length);
  const segmento = determineClientSegment(margenPromedio, valorTotalContratos, clienteProyectos.length);
  
  return {
    id: uid(),
    cliente,
    clienteNit,
    proyectosCount: clienteProyectos.length,
    valorTotalContratos,
    costoTotalReal,
    utilidadTotal,
    margenPromedio,
    proyectoMasRentable,
    proyectoMenosRentable,
    valorVidaCliente,
    probabilidadRetencion,
    segmento,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function calculateRetentionProbability(margen: number, proyectosCount: number): number {
  let probability = 50;
  
  if (margen >= 20) probability += 30;
  else if (margen >= 15) probability += 20;
  else if (margen >= 10) probability += 10;
  else if (margen < 5) probability -= 20;
  
  if (proyectosCount >= 5) probability += 20;
  else if (proyectosCount >= 3) probability += 10;
  else if (proyectosCount === 1) probability -= 10;
  
  return Math.max(0, Math.min(100, probability));
}

function determineClientSegment(margen: number, valorTotal: number, proyectosCount: number): 'vip' | 'premium' | 'estandar' | 'bajo_margen' {
  if (margen >= 20 && valorTotal >= 1000000 && proyectosCount >= 3) return 'vip';
  if (margen >= 15 && valorTotal >= 500000) return 'premium';
  if (margen >= 10) return 'estandar';
  return 'bajo_margen';
}

export function generateProfitabilityForecast(
  params: ForecastParameters,
  historicalData: ProjectProfitability[],
  currentProyecto: Proyecto
): ProfitabilityForecast {
  const fechaProyeccion = new Date(params.fechaBase);
  fechaProyeccion.setDate(fechaProyeccion.getDate() + params.diasProyeccion);
  
  const recentData = historicalData
    .filter(d => new Date(d.periodo) >= new Date(params.fechaBase))
    .slice(-6);
  
  const valorActual = recentData.length > 0 
    ? recentData[recentData.length - 1].utilidadBruta 
    : (currentProyecto.presupuestoTotal * 0.15);
  
  const trend = calculateTrend(recentData.map(d => d.utilidadBruta));
  const valorProyectado = valorActual * (1 + (trend * params.diasProyeccion / 30));
  
  const confianza = calculateConfidence(recentData.length, trend);
  const factoresRiesgo = identifyRiskFactors(trend, currentProyecto);
  const factoresOportunidad = identifyOpportunityFactors(trend, currentProyecto);
  
  const escenarioOptimista = valorProyectado * 1.2;
  const escenarioBase = valorProyectado;
  const escenarioPesimista = valorProyectado * 0.8;
  
  return {
    id: uid(),
    proyectoId: params.proyectoId,
    tipoProyeccion: params.tipoProyeccion,
    fechaProyeccion: fechaProyeccion.toISOString().split('T')[0],
    fechaBase: params.fechaBase,
    valorActual,
    valorProyectado,
    confianza,
    factoresRiesgo,
    factoresOportunidad,
    escenarioOptimista,
    escenarioBase,
    escenarioPesimista,
    modeloVersion: 'v1.0',
    createdAt: new Date().toISOString(),
  };
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  
  const n = values.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope / (values.reduce((a, b) => a + b, 0) / n);
}

function calculateConfidence(dataPoints: number, trend: number): number {
  const baseConfidence = Math.min(100, dataPoints * 15);
  const trendAdjustment = Math.abs(trend) > 0.1 ? -10 : 10;
  return Math.max(0, Math.min(100, baseConfidence + trendAdjustment));
}

function identifyRiskFactors(trend: number, proyecto: Proyecto): string[] {
  const factors: string[] = [];
  
  if (trend < -0.05) factors.push('Tendencia negativa en rentabilidad');
  if (proyecto.estado === 'pausado') factors.push('Proyecto pausado');
  if (proyecto.avanceFisico < proyecto.avanceFinanciero - 10) factors.push('Desfase avance físico vs financiero');
  if (proyecto.plazoSemanas && proyecto.plazoSemanas > 52) factors.push('Plazo extendido (> 1 año)');
  
  return factors;
}

function identifyOpportunityFactors(trend: number, proyecto: Proyecto): string[] {
  const factors: string[] = [];
  
  if (trend > 0.05) factors.push('Tendencia positiva en rentabilidad');
  if (proyecto.estado === 'ejecucion') factors.push('Proyecto en ejecución activa');
  if (proyecto.avanceFisico > proyecto.avanceFinanciero + 5) factors.push('Eficiencia en ejecución física');
  if (proyecto.tipologia === 'comercial') factors.push('Tipología de alto valor');
  
  return factors;
}

export function calculateResourceEfficiency(
  proyectoId: string,
  tipoRecurso: 'mano_obra' | 'materiales' | 'equipo' | 'subcontratos',
  movimientos: Movimiento[],
  presupuestoTotal: number
): ResourceEfficiency {
  const recursoMovimientos = movimientos.filter(m => 
    m.proyectoId === proyectoId && 
    (m.categoria === tipoRecurso || 
     (tipoRecurso === 'subcontratos' && m.categoria === 'subcontrato'))
  );
  
  const costoReal = recursoMovimientos.reduce((sum, m) => sum + (m.monto || 0), 0);
  const costoPlaneado = presupuestoTotal * getResourceBudgetRatio(tipoRecurso);
  
  const eficiencia = costoPlaneado > 0 ? (costoPlaneado / costoReal) * 100 : 0;
  const desperdicio = Math.max(0, 100 - eficiencia);
  
  const productividad = calculateProductivity(tipoRecurso, recursoMovimientos);
  const unidadesProducidas = estimateUnitsProduced(tipoRecurso, recursoMovimientos);
  const unidadesPlaneadas = presupuestoTotal * 0.01;
  
  const alertaDesviacion = desperdicio > 15;
  
  return {
    id: uid(),
    proyectoId,
    tipoRecurso,
    costoPlaneado,
    costoReal,
    eficiencia,
    desperdicio,
    productividad,
    unidadesProducidas,
    unidadesPlaneadas,
    alertaDesviacion,
    umbralAlerta: 0.15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getResourceBudgetRatio(tipo: string): number {
  const ratios: Record<string, number> = {
    mano_obra: 0.35,
    materiales: 0.45,
    equipo: 0.10,
    subcontratos: 0.10,
  };
  return ratios[tipo] || 0.1;
}

function calculateProductivity(tipo: string, movimientos: Movimiento[]): number {
  if (movimientos.length === 0) return 0;
  
  const totalCost = movimientos.reduce((sum, m) => sum + (m.monto || 0), 0);
  const avgCost = totalCost / movimientos.length;
  
  const recentMovements = movimientos.slice(-10);
  const recentAvgCost = recentMovements.reduce((sum, m) => sum + (m.monto || 0), 0) / recentMovements.length;
  
  const productivity = (avgCost / (recentAvgCost || 1)) * 100;
  return Math.max(0, Math.min(100, productivity));
}

function estimateUnitsProduced(tipo: string, movimientos: Movimiento[]): number {
  return movimientos.reduce((sum, m) => {
    const qty = m.cantidad || 1;
    return sum + qty;
  }, 0);
}

export function analyzeProfitabilityTrends(
  proyectos: Proyecto[],
  profitabilityData: ProjectProfitability[],
  tipoAnalisis: 'rentabilidad_global' | 'por_tipologia' | 'por_cliente' | 'por_temporada'
): ProfitabilityTrend {
  const periodo = new Date().toISOString().slice(0, 7);
  const proyectosActivos = proyectos.filter(p => p.estado === 'ejecucion').length;
  
  const rentabilidadPromedio = profitabilityData.length > 0
    ? profitabilityData.reduce((sum, d) => sum + d.margenBruto, 0) / profitabilityData.length
    : 0;
  
  const margenPromedio = rentabilidadPromedio;
  
  const tendencias: Record<string, number> = {};
  const alertas: string[] = [];
  const oportunidades: string[] = [];
  
  if (tipoAnalisis === 'por_tipologia') {
    proyectos.forEach(p => {
      const tipologiaData = profitabilityData.filter(d => {
        const proyecto = proyectos.find(proj => proj.id === d.proyectoId);
        return proyecto?.tipologia === p.tipologia;
      });
      
      if (tipologiaData.length > 0) {
        const avgMargin = tipologiaData.reduce((sum, d) => sum + d.margenBruto, 0) / tipologiaData.length;
        tendencias[p.tipologia] = avgMargin;
        
        if (avgMargin < 10) alertas.push(`Tipología ${p.tipologia} con margen bajo (${avgMargin.toFixed(1)}%)`);
        if (avgMargin > 20) oportunidades.push(`Tipología ${p.tipologia} altamente rentable (${avgMargin.toFixed(1)}%)`);
      }
    });
  } else if (tipoAnalisis === 'por_cliente') {
    const clientes = [...new Set(proyectos.map(p => p.cliente))];
    clientes.forEach(cliente => {
      const clienteProyectos = proyectos.filter(p => p.cliente === cliente);
      const clienteData = profitabilityData.filter(d => clienteProyectos.some(cp => cp.id === d.proyectoId));
      
      if (clienteData.length > 0) {
        const avgMargin = clienteData.reduce((sum, d) => sum + d.margenBruto, 0) / clienteData.length;
        tendencias[cliente] = avgMargin;
        
        if (avgMargin < 5) alertas.push(`Cliente ${cliente} con margen crítico (${avgMargin.toFixed(1)}%)`);
        if (avgMargin > 15) oportunidades.push(`Cliente ${cliente} con buen margen (${avgMargin.toFixed(1)}%)`);
      }
    });
  } else {
    tendencias['global'] = rentabilidadPromedio;
    if (rentabilidadPromedio < 10) alertas.push('Rentabilidad global por debajo del objetivo');
    if (rentabilidadPromedio > 20) oportunidades.push('Rentabilidad global excelente');
  }
  
  return {
    id: uid(),
    periodo,
    tipoAnalisis,
    agrupador: tipoAnalisis !== 'rentabilidad_global' ? tipoAnalisis : undefined,
    proyectosActivos,
    rentabilidadPromedio,
    margenPromedio,
    tendencias,
    alertas,
    oportunidades,
    createdAt: new Date().toISOString(),
  };
}

export function optimizePricing(
  tipologia: 'residencial' | 'comercial' | 'industrial' | 'civil' | 'publica',
  subtipo: string | undefined,
  historicalData: ProjectProfitability[],
  proyectos: Proyecto[]
): PricingOptimization {
  const tipologiaProyectos = proyectos.filter(p => p.tipologia === tipologia && (!subtipo || p.subtipo === subtipo));
  const tipologiaData = historicalData.filter(d => tipologiaProyectos.some(p => p.id === d.proyectoId));
  
  const margenHistoricoPromedio = tipologiaData.length > 0
    ? tipologiaData.reduce((sum, d) => sum + d.margenBruto, 0) / tipologiaData.length
    : 12;
  
  const margenObjetivo = Math.max(15, margenHistoricoPromedio + 3);
  
  const factorRiesgo = calculateRiskFactor(tipologia);
  const complejidadPromedio = calculateComplexityFactor(tipologia, subtipo);
  
  const precioSugeridoBase = 1000000;
  const ajusteEstacional = calculateSeasonalAdjustment();
  const ajusteDemanda = calculateDemandAdjustment(tipologia);
  
  const precioOptimizado = precioSugeridoBase * 
    (1 + (margenObjetivo / 100)) * 
    (1 + factorRiesgo) * 
    (1 + complejidadPromedio) * 
    (1 + ajusteEstacional) * 
    (1 + ajusteDemanda);
  
  const confianzaRecomendacion = Math.min(95, 50 + tipologiaData.length * 5);
  
  return {
    id: uid(),
    tipologia,
    subtipo,
    margenHistoricoPromedio,
    margenObjetivo,
    factorRiesgo,
    complejidadPromedio,
    precioSugeridoBase,
    ajusteEstacional,
    ajusteDemanda,
    precioOptimizado,
    confianzaRecomendacion,
    fechaActualizacion: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

function calculateRiskFactor(tipologia: string): number {
  const riskFactors: Record<string, number> = {
    residencial: 0.05,
    comercial: 0.08,
    industrial: 0.10,
    civil: 0.12,
    publica: 0.15,
  };
  return riskFactors[tipologia] || 0.08;
}

function calculateComplexityFactor(tipologia: string, subtipo?: string): number {
  const baseComplexity: Record<string, number> = {
    residencial: 0.03,
    comercial: 0.05,
    industrial: 0.07,
    civil: 0.08,
    publica: 0.10,
  };
  
  let complexity = baseComplexity[tipologia] || 0.05;
  
  if (subtipo?.toLowerCase().includes('alto') || subtipo?.toLowerCase().includes('premium')) {
    complexity += 0.02;
  }
  
  return complexity;
}

function calculateSeasonalAdjustment(): number {
  const month = new Date().getMonth();
  const seasonalFactors = [0.02, 0.01, 0, -0.01, -0.02, -0.01, 0, 0.01, 0.02, 0.03, 0.02, 0.01];
  return seasonalFactors[month];
}

function calculateDemandAdjustment(tipologia: string): number {
  const demandFactors: Record<string, number> = {
    residencial: 0.03,
    comercial: 0.05,
    industrial: 0.02,
    civil: 0.01,
    publica: -0.02,
  };
  return demandFactors[tipologia] || 0;
}

export function generateProfitabilityReport(
  proyectos: Proyecto[],
  movimientos: Movimiento[],
  empleados: Empleado[],
  materiales: Material[],
  ordenes: OrdenCompra[]
): {
  projectProfitabilities: ProjectProfitability[];
  clientProfitabilities: ClientProfitability[];
  trends: ProfitabilityTrend[];
  resourceEfficiencies: ResourceEfficiency[];
  pricingOptimizations: PricingOptimization[];
} {
  const projectProfitabilities: ProjectProfitability[] = proyectos.map(proyecto =>
    calculateProjectProfitability(proyecto, movimientos, empleados, materiales, ordenes)
  );
  
  const uniqueClients = [...new Set(proyectos.map(p => p.cliente))];
  const clientProfitabilities: ClientProfitability[] = uniqueClients.map(cliente => {
    const clienteNit = proyectos.find(p => p.cliente === cliente)?.clienteNit || '';
    return calculateClientProfitability(cliente, clienteNit, proyectos, movimientos);
  });
  
  const trends: ProfitabilityTrend[] = [
    analyzeProfitabilityTrends(proyectos, projectProfitabilities, 'rentabilidad_global'),
    analyzeProfitabilityTrends(proyectos, projectProfitabilities, 'por_tipologia'),
    analyzeProfitabilityTrends(proyectos, projectProfitabilities, 'por_cliente'),
  ];
  
  const resourceEfficiencies: ResourceEfficiency[] = proyectos.flatMap(proyecto => {
    const resourceTypes: Array<'mano_obra' | 'materiales' | 'equipo' | 'subcontratos'> = 
      ['mano_obra', 'materiales', 'equipo', 'subcontratos'];
    return resourceTypes.map(tipo =>
      calculateResourceEfficiency(proyecto.id, tipo, movimientos, proyecto.presupuestoTotal)
    );
  });
  
  const tipologias: Array<'residencial' | 'comercial' | 'industrial' | 'civil' | 'publica'> = 
    ['residencial', 'comercial', 'industrial', 'civil', 'publica'];
  const pricingOptimizations: PricingOptimization[] = tipologias.map(tipologia =>
    optimizePricing(tipologia, undefined, projectProfitabilities, proyectos)
  );
  
  return {
    projectProfitabilities,
    clientProfitabilities,
    trends,
    resourceEfficiencies,
    pricingOptimizations,
  };
}
