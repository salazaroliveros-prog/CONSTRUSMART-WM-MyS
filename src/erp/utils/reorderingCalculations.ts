import type { 
  ConsumoHistorico, 
  PatronConsumo, 
  ProveedorLeadTime, 
  ReorderSuggestion, 
  ReorderConfig 
} from '../store/schemas/reordering';
import type { Material } from '../types';
import type { Orden } from '../types';
import type { Proveedor } from '../types';
import type { ValeSalida } from '../types';
import type { Hito } from '../types';

export interface ReorderCalculationInput {
  material: Material;
  proyectoId: string;
  proyectoNombre: string;
  consumosHistoricos: ConsumoHistorico[];
  proveedores: Proveedor[];
  ordenes: Orden[];
  valesSalida: ValeSalida[];
  hitos: Hito[];
  config: ReorderConfig;
}

export interface ReorderCalculationResult {
  suggestion: ReorderSuggestion;
  patronConsumo?: PatronConsumo;
  leadTimeData?: ProveedorLeadTime;
}

export function calcularPatronConsumo(
  materialId: string,
  proyectoId: string,
  consumos: ConsumoHistorico[]
): PatronConsumo | undefined {
  if (consumos.length === 0) return undefined;

  const consumosMaterial = consumos.filter(c => c.materialId === materialId && c.proyectoId === proyectoId);
  if (consumosMaterial.length < 2) return undefined;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const consumoUltimos30Dias = consumosMaterial.filter(c => new Date(c.fecha) >= thirtyDaysAgo);
  const consumoUltimos7Dias = consumosMaterial.filter(c => new Date(c.fecha) >= sevenDaysAgo);

  if (consumoUltimos30Dias.length === 0) return undefined;

  const total30Dias = consumoUltimos30Dias.reduce((sum, c) => sum + c.cantidad, 0);
  const total7Dias = consumoUltimos7Dias.reduce((sum, c) => sum + c.cantidad, 0);

  const consumoPromedioDiario = total30Dias / 30;
  const consumoPromedioSemanal = total30Dias / 4.33;
  const consumoPromedioMensual = total30Dias;

  const variabilidad = calcularVariabilidad(consumoUltimos30Dias.map(c => c.cantidad));
  const tendencia = calcularTendencia(consumoUltimos30Dias);

  const picoConsumoMes = encontrarPicoConsumo(consumoUltimos30Dias);
  const picoConsumoCantidad = picoConsumoMes ? picoConsumoMes.cantidad : 0;

  return {
    materialId,
    proyectoId,
    consumoPromedioDiario,
    consumoPromedioSemanal,
    consumoPromedioMensual,
    variabilidad,
    tendencia,
    picoConsumoMes: picoConsumoMes?.mes,
    picoConsumoCantidad,
    ultimoAnalisis: now.toISOString(),
  };
}

function calcularVariabilidad(valores: number[]): number {
  if (valores.length < 2) return 0;
  const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
  const varianza = valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length;
  return Math.sqrt(varianza) / (media || 1);
}

function calcularTendencia(consumos: ConsumoHistorico[]): 'creciente' | 'estable' | 'decreciente' {
  if (consumos.length < 3) return 'estable';

  const sortedConsumos = [...consumos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  const primeraMitad = sortedConsumos.slice(0, Math.floor(sortedConsumos.length / 2));
  const segundaMitad = sortedConsumos.slice(Math.floor(sortedConsumos.length / 2));

  const mediaPrimera = primeraMitad.reduce((sum, c) => sum + c.cantidad, 0) / primeraMitad.length;
  const mediaSegunda = segundaMitad.reduce((sum, c) => sum + c.cantidad, 0) / segundaMitad.length;

  const cambio = ((mediaSegunda - mediaPrimera) / (mediaPrimera || 1)) * 100;

  if (cambio > 10) return 'creciente';
  if (cambio < -10) return 'decreciente';
  return 'estable';
}

function encontrarPicoConsumo(consumos: ConsumoHistorico[]): { mes: number; cantidad: number } | undefined {
  if (consumos.length === 0) return undefined;

  const porMes: Record<number, number> = {};
  consumos.forEach(c => {
    const mes = new Date(c.fecha).getMonth();
    porMes[mes] = (porMes[mes] || 0) + c.cantidad;
  });

  let maxMes = 0;
  let maxCantidad = 0;
  Object.entries(porMes).forEach(([mes, cantidad]) => {
    if (cantidad > maxCantidad) {
      maxCantidad = cantidad;
      maxMes = parseInt(mes);
    }
  });

  return { mes: maxMes, cantidad: maxCantidad };
}

export function calcularLeadTimeProveedor(
  proveedorId: string,
  materialId: string,
  ordenes: Orden[]
): ProveedorLeadTime | undefined {
  const ordenesProveedor = ordenes.filter(o => o.proveedorId === proveedorId);
  if (ordenesProveedor.length === 0) return undefined;

  const ordenesCompletadas = ordenesProveedor.filter(o => 
    o.estado === 'recibida' && o.fecha
  );

  if (ordenesCompletadas.length === 0) return undefined;

  const leadTimes: number[] = [];
  ordenesCompletadas.forEach(orden => {
    const fechaOrden = new Date(orden.fecha);
    const fechaRecepcion = new Date();
    const dias = Math.ceil((fechaRecepcion.getTime() - fechaOrden.getTime()) / (1000 * 60 * 60 * 24));
    if (dias > 0 && dias < 365) {
      leadTimes.push(dias);
    }
  });

  if (leadTimes.length === 0) return undefined;

  const leadTimePromedio = leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length;
  const leadTimeMinimo = Math.min(...leadTimes);
  const leadTimeMaximo = Math.max(...leadTimes);

  const ordenesATiempo = leadTimes.filter(lt => lt <= leadTimePromedio * 1.2).length;
  const confiabilidad = ordenesATiempo / leadTimes.length;

  return {
    proveedorId,
    materialId,
    leadTimePromedio,
    leadTimeMinimo,
    leadTimeMaximo,
    confiabilidad,
    totalOrdenes: ordenesCompletadas.length,
    ultimaActualizacion: new Date().toISOString(),
  };
}

export function calcularPuntoReorden(
  stockActual: number,
  stockMinimo: number,
  consumoPromedioDiario: number,
  leadTimeDias: number,
  stockSeguridadDias: number
): number {
  const stockSeguridad = consumoPromedioDiario * stockSeguridadDias;
  const demandaDuranteLeadTime = consumoPromedioDiario * leadTimeDias;
  return Math.max(stockMinimo, demandaDuranteLeadTime + stockSeguridad);
}

export function calcularCantidadEOQ(
  consumoAnual: number,
  costoOrdenamiento: number,
  costoAlmacenamiento: number
): number {
  if (consumoAnual <= 0 || costoOrdenamiento <= 0 || costoAlmacenamiento <= 0) {
    return 0;
  }
  const eoq = Math.sqrt((2 * consumoAnual * costoOrdenamiento) / costoAlmacenamiento);
  return Math.round(eoq);
}

export function calcularUrgencia(
  stockActual: number,
  puntoReorden: number,
  leadTimeDias: number,
  fechaEstimadaAgotamiento: string
): 'critica' | 'alta' | 'media' | 'baja' {
  const hoy = new Date();
  const fechaAgotamiento = new Date(fechaEstimadaAgotamiento);
  const diasHastaAgotamiento = Math.ceil((fechaAgotamiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (stockActual <= 0 || diasHastaAgotamiento <= 0) {
    return 'critica';
  }
  if (diasHastaAgotamiento <= leadTimeDias) {
    return 'critica';
  }
  if (diasHastaAgotamiento <= leadTimeDias * 2) {
    return 'alta';
  }
  if (stockActual <= puntoReorden) {
    return 'media';
  }
  return 'baja';
}

export function calcularFechaEstimadaAgotamiento(
  stockActual: number,
  consumoPromedioDiario: number
): string {
  if (stockActual <= 0 || consumoPromedioDiario <= 0) {
    return new Date().toISOString();
  }
  const diasRestantes = stockActual / consumoPromedioDiario;
  const fechaAgotamiento = new Date();
  fechaAgotamiento.setDate(fechaAgotamiento.getDate() + Math.ceil(diasRestantes));
  return fechaAgotamiento.toISOString();
}

export function generarReorderSuggestion(
  input: ReorderCalculationInput
): ReorderCalculationResult {
  const { material, proyectoId, proyectoNombre, consumosHistoricos, proveedores, ordenes, valesSalida, hitos, config } = input;

  const patronConsumo = calcularPatronConsumo(material.id, proyectoId, consumosHistoricos);
  const consumoPromedioDiario = patronConsumo?.consumoPromedioDiario || 0;

  let leadTimeDias = 7;
  let proveedorSugeridoId: string | undefined;
  let proveedorSugeridoNombre: string | undefined;
  let leadTimeData: ProveedorLeadTime | undefined;

  if (config.proveedorPreferidoId) {
    const leadTimePref = calcularLeadTimeProveedor(config.proveedorPreferidoId, material.id, ordenes);
    if (leadTimePref) {
      leadTimeData = leadTimePref;
      leadTimeDias = leadTimePref.leadTimePromedio;
      proveedorSugeridoId = config.proveedorPreferidoId;
      const proveedor = proveedores.find(p => p.id === config.proveedorPreferidoId);
      proveedorSugeridoNombre = proveedor?.nombre;
    }
  }

  if (!proveedorSugeridoId && proveedores.length > 0) {
    const mejorProveedor = encontrarMejorProveedor(material.id, proveedores, ordenes);
    if (mejorProveedor) {
      const leadTimeMejor = calcularLeadTimeProveedor(mejorProveedor.id, material.id, ordenes);
      if (leadTimeMejor) {
        leadTimeData = leadTimeMejor;
        leadTimeDias = leadTimeMejor.leadTimePromedio;
        proveedorSugeridoId = mejorProveedor.id;
        proveedorSugeridoNombre = mejorProveedor.nombre;
      }
    }
  }

  const puntoReorden = calcularPuntoReorden(
    material.stock,
    material.stockMinimo,
    consumoPromedioDiario,
    leadTimeDias,
    config.stockSeguridadDias
  );

  const fechaEstimadaAgotamiento = calcularFechaEstimadaAgotamiento(material.stock, consumoPromedioDiario);

  let cantidadSugerida = 0;
  if (config.metodoCalculo === 'eoq' && patronConsumo) {
    const consumoAnual = patronConsumo.consumoPromedioMensual * 12;
    cantidadSugerida = calcularCantidadEOQ(consumoAnual, config.costoOrdenamiento, config.costoAlmacenamiento);
  } else if (config.metodoCalculo === 'consumo_promedio' && patronConsumo) {
    cantidadSugerida = Math.ceil(patronConsumo.consumoPromedioMensual * config.stockMaximoMultiplo);
  } else {
    cantidadSugerida = Math.ceil((puntoReorden - material.stock) * 1.5);
  }

  cantidadSugerida = Math.max(cantidadSugerida, material.stockMinimo * 2);

  const urgencia = calcularUrgencia(material.stock, puntoReorden, leadTimeDias, fechaEstimadaAgotamiento);

  const prioridad = calcularPrioridad(urgencia, material.stock, material.stockMinimo, patronConsumo);

  const costoTotalEstimado = cantidadSugerida * material.precio;

  const justificacion = generarJustificacion(material, urgencia, patronConsumo, leadTimeDias, cantidadSugerida);

  const ahorroPotencial = calcularAhorroPotencial(cantidadSugerida, material.precio, config.costoOrdenamiento);

  const suggestion: ReorderSuggestion = {
    id: `reorder-${material.id}-${Date.now()}`,
    materialId: material.id,
    materialNombre: material.nombre,
    proyectoId,
    proyectoNombre,
    stockActual: material.stock,
    stockMinimo: material.stockMinimo,
    stockMaximo: material.stockMinimo * config.stockMaximoMultiplo,
    puntoReorden,
    cantidadSugerida,
    urgencia,
    prioridad,
    fechaEstimadaAgotamiento,
    leadTimeDias,
    costoTotalEstimado,
    proveedorSugeridoId,
    proveedorSugeridoNombre,
    patronConsumo,
    justificacion,
    ahorroPotencial,
    estado: 'pendiente',
    fechaSugerencia: new Date().toISOString(),
  };

  return { suggestion, patronConsumo, leadTimeData };
}

function encontrarMejorProveedor(
  materialId: string,
  proveedores: Proveedor[],
  ordenes: Orden[]
): Proveedor | undefined {
  const proveedoresCalificados = proveedores.filter(p => p.categoria === 'materiales');
  if (proveedoresCalificados.length === 0) return proveedores[0];

  const proveedoresConLeadTime = proveedoresCalificados.map(proveedor => {
    const leadTime = calcularLeadTimeProveedor(proveedor.id, materialId, ordenes);
    return {
      proveedor,
      leadTime,
    };
  }).filter(item => item.leadTime !== undefined);

  if (proveedoresConLeadTime.length === 0) {
    return proveedoresCalificados.sort((a, b) => (b.calificacion || 0) - (a.calificacion || 0))[0];
  }

  return proveedoresConLeadTime.sort((a, b) => {
    const scoreA = (a.leadTime!.confiabilidad * 0.6) + ((a.proveedor.calificacion || 0) / 5 * 0.4) - (a.leadTime!.leadTimePromedio / 30 * 0.2);
    const scoreB = (b.leadTime!.confiabilidad * 0.6) + ((b.proveedor.calificacion || 0) / 5 * 0.4) - (b.leadTime!.leadTimePromedio / 30 * 0.2);
    return scoreB - scoreA;
  })[0].proveedor;
}

function calcularPrioridad(
  urgencia: 'critica' | 'alta' | 'media' | 'baja',
  stockActual: number,
  stockMinimo: number,
  patronConsumo?: PatronConsumo
): number {
  let prioridad = 0;

  switch (urgencia) {
    case 'critica':
      prioridad += 100;
      break;
    case 'alta':
      prioridad += 75;
      break;
    case 'media':
      prioridad += 50;
      break;
    case 'baja':
      prioridad += 25;
      break;
  }

  const ratioStock = stockActual / (stockMinimo || 1);
  if (ratioStock < 0.5) prioridad += 30;
  else if (ratioStock < 1) prioridad += 15;

  if (patronConsumo) {
    if (patronConsumo.tendencia === 'creciente') prioridad += 20;
    if (patronConsumo.variabilidad > 0.5) prioridad += 10;
  }

  return Math.min(prioridad, 100);
}

function generarJustificacion(
  material: Material,
  urgencia: 'critica' | 'alta' | 'media' | 'baja',
  patronConsumo?: PatronConsumo,
  leadTimeDias?: number,
  cantidadSugerida?: number
): string {
  const partes: string[] = [];

  if (urgencia === 'critica') {
    partes.push('Stock crítico - riesgo de paralización de obra');
  } else if (urgencia === 'alta') {
    partes.push('Stock bajo - se recomienda reorden urgente');
  } else if (urgencia === 'media') {
    partes.push('Stock cercano a punto de reorden');
  }

  if (patronConsumo) {
    if (patronConsumo.tendencia === 'creciente') {
      partes.push('Tendencia de consumo creciente detectada');
    }
    if (patronConsumo.variabilidad > 0.5) {
      partes.push('Alta variabilidad en consumo histórico');
    }
  }

  if (leadTimeDias && cantidadSugerida) {
    partes.push(`Lead tiempo: ${leadTimeDias} días, cantidad sugerida: ${cantidadSugerida} ${material.unidad}`);
  }

  return partes.join('. ') || 'Reorden recomendado basado en niveles de stock';
}

function calcularAhorroPotencial(
  cantidad: number,
  precioUnitario: number,
  costoOrdenamiento: number
): number {
  const ahorroPorEconomiaDeEscala = cantidad * precioUnitario * 0.05;
  const ahorroPorReduccionOrdenes = costoOrdenamiento * 0.5;
  return ahorroPorEconomiaDeEscala + ahorroPorReduccionOrdenes;
}

export function analizarProyectoParaReordering(
  proyectoId: string,
  materiales: Material[],
  hitos: Hito[]
): { materialesPrioritarios: string[]; faseProyecto: string } {
  const hoy = new Date();
  const hitosProximos = hitos
    .filter(h => h.proyectoId === proyectoId && h.estado !== 'completado')
    .filter(h => new Date(h.fecha) >= hoy)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    .slice(0, 3);

  const faseProyecto = hitosProximos.length > 0 
    ? hitosProximos[0].nombre 
    : 'general';

  const materialesCriticos = materiales
    .filter(m => m.proyectoId === proyectoId && m.stock <= m.stockMinimo)
    .map(m => m.id);

  return {
    materialesPrioritarios: materialesCriticos,
    faseProyecto,
  };
}
