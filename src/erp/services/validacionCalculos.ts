import { supabase } from '@/lib/supabase';
import { safeLogger } from '@/lib/safeLogger';
import { useErpStore } from '@/erp/zustandStore';

export interface AlertaInconsistencia {
  id: string;
  tipo: 'critica' | 'alta' | 'media' | 'baja';
  categoria: 'tecnica' | 'logica' | 'normativa' | 'consistencia';
  mensaje: string;
  descripcion: string;
  origen: string;
  sugerencia_correccion?: string;
  contexto: Record<string, unknown>;
  fecha_deteccion: string;
  estado: 'pendiente' | 'revisada' | 'corregida' | 'ignorada';
}

export interface ResultadoValidacion {
  valido: boolean;
  alertas: AlertaInconsistencia[];
  score_consistencia: number;
  recomendaciones: string[];
}

export interface ValidacionCruzada {
  tipo_validacion: string;
  motores_comparados: string[];
  resultado: boolean;
  diferencias: Record<string, unknown>;
  alertas_generadas: AlertaInconsistencia[];
}

export class ValidacionCalculos {
  async validarConsistenciaCalculo(calculoId: string): Promise<ResultadoValidacion> {
    try {
      const alertas: AlertaInconsistencia[] = [];
      
      // Obtener datos del cálculo
      const { data: calculo, error: errorCalculo } = await supabase
        .from('erp_calculos_proyecto')
        .select('*')
        .eq('id', calculoId)
        .single();

      if (errorCalculo) throw errorCalculo;

      // Validaciones según tipo de cálculo
      switch (calculo.tipo_calculo) {
        case 'dosificacion_concreto':
          alertas.push(...await this.validarDosificacionConcreto(calculo.parametros_entrada, calculo.resultado_calculado));
          break;
        case 'desglose_acero':
          alertas.push(...await this.validarDesgloseAcero(calculo.parametros_entrada, calculo.resultado_calculado));
          break;
        case 'movimiento_tierra':
          alertas.push(...await this.validarMovimientoTierra(calculo.parametros_entrada, calculo.resultado_calculado));
          break;
        case 'pavimento':
          alertas.push(...await this.validarPavimento(calculo.parametros_entrada, calculo.resultado_calculado));
          break;
        default:
          alertas.push(...await this.validarCalculoGenerico(calculo.parametros_entrada, calculo.resultado_calculado));
      }

      // Validaciones cruzadas con otros motores
      alertas.push(...await this.validacionesCruzadas(calculo));

      // Calcular score de consistencia
      const scoreConsistencia = this.calcularScoreConsistencia(alertas);

      // Generar recomendaciones
      const recomendaciones = this.generarRecomendaciones(alertas);

      // Guardar alertas en el cálculo
      await this.guardarAlertasCalculo(calculoId, alertas);

      return {
        valido: alertas.filter(a => a.tipo === 'critica').length === 0,
        alertas,
        score_consistencia: scoreConsistencia,
        recomendaciones,
      };
    } catch (error) {
      console.error('Error validando consistencia:', error);
      return {
        valido: false,
        alertas: [],
        score_consistencia: 0,
        recomendaciones: [],
      };
    }
  }

  private async validarDosificacionConcreto(parametros: Record<string, unknown>, resultado: Record<string, unknown>): Promise<AlertaInconsistencia[]> {
    const alertas: AlertaInconsistencia[] = [];
    
    const resistencia = parametros.resistencia as string;
    const tipo = parametros.tipo as string;
    const dosificacion = resultado as Record<string, unknown>;

    // Validación 1: Resistencia vs tipo de uso
    if (resistencia && tipo) {
      if (tipo === 'cimentacion' && resistencia !== '3000psi' && resistencia !== '2500psi') {
        alertas.push({
          id: `val-${Date.now()}-1`,
          tipo: 'media',
          categoria: 'tecnica',
          mensaje: 'Resistencia inusual para cimentaciones',
          descripcion: `Para cimentaciones se recomienda 2500-3000 psi, se usó ${resistencia}`,
          origen: 'validacion_dosificacion',
          sugerencia_correccion: 'Considerar usar 2500psi o 3000psi para cimentaciones',
          contexto: { resistencia, tipo },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }

      if (tipo === 'estructura' && resistencia !== '4000psi' && resistencia !== '4500psi') {
        alertas.push({
          id: `val-${Date.now()}-2`,
          tipo: 'alta',
          categoria: 'normativa',
          mensaje: 'Resistencia estructural insuficiente',
          descripcion: `Para elementos estructurales se recomienda 4000-4500 psi, se usó ${resistencia}`,
          origen: 'validacion_dosificacion',
          sugerencia_correccion: 'Aumentar a 4000psi o 4500psi para elementos estructurales',
          contexto: { resistencia, tipo },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }
    }

    // Validación 2: Proporciones cemento:arena:piedra
    if (dosificacion.cemento_sacos_m3 && dosificacion.arena_m3_m3 && dosificacion.piedra_m3_m3) {
      const cemento = dosificacion.cemento_sacos_m3 as number;
      const arena = dosificacion.arena_m3_m3 as number;
      const piedra = dosificacion.piedra_m3_m3 as number;

      if (cemento < 5 || cemento > 9) {
        alertas.push({
          id: `val-${Date.now()}-3`,
          tipo: 'alta',
          categoria: 'tecnica',
          mensaje: 'Cantidad de cemento fuera de rango típico',
          descripcion: `Cemento ${cemento} sacos/m³ fuera de rango típico (5-9 sacos/m³)`,
          origen: 'validacion_dosificacion',
          sugerencia_correccion: 'Ajustar cantidad de cemento a rango típico de 5-9 sacos/m³',
          contexto: { cemento, arena, piedra },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }

      if (arena < 0.35 || arena > 0.55) {
        alertas.push({
          id: `val-${Date.now()}-4`,
          tipo: 'media',
          categoria: 'tecnica',
          mensaje: 'Proporción de arena fuera de rango',
          descripcion: `Arena ${arena} m³/m³ fuera de rango típico (0.35-0.55 m³/m³)`,
          origen: 'validacion_dosificacion',
          sugerencia_correccion: 'Ajustar proporción de arena a rango típico',
          contexto: { cemento, arena, piedra },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }

      if (piedra < 0.75 || piedra > 1.10) {
        alertas.push({
          id: `val-${Date.now()}-5`,
          tipo: 'media',
          categoria: 'tecnica',
          mensaje: 'Proporción de piedra fuera de rango',
          descripcion: `Piedra ${piedra} m³/m³ fuera de rango típico (0.75-1.10 m³/m³)`,
          origen: 'validacion_dosificacion',
          sugerencia_correccion: 'Ajustar proporción de piedra a rango típico',
          contexto: { cemento, arena, piedra },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }
    }

    return alertas;
  }

  private async validarDesgloseAcero(parametros: Record<string, unknown>, resultado: Record<string, unknown>): Promise<AlertaInconsistencia[]> {
    const alertas: AlertaInconsistencia[] = [];
    
    const elemento = parametros.elemento as string;
    const grado = parametros.grado as number;
    const desglose = resultado as Record<string, unknown>;

    // Validación 1: Grado según elemento
    if (elemento === 'columna' && grado !== 60) {
      alertas.push({
        id: `val-${Date.now()}-6`,
        tipo: 'alta',
        categoria: 'normativa',
        mensaje: 'Grado de acero insuficiente para columnas',
        descripcion: 'Para columnas estructurales se recomienda grado 60',
        origen: 'validacion_acero',
        sugerencia_correccion: 'Considerar usar acero grado 60 para columnas',
        contexto: { elemento, grado },
        fecha_deteccion: new Date().toISOString(),
        estado: 'pendiente',
      });
    }

    // Validación 2: Cantidad total de acero
    if (desglose.total_kg_m3) {
      const total = desglose.total_kg_m3 as number;
      if (total < 50 || total > 300) {
        alertas.push({
          id: `val-${Date.now()}-7`,
          tipo: 'media',
          categoria: 'tecnica',
          mensaje: 'Cantidad de acero fuera de rango típico',
          descripcion: `Total ${total} kg/m³ fuera de rango típico (50-300 kg/m³)`,
          origen: 'validacion_acero',
          sugerencia_correccion: 'Revisar cantidad de acero según tipo de elemento',
          contexto: { elemento, total },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }
    }

    return alertas;
  }

  private async validarMovimientoTierra(parametros: Record<string, unknown>, resultado: Record<string, unknown>): Promise<AlertaInconsistencia[]> {
    const alertas: AlertaInconsistencia[] = [];
    
    const tipo = parametros.tipo as string;
    const suelo = parametros.suelo as string;
    const resultadoCalc = resultado as Record<string, unknown>;

    // Validación 1: Tipo de suelo vs método
    if (suelo === 'roca_dura' && tipo !== 'excavacion') {
      alertas.push({
        id: `val-${Date.now()}-8`,
        tipo: 'alta',
        categoria: 'tecnica',
        mensaje: 'Método inadecuado para roca dura',
        descripcion: 'Roca dura requiere excavación especializada',
        origen: 'validacion_movimiento_tierra',
        sugerencia_correccion: 'Considerar usar equipos especiales para roca dura',
        contexto: { tipo, suelo },
        fecha_deteccion: new Date().toISOString(),
        estado: 'pendiente',
      });
    }

    // Validación 2: Costo vs tipo de suelo
    if (resultadoCalc.costo_final_m3) {
      const costo = resultadoCalc.costo_final_m3 as number;
      if (suelo === 'relleno' && costo > 100) {
        alertas.push({
          id: `val-${Date.now()}-9`,
          tipo: 'media',
          categoria: 'logica',
          mensaje: 'Costo elevado para material de relleno',
          descripcion: `Costo ${costo} Q/m³ parece alto para relleno`,
          origen: 'validacion_movimiento_tierra',
          sugerencia_correccion: 'Verificar precios de materiales de relleno',
          contexto: { tipo, suelo, costo },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }
    }

    return alertas;
  }

  private async validarCalculoGenerico(parametros: Record<string, unknown>, resultado: Record<string, unknown>): Promise<AlertaInconsistencia[]> {
    const alertas: AlertaInconsistencia[] = [];

    // Validación 1: Valores negativos en costos
    for (const [key, value] of Object.entries(resultado)) {
      if (typeof value === 'number' && key.includes('costo') && value < 0) {
        alertas.push({
          id: `val-${Date.now()}-12`,
          tipo: 'critica',
          categoria: 'logica',
          mensaje: 'Costo negativo detectado',
          descripcion: `El campo ${key} tiene valor negativo: ${value}`,
          origen: 'validacion_generica',
          sugerencia_correccion: 'Revisar cálculo para asegurar valores positivos',
          contexto: { campo: key, valor: value },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }
    }

    // Validación 2: Valores extremos
    for (const [key, value] of Object.entries(resultado)) {
      if (typeof value === 'number' && Math.abs(value) > 1000000) {
        alertas.push({
          id: `val-${Date.now()}-13`,
          tipo: 'media',
          categoria: 'logica',
          mensaje: 'Valor extremo detectado',
          descripcion: `El campo ${key} tiene valor extremo: ${value}`,
          origen: 'validacion_generica',
          sugerencia_correccion: 'Verificar si el valor es correcto o si hay error de unidad',
          contexto: { campo: key, valor: value },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }
    }

    return alertas;
  }

  private async validacionesCruzadas(calculo: Record<string, unknown>): Promise<AlertaInconsistencia[]> {
    const alertas: AlertaInconsistencia[] = [];

    try {
      // Validación cruzada: costo total vs suma de componentes
      if (calculo.resultado_calculado) {
        const resultado = calculo.resultado_calculado as Record<string, unknown>;
        const costoTotal = resultado.costo_total as number;
        
        if (resultado.materiales && resultado.mano_obra && resultado.equipos) {
          const materiales = resultado.materiales as number;
          const manoObra = resultado.mano_obra as number;
          const equipos = resultado.equipos as number;
          const sumaComponentes = materiales + manoObra + equipos;

          if (Math.abs(costoTotal - sumaComponentes) > costoTotal * 0.05) {
            alertas.push({
              id: `val-${Date.now()}-14`,
              tipo: 'alta',
              categoria: 'consistencia',
              mensaje: 'Inconsistencia entre costo total y suma de componentes',
              descripcion: `Costo total ${costoTotal} difiere significativamente de suma componentes ${sumaComponentes}`,
              origen: 'validacion_cruzada',
              sugerencia_correccion: 'Revisar desglose de componentes y costo total',
              contexto: { costoTotal, sumaComponentes, diferencia: costoTotal - sumaComponentes },
              fecha_deteccion: new Date().toISOString(),
              estado: 'pendiente',
            });
          }
        }
      }

      // Validación cruzada con cálculos anteriores del mismo proyecto
      if (calculo.proyecto_id) {
        const { data: calculosAnteriores } = await supabase
          .from('erp_calculos_proyecto')
          .select('*')
          .eq('proyecto_id', calculo.proyecto_id)
          .eq('tipo_calculo', calculo.tipo_calculo)
          .neq('id', calculo.id)
          .order('fecha_calculo', { ascending: false })
          .limit(1);

        if (calculosAnteriores && calculosAnteriores.length > 0) {
          const anterior = calculosAnteriores[0];
          const resultadoAnterior = anterior.resultado_calculado as Record<string, unknown>;
          const resultadoActual = calculo.resultado_calculado as Record<string, unknown>;

          if (resultadoAnterior.costo_total && resultadoActual.costo_total) {
            const costoAnterior = resultadoAnterior.costo_total as number;
            const costoActual = resultadoActual.costo_total as number;
            const variacion = Math.abs((costoActual - costoAnterior) / costoAnterior) * 100;

            if (variacion > 30) {
              alertas.push({
                id: `val-${Date.now()}-15`,
                tipo: 'media',
                categoria: 'consistencia',
                mensaje: 'Variación significativa respecto a cálculo anterior',
                descripcion: `Variación de ${variacion.toFixed(1)}% respecto a cálculo anterior`,
                origen: 'validacion_cruzada',
                sugerencia_correccion: 'Verificar si los parámetros de entrada son correctos',
                contexto: { costoAnterior, costoActual, variacion },
                fecha_deteccion: new Date().toISOString(),
                estado: 'pendiente',
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error en validaciones cruzadas:', error);
    }

    return alertas;
  }

  private calcularScoreConsistencia(alertas: AlertaInconsistencia[]): number {
    if (alertas.length === 0) return 100;

    let penalizaciones = 0;
    alertas.forEach(alerta => {
      switch (alerta.tipo) {
        case 'critica':
          penalizaciones += 25;
          break;
        case 'alta':
          penalizaciones += 15;
          break;
        case 'media':
          penalizaciones += 8;
          break;
        case 'baja':
          penalizaciones += 3;
          break;
      }
    });

    return Math.max(0, 100 - penalizaciones);
  }

  private generarRecomendaciones(alertas: AlertaInconsistencia[]): string[] {
    const recomendaciones: string[] = [];

    if (alertas.some(a => a.tipo === 'critica')) {
      recomendaciones.push('Se detectaron inconsistencias críticas que deben corregirse antes de proceder');
    }

    if (alertas.some(a => a.categoria === 'normativa')) {
      recomendaciones.push('Verificar cumplimiento de normativas técnicas vigentes');
    }

    if (alertas.some(a => a.categoria === 'consistencia')) {
      recomendaciones.push('Revisar parámetros de entrada para asegurar consistencia con cálculos anteriores');
    }

    if (alertas.some(a => a.categoria === 'tecnica')) {
      recomendaciones.push('Consultar con especialista técnico para validar parámetros fuera de rango');
    }

    if (alertas.length === 0) {
      recomendaciones.push('Cálculo validado exitosamente sin inconsistencias detectadas');
    }

    return recomendaciones;
  }

  private async guardarAlertasCalculo(calculoId: string, alertas: AlertaInconsistencia[]): Promise<void> {
    if (alertas.length === 0) return;

    try {
      const { error } = await supabase
        .from('erp_calculos_proyecto')
        .update({
          alertas_generadas: alertas,
          consistencia_check: {
            validado: true,
            fecha_validacion: new Date().toISOString(),
            total_alertas: alertas.length,
            alertas_por_tipo: {
              critica: alertas.filter(a => a.tipo === 'critica').length,
              alta: alertas.filter(a => a.tipo === 'alta').length,
              media: alertas.filter(a => a.tipo === 'media').length,
              baja: alertas.filter(a => a.tipo === 'baja').length,
            },
          },
        })
        .eq('id', calculoId);

      if (error) {
        safeLogger.warn('[validacionCalculos] Error guardando alertas, encolando mutación:', error);
        useErpStore.getState().enqueueMutation('guardarAlertasCalculo', { calculoId, alertas });
      }
    } catch (error) {
      safeLogger.warn('[validacionCalculos] Error guardando alertas, encolando mutación:', error);
      useErpStore.getState().enqueueMutation('guardarAlertasCalculo', { calculoId, alertas });
    }
  }

  async obtenerCalculosPorValidar(limite: number = 20): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('erp_calculos_proyecto')
        .select('id')
        .eq('validado', false)
        .order('fecha_calculo', { ascending: false })
        .limit(limite);

      if (error) throw error;
      return data?.map(c => c.id) || [];
    } catch (error) {
      console.error('Error obteniendo cálculos por validar:', error);
      return [];
    }
  }

  async validarPavimento(parametros: Record<string, unknown>, resultado: Record<string, unknown>): Promise<AlertaInconsistencia[]> {
    const alertas: AlertaInconsistencia[] = [];
    
    const uso = parametros.uso as string;
    const tipo = parametros.tipo as string;
    const resultadoCalc = resultado as Record<string, unknown>;

    if (!uso) {
      alertas.push({
        id: `val-${Date.now()}-23`,
        tipo: 'alta',
        categoria: 'tecnica',
        mensaje: 'Uso del pavimento no especificado',
        descripcion: 'Debe especificar el uso del pavimento (peatonal, vehicular, etc.)',
        origen: 'validacion_pavimento',
        contexto: { uso },
        fecha_deteccion: new Date().toISOString(),
        estado: 'pendiente',
      });
    }

    if (!tipo) {
      alertas.push({
        id: `val-${Date.now()}-24`,
        tipo: 'alta',
        categoria: 'tecnica',
        mensaje: 'Tipo de pavimento no especificado',
        descripcion: 'Debe especificar el tipo de pavimento (concreto, asfalto, adoquinado, etc.)',
        origen: 'validacion_pavimento',
        contexto: { tipo },
        fecha_deteccion: new Date().toISOString(),
        estado: 'pendiente',
      });
    }

    if (resultadoCalc.costo_final_m2) {
      const costo = resultadoCalc.costo_final_m2 as number;
      if (costo < 100 || costo > 800) {
        alertas.push({
          id: `val-${Date.now()}-25`,
          tipo: 'media',
          categoria: 'logica',
          mensaje: 'Costo por m² fuera de rango típico',
          descripcion: `Costo ${costo} Q/m² fuera de rango típico (100-800 Q/m²)`,
          origen: 'validacion_pavimento',
          contexto: { tipo, uso, costo },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }
    }

    return alertas;
  }

  async validarRedInfraestructura(parametros: Record<string, unknown>, resultado: Record<string, unknown>): Promise<any[]> {
    const alertas: AlertaInconsistencia[] = [];
    
    const tipo = parametros.tipo as string;
    const diametro = parametros.diametro as string;
    const resultadoCalc = resultado as Record<string, unknown>;

    if (!tipo) {
      alertas.push({
        id: `val-${Date.now()}-16`,
        tipo: 'alta',
        categoria: 'tecnica',
        mensaje: 'Tipo de red no especificado',
        descripcion: 'Debe especificar el tipo de red (agua potable, alcantarillado, etc.)',
        origen: 'validacion_redes',
        contexto: { tipo },
        fecha_deteccion: new Date().toISOString(),
        estado: 'pendiente',
      });
    }

    if (!diametro) {
      alertas.push({
        id: `val-${Date.now()}-17`,
        tipo: 'alta',
        categoria: 'tecnica',
        mensaje: 'Diámetro no especificado',
        descripcion: 'Debe especificar el diámetro de la tubería',
        origen: 'validacion_redes',
        contexto: { diametro },
        fecha_deteccion: new Date().toISOString(),
        estado: 'pendiente',
      });
    }

    if (resultadoCalc.costo_final_ml) {
      const costo = resultadoCalc.costo_final_ml as number;
      if (costo < 10 || costo > 500) {
        alertas.push({
          id: `val-${Date.now()}-18`,
          tipo: 'media',
          categoria: 'logica',
          mensaje: 'Costo por metro lineal fuera de rango típico',
          descripcion: `Costo ${costo} Q/ml fuera de rango típico (10-500 Q/ml)`,
          origen: 'validacion_redes',
          contexto: { tipo, costo },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }
    }

    return alertas;
  }

  async validarMuroContencion(parametros: Record<string, unknown>, resultado: Record<string, unknown>): Promise<any[]> {
    const alertas: AlertaInconsistencia[] = [];
    
    const altura = parametros.altura as number;
    const tipo = parametros.tipo as string;
    const resultadoCalc = resultado as Record<string, unknown>;

    if (!altura) {
      alertas.push({
        id: `val-${Date.now()}-19`,
        tipo: 'alta',
        categoria: 'tecnica',
        mensaje: 'Altura del muro no especificada',
        descripcion: 'Debe especificar la altura del muro de contención',
        origen: 'validacion_muros',
        contexto: { altura },
        fecha_deteccion: new Date().toISOString(),
        estado: 'pendiente',
      });
    }

    if (altura && altura > 0 && altura < 0.5) {
      alertas.push({
        id: `val-${Date.now()}-20`,
        tipo: 'media',
        categoria: 'tecnica',
        mensaje: 'Altura de muro muy baja',
        descripcion: `Altura ${altura}m parece baja para un muro de contención`,
        origen: 'validacion_muros',
        contexto: { altura, tipo },
        fecha_deteccion: new Date().toISOString(),
        estado: 'pendiente',
      });
    }

    if (altura && altura > 10) {
      alertas.push({
        id: `val-${Date.now()}-21`,
        tipo: 'alta',
        categoria: 'normativa',
        mensaje: 'Altura de muro muy alta - requiere diseño especializado',
        descripcion: `Altura ${altura}m requiere ingeniero especializado y diseño específico`,
        origen: 'validacion_muros',
        contexto: { altura, tipo },
        fecha_deteccion: new Date().toISOString(),
        estado: 'pendiente',
      });
    }

    if (resultadoCalc.costo_final_m2) {
      const costo = resultadoCalc.costo_final_m2 as number;
      if (costo < 500 || costo > 3000) {
        alertas.push({
          id: `val-${Date.now()}-22`,
          tipo: 'media',
          categoria: 'logica',
          mensaje: 'Costo por m² fuera de rango típico',
          descripcion: `Costo ${costo} Q/m² fuera de rango típico (500-3000 Q/m²)`,
          origen: 'validacion_muros',
          contexto: { tipo, costo },
          fecha_deteccion: new Date().toISOString(),
          estado: 'pendiente',
        });
      }
    }

    return alertas;
  }

  async marcarAlertaRevisada(alertaId: string, estado: 'revisada' | 'corregida' | 'ignorada', notas?: string): Promise<void> {
    // Esto requeriría una tabla de alertas separada para un seguimiento detallado
    // Por ahora, actualizamos el estado en el cálculo
  
  }
}

export const validacionCalculos = new ValidacionCalculos();

export const ServicioValidacionCalculos = validacionCalculos;

export function mostrarValidaciones(alertas: any[]): boolean {
  if (!alertas || alertas.length === 0) return true;
  
  const criticas = alertas.filter((a: any) => a.tipo === 'critica');
  if (criticas.length > 0) {
    console.error('Validaciones críticas:', criticas);
    return false;
  }
  
  const altas = alertas.filter((a: any) => a.tipo === 'alta');
  if (altas.length > 0) {
    console.warn('Validaciones altas:', altas);
  }
  
  return true;
}