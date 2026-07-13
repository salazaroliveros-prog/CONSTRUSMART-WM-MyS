import type { 
  ResourceConflict, 
  ConflictType, 
  ConflictSeverity, 
  ConflictProject,
  ResourceAllocation 
} from '../types/conflicts';
import type { Proyecto, Empleado, Material, ActivoHerramienta } from '../types';
import { uid } from '../store';

// Smart Resource Conflict Detection Service

export class ConflictDetectionService {
  detectEmployeeConflicts(
    empleados: Empleado[] | null | undefined, 
    proyectos: Proyecto[]
  ): ResourceConflict[] {
    const conflicts: ResourceConflict[] = [];
    const listaEmpleados = Array.isArray(empleados) ? empleados : [];
    
    listaEmpleados.forEach(empleado => {
      if (!empleado.activo || !empleado.proyectoIds || empleado.proyectoIds.length <= 1) return;
      
      const proyectosEmp = empleado.proyectoIds
        .map(id => proyectos.find(p => p.id === id))
        .filter((p): p is Proyecto => p !== undefined && p.estado === 'ejecucion');
      
      if (proyectosEmp.length <= 1) return;
      
      const overlappingProjects = this.findOverlappingProjects(proyectosEmp);
      
      if (overlappingProjects.length > 1) {
        const severidad = this.calculateSeverity(
          overlappingProjects.length,
          empleado.salarioDiario || 0,
          overlappingProjects.length
        );
        
        const conflictProyectos: ConflictProject[] = overlappingProjects.map(p => ({
          proyectoId: p.id,
          proyectoNombre: p.nombre,
          fechaInicio: p.fechaInicio,
          fechaFin: p.fechaFin,
          porcentajeUso: 100 / overlappingProjects.length,
          prioridad: this.calculateProjectPriority(p)
        }));
        
        conflicts.push({
          id: uid(),
          tipo: 'empleado',
          severidad,
          estado: 'detectado',
          titulo: `Empleado asignado a múltiples proyectos simultáneos`,
          descripcion: `${empleado.nombre} está asignado a ${overlappingProjects.length} proyectos con fechas superpuestas`,
          recursoId: empleado.id,
          recursoNombre: empleado.nombre,
          proyectos: conflictProyectos,
          fechaDeteccion: new Date().toISOString(),
          impactoCosto: empleado.salarioDiario * 30,
          impactoPlazo: overlappingProjects.length * 3
        });
      }
    });
    
    return conflicts;
  }
  
  detectMaterialConflicts(
    materiales: Material[] | null | undefined,
    proyectos: Proyecto[],
    ordenes: any[]
  ): ResourceConflict[] {
    const conflicts: ResourceConflict[] = [];
    const listaMateriales = Array.isArray(materiales) ? materiales : [];
    
    listaMateriales.forEach(material => {
      const projectUsage = this.calculateMaterialUsage(material.id, proyectos, ordenes);
      
      if (projectUsage.length > 1) {
        const totalRequested = projectUsage.reduce((sum, p) => sum + p.cantidad, 0);
        const availability = material.stock || 0;
        
        if (totalRequested > availability) {
          const shortage = totalRequested - availability;
          const severidad = this.calculateSeverity(
            projectUsage.length,
            shortage * material.precioUnitario,
            shortage / availability
          );
          
          const conflictProyectos: ConflictProject[] = projectUsage.map(p => {
            const proyecto = proyectos.find(proj => proj.id === p.proyectoId);
            return {
              proyectoId: p.proyectoId,
              proyectoNombre: proyecto?.nombre || 'Desconocido',
              fechaInicio: proyecto?.fechaInicio || '',
              fechaFin: proyecto?.fechaFin || '',
              porcentajeUso: (p.cantidad / totalRequested) * 100,
              prioridad: proyecto ? this.calculateProjectPriority(proyecto) : 1
            };
          });
          
          conflicts.push({
            id: uid(),
            tipo: 'material',
            severidad,
            estado: 'detectado',
            titulo: `Stock insuficiente para material crítico`,
            descripcion: `${material.nombre}: Se requieren ${totalRequested} unidades, solo ${availability} disponibles`,
            recursoId: material.id,
            recursoNombre: material.nombre,
            proyectos: conflictProyectos,
            fechaDeteccion: new Date().toISOString(),
            impactoCosto: shortage * material.precioUnitario,
            impactoPlazo: Math.ceil(shortage / material.stockMinimo) * 2
          });
        }
      }
    });
    
    return conflicts;
  }
  
  detectAssetConflicts(
    activos: ActivoHerramienta[] | null | undefined,
    proyectos: Proyecto[]
  ): ResourceConflict[] {
    const conflicts: ResourceConflict[] = [];
    const listaActivos = Array.isArray(activos) ? activos : [];
    
    listaActivos.forEach(activo => {
      if (!activo.activo || !activo.proyectoIds || activo.proyectoIds.length <= 1) return;
      
      const proyectosActivo = activo.proyectoIds
        .map(id => proyectos.find(p => p.id === id))
        .filter((p): p is Proyecto => p !== undefined && p.estado === 'ejecucion');
      
      if (proyectosActivo.length <= 1) return;
      
      const overlappingProjects = this.findOverlappingProjects(proyectosActivo);
      
      if (overlappingProjects.length > 1) {
        const severidad = this.calculateSeverity(
          overlappingProjects.length,
          activo.valorAdquisicion || 0,
          overlappingProjects.length
        );
        
        const conflictProyectos: ConflictProject[] = overlappingProjects.map(p => ({
          proyectoId: p.id,
          proyectoNombre: p.nombre,
          fechaInicio: p.fechaInicio,
          fechaFin: p.fechaFin,
          porcentajeUso: 100 / overlappingProjects.length,
          prioridad: this.calculateProjectPriority(p)
        }));
        
        conflicts.push({
          id: uid(),
          tipo: 'activo',
          severidad,
          estado: 'detectado',
          titulo: `Equipo/Activo asignado a múltiples proyectos simultáneos`,
          descripcion: `${activo.nombre} está asignado a ${overlappingProjects.length} proyectos con fechas superpuestas`,
          recursoId: activo.id,
          recursoNombre: activo.nombre,
          proyectos: conflictProyectos,
          fechaDeteccion: new Date().toISOString(),
          impactoCosto: activo.valorAdquisicion * 0.1,
          impactoPlazo: overlappingProjects.length * 5
        });
      }
    });
    
    return conflicts;
  }
  
  detectTimelineConflicts(
    proyectos: Proyecto[],
    hitos: any[]
  ): ResourceConflict[] {
    const conflicts: ResourceConflict[] = [];
    
    const activeProjects = proyectos.filter(p => p.estado === 'ejecucion');
    
    activeProjects.forEach(proyecto => {
      const projectHitos = hitos.filter(h => h.proyectoId === proyecto.id);
      
      const delayedHitos = projectHitos.filter(h => {
        if (!h.fecha || h.estado === 'completado') return false;
        const hitoDate = new Date(h.fecha);
        const today = new Date();
        return hitoDate < today && h.estado !== 'completado';
      });
      
      if (delayedHitos.length > 0) {
        const maxDelay = Math.max(...delayedHitos.map(h => {
          const hitoDate = new Date(h.fecha);
          const today = new Date();
          return Math.floor((today.getTime() - hitoDate.getTime()) / (1000 * 60 * 60 * 24));
        }));
        
        const severidad: ConflictSeverity = 
          maxDelay > 30 ? 'critico' : 
          maxDelay > 14 ? 'alto' : 
          maxDelay > 7 ? 'medio' : 'bajo';
        
        conflicts.push({
          id: uid(),
          tipo: 'timeline',
          severidad,
          estado: 'detectado',
          titulo: `Hitos retrasados en proyecto`,
          descripcion: `${delayedHitos.length} hitos con retraso de hasta ${maxDelay} días`,
          recursoId: proyecto.id,
          recursoNombre: proyecto.nombre,
          proyectos: [{
            proyectoId: proyecto.id,
            proyectoNombre: proyecto.nombre,
            fechaInicio: proyecto.fechaInicio,
            fechaFin: proyecto.fechaFin,
            porcentajeUso: 100,
            prioridad: this.calculateProjectPriority(proyecto)
          }],
          fechaDeteccion: new Date().toISOString(),
          impactoCosto: maxDelay * (proyecto.presupuestoTotal * 0.01),
          impactoPlazo: maxDelay
        });
      }
    });
    
    return conflicts;
  }
  
  private findOverlappingProjects(proyectos: Proyecto[]): Proyecto[] {
    if (proyectos.length <= 1) return proyectos;
    
    const overlapping: Proyecto[] = [proyectos[0]];
    
    for (let i = 1; i < proyectos.length; i++) {
      const current = proyectos[i];
      const hasOverlap = overlapping.some(p => this.doPeriodsOverlap(
        p.fechaInicio, p.fechaFin,
        current.fechaInicio, current.fechaFin
      ));
      
      if (hasOverlap) {
        overlapping.push(current);
      }
    }
    
    return overlapping;
  }
  
  private doPeriodsOverlap(
    start1: string, end1: string,
    start2: string, end2: string
  ): boolean {
    if (!start1 || !end1 || !start2 || !end2) return false;
    
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    
    return s1 <= e2 && s2 <= e1;
  }
  
  private calculateSeverity(
    conflictCount: number,
    costImpact: number,
    utilizationRatio: number
  ): ConflictSeverity {
    if (conflictCount >= 4 || costImpact > 100000 || utilizationRatio > 2) return 'critico';
    if (conflictCount >= 3 || costImpact > 50000 || utilizationRatio > 1.5) return 'alto';
    if (conflictCount >= 2 || costImpact > 10000 || utilizationRatio > 1.2) return 'medio';
    return 'bajo';
  }
  
  private calculateProjectPriority(proyecto: Proyecto): number {
    let priority = 1;
    
    if (proyecto.estado === 'ejecucion') priority += 2;
    if (proyecto.montoContrato > 1000000) priority += 1;
    if (proyecto.avanceFisico > 50) priority += 1;
    
    const daysUntilEnd = proyecto.fechaFin 
      ? Math.floor((new Date(proyecto.fechaFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 999;
    
    if (daysUntilEnd < 30) priority += 2;
    else if (daysUntilEnd < 60) priority += 1;
    
    return priority;
  }
  
  private calculateMaterialUsage(
    materialId: string,
    proyectos: Proyecto[],
    ordenes: any[]
  ): Array<{ proyectoId: string; cantidad: number }> {
    const usage: Array<{ proyectoId: string; cantidad: number }> = [];
    
    proyectos.forEach(proyecto => {
      const projectOrdenes = ordenes.filter(o => 
        o.proyectoId === proyecto.id && 
        o.materialId === materialId &&
        o.estado !== 'cancelado'
      );
      
      const totalQuantity = projectOrdenes.reduce((sum, o) => sum + (o.cantidad || 0), 0);
      
      if (totalQuantity > 0) {
        usage.push({
          proyectoId: proyecto.id,
          cantidad: totalQuantity
        });
      }
    });
    
    return usage;
  }
  
  calculateResourceAllocation(
    empleados: Empleado[] | null | undefined,
    materiales: Material[] | null | undefined,
    activos: ActivoHerramienta[] | null | undefined,
    proyectos: Proyecto[]
  ): ResourceAllocation[] {
    const allocations: ResourceAllocation[] = [];
    const listaEmpleados = Array.isArray(empleados) ? empleados : [];
    const listaMateriales = Array.isArray(materiales) ? materiales : [];
    const listaActivos = Array.isArray(activos) ? activos : [];
    
    listaEmpleados.forEach(emp => {
      if (!emp.activo) return;
      const proyectosCount = emp.proyectoIds?.length || 0;
      allocations.push({
        recursoId: emp.id,
        recursoNombre: emp.nombre,
        tipo: 'empleado',
        proyectosAsignados: proyectosCount,
        capacidadTotal: 1,
        capacidadUsada: Math.min(proyectosCount, 1),
        porcentajeUtilizacion: Math.min(proyectosCount * 100, 100),
        conflictosActivos: proyectosCount > 1 ? 1 : 0
      });
    });
    
    listaMateriales.forEach(mat => {
      const usage = this.calculateMaterialUsage(mat.id, proyectos, []);
      const totalRequested = usage.reduce((sum, u) => sum + u.cantidad, 0);
      allocations.push({
        recursoId: mat.id,
        recursoNombre: mat.nombre,
        tipo: 'material',
        proyectosAsignados: usage.length,
        capacidadTotal: mat.stock || 0,
        capacidadUsada: Math.min(totalRequested, mat.stock || 0),
        porcentajeUtilizacion: mat.stock > 0 ? (totalRequested / mat.stock) * 100 : 0,
        conflictosActivos: totalRequested > (mat.stock || 0) ? 1 : 0
      });
    });
    
    listaActivos.forEach(act => {
      if (!act.activo) return;
      const proyectosCount = act.proyectoIds?.length || 0;
      allocations.push({
        recursoId: act.id,
        recursoNombre: act.nombre,
        tipo: 'activo',
        proyectosAsignados: proyectosCount,
        capacidadTotal: 1,
        capacidadUsada: Math.min(proyectosCount, 1),
        porcentajeUtilizacion: Math.min(proyectosCount * 100, 100),
        conflictosActivos: proyectosCount > 1 ? 1 : 0
      });
    });
    
    return allocations;
  }
  
  detectAllConflicts(
    empleados: Empleado[] | null | undefined,
    materiales: Material[] | null | undefined,
    activos: ActivoHerramienta[] | null | undefined,
    proyectos: Proyecto[],
    hitos: any[],
    ordenes: any[]
  ): ResourceConflict[] {
    const allConflicts: ResourceConflict[] = [];
    
    allConflicts.push(...this.detectEmployeeConflicts(empleados, proyectos));
    allConflicts.push(...this.detectMaterialConflicts(materiales, proyectos, ordenes));
    allConflicts.push(...this.detectAssetConflicts(activos, proyectos));
    allConflicts.push(...this.detectTimelineConflicts(proyectos, hitos));
    
    return allConflicts.sort((a, b) => {
      const severityOrder = { critico: 0, alto: 1, medio: 2, bajo: 3 };
      return severityOrder[a.severidad] - severityOrder[b.severidad];
    });
  }
}

export const conflictDetectionService = new ConflictDetectionService();