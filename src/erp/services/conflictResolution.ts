import type { 
  ResourceConflict, 
  ResolutionSuggestion, 
  ConflictResolution 
} from '../types/conflicts';
import { uid } from '../store';

export class ConflictResolutionService {
  generateSuggestions(conflict: ResourceConflict): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];
    
    switch (conflict.tipo) {
      case 'empleado':
        suggestions.push(...this.generateEmployeeSuggestions(conflict));
        break;
      case 'material':
        suggestions.push(...this.generateMaterialSuggestions(conflict));
        break;
      case 'activo':
        suggestions.push(...this.generateAssetSuggestions(conflict));
        break;
      case 'timeline':
        suggestions.push(...this.generateTimelineSuggestions(conflict));
        break;
    }
    
    return suggestions.sort((a, b) => b.probabilidadExito - a.probabilidadExito);
  }
  
  private generateEmployeeSuggestions(conflict: ResourceConflict): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];
    const projects = conflict.proyectos;
    const sortedProjects = [...projects].sort((a, b) => b.prioridad - a.prioridad);
    
    if (sortedProjects.length > 1) {
      const highPriorityProject = sortedProjects[0];
      const otherProjects = sortedProjects.slice(1);
      
      suggestions.push({
        id: uid(),
        conflictoId: conflict.id,
        tipo: 'reasignar',
        titulo: 'Mantener en proyecto prioritario',
        descripcion: `Asignar ${conflict.recursoNombre} exclusivamente a ${highPriorityProject.proyectoNombre} y buscar reemplazo para otros proyectos`,
        ventajas: [
          'Maximiza eficiencia en proyecto crítico',
          'Elimina conflicto de schedule',
          'Mantiene especialización del empleado'
        ],
        desventajas: [
          'Requiere contratar personal adicional',
          'Puede aumentar costos temporales',
          'Necesita periodo de capacitación'
        ],
        costoEstimado: conflict.impactoCosto * 0.8,
        impactoPlazo: 7,
        probabilidadExito: 85,
        esfuerzoImplementacion: 'medio'
      });
      
      suggestions.push({
        id: uid(),
        conflictoId: conflict.id,
        tipo: 'reprogramar',
        titulo: 'Programar por turnos',
        descripcion: `Establecer turnos escalonados para atender múltiples proyectos sin superposición`,
        ventajas: [
          'Mantiene empleado en todos los proyectos',
          'No requiere contratación adicional',
          'Optimiza utilización de recurso'
        ],
        desventajas: [
          'Reduce disponibilidad por proyecto',
          'Puede extender plazos',
          'Requiere coordinación compleja'
        ],
        costoEstimado: conflict.impactoCosto * 0.2,
        impactoPlazo: conflict.impactoPlazo * 0.5,
        probabilidadExito: 70,
        esfuerzoImplementacion: 'bajo'
      });
      
      suggestions.push({
        id: uid(),
        conflictoId: conflict.id,
        tipo: 'subcontratar',
        titulo: 'Subcontratar para proyectos secundarios',
        descripcion: `Mantener empleado en proyecto principal y subcontratar personal para proyectos de menor prioridad`,
        ventajas: [
          'Mantiene control de proyecto crítico',
          'Flexibilidad en contratación',
          'Costo variable según necesidad'
        ],
        desventajas: [
          'Costo unitario más elevado',
          'Menor control de calidad',
          'Dependencia de terceros'
        ],
        costoEstimado: conflict.impactoCosto * 1.2,
        impactoPlazo: 3,
        probabilidadExito: 75,
        esfuerzoImplementacion: 'bajo'
      });
    }
    
    return suggestions;
  }
  
  private generateMaterialSuggestions(conflict: ResourceConflict): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];
    
    suggestions.push({
      id: uid(),
      conflictoId: conflict.id,
      tipo: 'adquirir',
      titulo: 'Compra urgente de material',
      descripcion: 'Adquirir stock adicional para cubrir déficit inmediato',
      ventajas: [
        'Solución inmediata al problema',
        'Mantiene continuidad de obras',
        'Puede negociar descuentos por volumen'
      ],
      desventajas: [
        'Aumenta costo del proyecto',
        'Requiere flujo de caja disponible',
        'Puede generar exceso de inventario'
      ],
      costoEstimado: conflict.impactoCosto,
      impactoPlazo: 5,
      probabilidadExito: 90,
      esfuerzoImplementacion: 'bajo'
    });
    
    suggestions.push({
      id: uid(),
      conflictoId: conflict.id,
      tipo: 'reprogramar',
      titulo: 'Reprogramar actividades',
      descripcion: 'Reorganizar cronograma para usar material cuando esté disponible',
      ventajas: [
        'No aumenta costos',
        'Optimiza uso de existencias',
        'Mantiene presupuesto original'
      ],
      desventajas: [
        'Extiende plazos de entrega',
        'Requiere replanificación',
        'Puede afectar hitos críticos'
      ],
      costoEstimado: conflict.impactoCosto * 0.1,
      impactoPlazo: conflict.impactoPlazo * 1.5,
      probabilidadExito: 65,
      esfuerzoImplementacion: 'alto'
    });
    
    suggestions.push({
      id: uid(),
      conflictoId: conflict.id,
      tipo: 'reasignar',
      titulo: 'Usar material alternativo',
      descripcion: 'Sustituir por material equivalente disponible en stock',
      ventajas: [
        'Solución rápida',
        'Puede no requerir aprobación adicional',
        'Mantiene cronograma'
      ],
      desventajas: [
        'Puede afectar calidad especificada',
        'Requiere validación técnica',
        'Posible rechazo por cliente'
      ],
      costoEstimado: conflict.impactoCosto * 0.3,
      impactoPlazo: 2,
      probabilidadExito: 60,
      esfuerzoImplementacion: 'medio'
    });
    
    return suggestions;
  }
  
  private generateAssetSuggestions(conflict: ResourceConflict): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];
    
    suggestions.push({
      id: uid(),
      conflictoId: conflict.id,
      tipo: 'reprogramar',
      titulo: 'Programar uso escalonado',
      descripcion: 'Establecer calendario de uso por proyecto para evitar superposiciones',
      ventajas: [
        'Maximiza utilización del equipo',
        'No requiere inversión adicional',
        'Mantiene control del activo'
      ],
      desventajas: [
        'Reduce disponibilidad por proyecto',
        'Puede extender plazos',
        'Requiere logística de transporte'
      ],
      costoEstimado: conflict.impactoCosto * 0.3,
      impactoPlazo: conflict.impactoPlazo * 0.7,
      probabilidadExito: 80,
      esfuerzoImplementacion: 'medio'
    });
    
    suggestions.push({
      id: uid(),
      conflictoId: conflict.id,
      tipo: 'adquirir',
      titulo: 'Alquilar equipo adicional',
      descripcion: 'Alquilar equipo similar para proyecto de menor prioridad',
      ventajas: [
        'Solución inmediata',
        'Costo temporal conocido',
        'Mantiene cronograma'
      ],
      desventajas: [
        'Aumenta costos operativos',
        'Dependencia de disponibilidad',
        'Calidad puede variar'
      ],
      costoEstimado: conflict.impactoCosto * 0.6,
      impactoPlazo: 3,
      probabilidadExito: 85,
      esfuerzoImplementacion: 'bajo'
    });
    
    suggestions.push({
      id: uid(),
      conflictoId: conflict.id,
      tipo: 'subcontratar',
      titulo: 'Subcontrar servicio',
      descripcion: 'Contratar empresa externa que provea equipo y operador',
      ventajas: [
        'Incluye operación y mantenimiento',
        'Transferencia de riesgo',
        'Flexibilidad contractual'
      ],
      desventajas: [
        'Costo más elevado',
        'Menor control operativo',
        'Dependencia de terceros'
      ],
      costoEstimado: conflict.impactoCosto * 1.1,
      impactoPlazo: 2,
      probabilidadExito: 80,
      esfuerzoImplementacion: 'bajo'
    });
    
    return suggestions;
  }
  
  private generateTimelineSuggestions(conflict: ResourceConflict): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];
    
    suggestions.push({
      id: uid(),
      conflictoId: conflict.id,
      tipo: 'reprogramar',
      titulo: 'Replanificar hitos críticos',
      descripcion: 'Renegociar fechas de entrega con cliente y ajustar cronograma',
      ventajas: [
        'Alinea expectativas con realidad',
        'Reduce presión sobre equipo',
        'Mantiene calidad del trabajo'
      ],
      desventajas: [
        'Puede afectar relación comercial',
        'Posibles penalizaciones contractuales',
        'Requiere formalización'
      ],
      costoEstimado: conflict.impactoCosto * 0.5,
      impactoPlazo: conflict.impactoPlazo,
      probabilidadExito: 70,
      esfuerzoImplementacion: 'alto'
    });
    
    suggestions.push({
      id: uid(),
      conflictoId: conflict.id,
      tipo: 'adquirir',
      titulo: 'Asignar recursos adicionales',
      descripcion: 'Incrementar personal y equipos para recuperar tiempo perdido',
      ventajas: [
        'Puede recuperar plazos originales',
        'Muestra compromiso con cliente',
        'Acelera actividades críticas'
      ],
      desventajas: [
        'Aumenta significativamente costos',
        'Puede generar ineficiencias',
        'Requiere coordinación compleja'
      ],
      costoEstimado: conflict.impactoCosto * 1.5,
      impactoPlazo: -conflict.impactoPlazo * 0.5,
      probabilidadExito: 75,
      esfuerzoImplementacion: 'alto'
    });
    
    suggestions.push({
      id: uid(),
      conflictoId: conflict.id,
      tipo: 'cancelar',
      titulo: 'Eliminar actividades no críticas',
      descripcion: 'Revisar alcance y eliminar actividades que no afecten entregables principales',
      ventajas: [
        'Reduce carga de trabajo',
        'No aumenta costos',
        'Simplifica gestión'
      ],
      desventajas: [
        'Puede afectar calidad final',
        'Requiere aprobación de cliente',
        'Reduce valor entregado'
      ],
      costoEstimado: 0,
      impactoPlazo: -conflict.impactoPlazo * 0.3,
      probabilidadExito: 55,
      esfuerzoImplementacion: 'medio'
    });
    
    return suggestions;
  }
  
  applyResolution(
    conflict: ResourceConflict,
    suggestion: ResolutionSuggestion,
    responsable: string
  ): ConflictResolution {
    return {
      tipo: suggestion.tipo,
      descripcion: suggestion.descripcion,
      costoEstimado: suggestion.costoEstimado,
      impactoPlazo: suggestion.impactoPlazo,
      responsable,
      fechaImplementacion: new Date().toISOString()
    };
  }
  
  calculateResolutionImpact(
    conflict: ResourceConflict,
    resolution: ConflictResolution
  ): { costoSavings: number; plazoReduction: number } {
    const costoSavings = conflict.impactoCosto - resolution.costoEstimado;
    const plazoReduction = conflict.impactoPlazo - resolution.impactoPlazo;
    
    return {
      costoSavings: Math.max(0, costoSavings),
      plazoReduction: Math.max(0, plazoReduction)
    };
  }
}

export const conflictResolutionService = new ConflictResolutionService();