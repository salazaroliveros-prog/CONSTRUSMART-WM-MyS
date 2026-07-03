export type ProyectoEstado = 'planeacion' | 'ejecucion' | 'pausado' | 'finalizado';

export type ProyectoEtapa = 'planificacion' | 'diseno' | 'preconstruccion' | 'construccion' | 'cierre';

export interface TransicionValida {
  desde: ProyectoEstado;
  hacia: ProyectoEstado;
  requisitos: string[];
  etapasValidas: ProyectoEtapa[];
}

export interface ResultadoTransicion {
  valido: boolean;
  errores: string[];
  warnings: string[];
}

const TRANSICIONES: TransicionValida[] = [
  {
    desde: 'planeacion',
    hacia: 'ejecucion',
    requisitos: ['presupuesto_aprobado', 'hitos_definidos'],
    etapasValidas: ['construccion'],
  },
  {
    desde: 'ejecucion',
    hacia: 'pausado',
    requisitos: ['motivo_pausa'],
    etapasValidas: ['planificacion', 'diseno', 'preconstruccion', 'construccion', 'cierre'],
  },
  {
    desde: 'pausado',
    hacia: 'ejecucion',
    requisitos: [],
    etapasValidas: ['planificacion', 'diseno', 'preconstruccion', 'construccion', 'cierre'],
  },
  {
    desde: 'ejecucion',
    hacia: 'finalizado',
    requisitos: ['avance_100'],
    etapasValidas: ['cierre'],
  },
];

const ETAPAS_POR_ESTADO: Record<ProyectoEstado, ProyectoEtapa[]> = {
  planeacion: ['planificacion', 'diseno', 'preconstruccion'],
  ejecucion: ['construccion'],
  pausado: ['planificacion', 'diseno', 'preconstruccion', 'construccion', 'cierre'],
  finalizado: ['cierre'],
};

export function getTransicionValida(
  desde: ProyectoEstado,
  hacia: ProyectoEstado
): TransicionValida | undefined {
  return TRANSICIONES.find(t => t.desde === desde && t.hacia === hacia);
}

export function puedeTransicionar(
  estadoActual: ProyectoEstado,
  nuevoEstado: ProyectoEstado
): boolean {
  return TRANSICIONES.some(t => t.desde === estadoActual && t.hacia === nuevoEstado);
}

export function getEstadosDisponibles(estadoActual: ProyectoEstado): ProyectoEstado[] {
  return TRANSICIONES.filter(t => t.desde === estadoActual).map(t => t.hacia);
}

export function getEtapasValidas(estado: ProyectoEstado): ProyectoEtapa[] {
  return ETAPAS_POR_ESTADO[estado] || [];
}

export function validarTransicion(
  estadoActual: ProyectoEstado,
  nuevoEstado: ProyectoEstado,
  etapa?: ProyectoEtapa,
  contexto?: {
    tienePresupuestoAprobado?: boolean;
    tieneHitos?: boolean;
    motivoPausa?: string;
    avanceFisico?: number;
    avanceFinanciero?: number;
  }
): ResultadoTransicion {
  const resultado: ResultadoTransicion = { valido: true, errores: [], warnings: [] };

  const transicion = getTransicionValida(estadoActual, nuevoEstado);
  if (!transicion) {
    resultado.valido = false;
    resultado.errores.push(`Transición inválida: ${estadoActual} → ${nuevoEstado}`);
    return resultado;
  }

  if (etapa && !transicion.etapasValidas.includes(etapa)) {
    resultado.valido = false;
    resultado.errores.push(`Etapa "${etapa}" no es válida para transición ${estadoActual} → ${nuevoEstado}`);
  }

  if (etapa && !ETAPAS_POR_ESTADO[nuevoEstado].includes(etapa)) {
    resultado.valido = false;
    resultado.errores.push(`Etapa "${etapa}" no es válida para estado ${nuevoEstado}`);
  }

  if (transicion.requisitos.includes('presupuesto_aprobado')) {
    if (!contexto) {
      resultado.valido = false;
      resultado.errores.push('Requiere presupuesto aprobado');
    } else if (!contexto.tienePresupuestoAprobado) {
      resultado.valido = false;
      resultado.errores.push('Requiere presupuesto aprobado');
    }
  }

  if (transicion.requisitos.includes('hitos_definidos')) {
    if (!contexto) {
      resultado.valido = false;
      resultado.errores.push('Requiere al menos un hito definido');
    } else if (!contexto.tieneHitos) {
      resultado.valido = false;
      resultado.errores.push('Requiere al menos un hito definido');
    }
  }

  if (transicion.requisitos.includes('motivo_pausa')) {
    if (!contexto?.motivoPausa) {
      resultado.valido = false;
      resultado.errores.push('motivoPausa es requerido para pausar');
    }
  }

  if (transicion.requisitos.includes('avance_100')) {
    if (!contexto) {
      resultado.valido = false;
      resultado.errores.push('Requiere avance 100% para finalizar');
    } else {
      if (contexto.avanceFisico < 100) {
        resultado.valido = false;
        resultado.errores.push('Requiere avance físico 100% para finalizar');
      }
      if (contexto.avanceFinanciero < 100) {
        resultado.valido = false;
        resultado.errores.push('Requiere avance financiero 100% para finalizar');
      }
    }
  }

  return resultado;
}

export function applyTransicionAutomatica(
  estadoActual: ProyectoEstado,
  nuevoEstado: ProyectoEstado,
  patch: Record<string, any>
): Record<string, any> {
  const result = { ...patch };

  if (nuevoEstado === 'finalizado') {
    result.avanceFisico = 100;
    result.avanceFinanciero = 100;
  }

  if (nuevoEstado === 'ejecucion' && estadoActual === 'planeacion') {
    result.etapa = 'construccion';
  }

  if (nuevoEstado === 'pausado') {
    result.fechaPausa = new Date().toISOString();
  }

  if (estadoActual === 'pausado' && nuevoEstado === 'ejecucion') {
    result.fechaReanudacion = new Date().toISOString();
  }

  return result;
}
