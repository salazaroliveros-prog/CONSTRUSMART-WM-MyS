export type ConflictType = 'empleado' | 'material' | 'activo' | 'equipo' | 'timeline';
export type ConflictSeverity = 'bajo' | 'medio' | 'alto' | 'critico';
export type ConflictStatus = 'detectado' | 'en_revision' | 'resuelto' | 'ignorado';

export interface ResourceConflict {
  id: string;
  tipo: ConflictType;
  severidad: ConflictSeverity;
  estado: ConflictStatus;
  titulo: string;
  descripcion: string;
  recursoId: string;
  recursoNombre: string;
  proyectos: ConflictProject[];
  fechaDeteccion: string;
  fechaResolucion?: string;
  impactoCosto: number;
  impactoPlazo: number;
  resolucion?: ConflictResolution;
}

export interface ConflictProject {
  proyectoId: string;
  proyectoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  porcentajeUso: number;
  prioridad: number;
}

export interface ConflictResolution {
  tipo: 'reprogramar' | 'reasignar' | 'adquirir' | 'subcontratar' | 'cancelar';
  descripcion: string;
  costoEstimado: number;
  impactoPlazo: number;
  responsable: string;
  fechaImplementacion: string;
}

export interface ResolutionSuggestion {
  id: string;
  conflictoId: string;
  tipo: ConflictResolution['tipo'];
  titulo: string;
  descripcion: string;
  ventajas: string[];
  desventajas: string[];
  costoEstimado: number;
  impactoPlazo: number;
  probabilidadExito: number;
  esfuerzoImplementacion: 'bajo' | 'medio' | 'alto';
}

export interface ConflictStats {
  total: number;
  porSeveridad: Record<ConflictSeverity, number>;
  porTipo: Record<ConflictType, number>;
  porEstado: Record<ConflictStatus, number>;
  impactoCostoTotal: number;
  impactoPlazoTotal: number;
  resueltosMes: number;
}

export interface ResourceAllocation {
  recursoId: string;
  recursoNombre: string;
  tipo: ConflictType;
  proyectosAsignados: number;
  capacidadTotal: number;
  capacidadUsada: number;
  porcentajeUtilizacion: number;
  conflictosActivos: number;
}