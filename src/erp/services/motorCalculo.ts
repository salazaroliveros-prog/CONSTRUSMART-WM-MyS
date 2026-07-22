import { supabase } from '@/lib/supabase';
import { safeLogger } from '@/lib/safeLogger';
import { useErpStore } from '@/erp/zustandStore';
import { DosificacionConcreto, ResultadoDosificacion, DepartamentoGT, MunicipioGT, Subtipologia, MovimientoTierra, ResultadoMovimientoTierra, ParametrosClimaticosExtendido, FactorClimatico, Pavimento, ResultadoPavimento, RedInfraestructura, ResultadoRedInfraestructura, MuroContencion, ResultadoMuroContencion, CalculoProyecto, ComparacionCalculos, ReglaFactor, ResultadoAplicacionReglas } from '@/erp/types';
import { motorReglasFactores } from './reglasFactores';

// Precios referenciales (Q)
const PRECIOS_REFERENCIALES = {
  cementoSaco: 92, // Q/saco
  arenaM3: 145, // Q/m³
  piedraM3: 195, // Q/m³
};

// ============================================================
// SERVICIO DE DOSIFICACIÓN DE CONCRETO
// ============================================================

export class ServicioMotorCalculo {
  /**
   * Obtener dosificaciones de concreto disponibles
   */
  static async obtenerDosificacionesConcreto(tipo?: string) {
    try {
      let query = supabase
        .from('erp_dosificaciones_concreto')
        .select('*')
        .eq('activo', true);

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query.order('resistencia', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener dosificaciones (offline):', error);
      return [];
    }
  }

  /**
   * Calcular dosificación de concreto para un volumen específico
   */
  static async calcularDosificacion(
    dosificacion: DosificacionConcreto,
    volumen: number,
    departamento?: string,
    altitud?: number
  ): Promise<ResultadoDosificacion> {
    try {
      const { data: dosificacionBase, error } = await supabase
        .from('erp_dosificaciones_concreto')
        .select('*')
        .eq('resistencia', dosificacion.resistencia)
        .eq('tipo', dosificacion.tipo)
        .eq('tamaño_agregado', dosificacion.tamañoAgregado)
        .eq('aditivos', dosificacion.aditivos)
        .eq('curado', dosificacion.curado)
        .eq('activo', true)
        .single();

      const factorAltitud = this.calcularFactorAltitud(altitud || 1500);
      const factorTemperatura = this.calcularFactorTemperaturaSync(departamento);
      const factorCurado = this.calcularFactorCurado(dosificacion.curado);
      const factorAjuste = factorAltitud * factorTemperatura * factorCurado;

      let cementoSacos: number, arenaM3: number, piedraM3: number, aguaLt: number;

      if (!error && dosificacionBase) {
        cementoSacos = dosificacionBase.cemento_sacos_m3 * volumen * factorAltitud * factorCurado;
        arenaM3 = dosificacionBase.arena_m3_m3 * volumen * factorAltitud;
        piedraM3 = dosificacionBase.piedra_m3_m3 * volumen * factorAltitud;
        aguaLt = dosificacionBase.agua_lt_m3 * volumen * factorTemperatura;
      } else {
        safeLogger.warn('[motorCalculo] Usando dosificación local (offline)');
        cementoSacos = (dosificacion.cementoSacosM3 || 8) * volumen * factorAltitud * factorCurado;
        arenaM3 = (dosificacion.arenaM3M3 || 0.5) * volumen * factorAltitud;
        piedraM3 = (dosificacion.piedraM3M3 || 0.7) * volumen * factorAltitud;
        aguaLt = (dosificacion.aguaLtM3 || 200) * volumen * factorTemperatura;
      }

      const costoCemento = cementoSacos * PRECIOS_REFERENCIALES.cementoSaco;
      const costoArena = arenaM3 * PRECIOS_REFERENCIALES.arenaM3;
      const costoPiedra = piedraM3 * PRECIOS_REFERENCIALES.piedraM3;
      const costoTotal = costoCemento + costoArena + costoPiedra;

      return {
        cementoSacos,
        arenaM3,
        piedraM3,
        aguaLt,
        factorAjuste,
        costoTotal,
        desgloseCostos: {
          cemento: costoCemento,
          arena: costoArena,
          piedra: costoPiedra,
        },
      };
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al calcular dosificación (offline):', error);
      return {
        cementoSacos: (dosificacion.cementoSacosM3 || 8) * volumen,
        arenaM3: (dosificacion.arenaM3M3 || 0.5) * volumen,
        piedraM3: (dosificacion.piedraM3M3 || 0.7) * volumen,
        aguaLt: (dosificacion.aguaLtM3 || 200) * volumen,
        factorAjuste: 1.0,
        costoTotal: volumen * 800,
        desgloseCostos: {
          cemento: volumen * 600,
          arena: volumen * 100,
          piedra: volumen * 100,
        },
      };
    }
  }

  /**
   * Calcular factor de ajuste por altitud
   */
  private static calcularFactorAltitud(altitud: number): number {
    if (altitud > 2000) return 1.05; // Altitud alta: más cemento
    if (altitud > 1000) return 1.0; // Altitud media: referencia
    return 0.98; // Altitud baja: menos cemento por calor
  }

  /**
   * Calcular factor de ajuste por temperatura según departamento
   */
  private static calcularFactorTemperaturaSync(departamento?: string): number {
    if (!departamento) return 1.0;

    const factoresTemperatura: Record<string, number> = {
      'GT-01': 1.0, // Guatemala
      'GT-02': 0.95, // Escuintla (calor)
      'GT-03': 0.95, // Izabal (calor)
      'GT-08': 1.4, // Quetzaltenango (frío)
      'GT-12': 1.5, // Huehuetenango (muy frío)
      'GT-15': 1.2, // Alta Verapaz (húmedo)
    };

    return factoresTemperatura[departamento] || 1.0;
  }

  /**
   * Calcular factor de ajuste por tipo de curado
   */
  private static calcularFactorCurado(curado: string): number {
    if (curado === 'acelerado') return 1.2;
    if (curado === 'prolongado') return 1.3;
    return 1.0;
  }

  // ============================================================
  // SERVICIO DE GEOGRAFÍA
  // ============================================================

  /**
   * Obtener todos los departamentos de Guatemala
   */
  static obtenerDepartamentos(): DepartamentoGT[] {
    return useErpStore.getState().departamentos || [];
  }

  /**
   * Obtener municipios por departamento
   */
  static obtenerMunicipiosPorDepartamento(departamentoCodigo: string): MunicipioGT[] {
    const municipios = useErpStore.getState().municipios || [];
    return municipios.filter(m => m.departamentoCodigo === departamentoCodigo);
  }

  /**
   * Obtener municipio por código
   */
  static obtenerMunicipio(codigo: string): MunicipioGT | null {
    const municipios = useErpStore.getState().municipios || [];
    return municipios.find(m => m.codigo === codigo) || null;
  }

  /**
   * Obtener departamento por código
   */
  static obtenerDepartamento(codigo: string): DepartamentoGT | null {
    const departamentos = useErpStore.getState().departamentos || [];
    return departamentos.find(d => d.codigo === codigo) || null;
  }

  /**
   * Obtener factor de costo para un municipio específico
   */
  static obtenerFactorCostoMunicipio(codigoMunicipio: string): number {
    const municipio = this.obtenerMunicipio(codigoMunicipio);
    return municipio?.altitudMsnm ? 1.0 + (municipio.altitudMsnm / 1000) * 0.1 : 1.0;
  }

  /**
   * Obtener factor de rendimiento para un municipio específico
   */
  static obtenerFactorRendimientoMunicipio(codigoMunicipio: string): number {
    const municipio = this.obtenerMunicipio(codigoMunicipio);
    return municipio?.altitudMsnm ? 1.0 - (municipio.altitudMsnm / 2000) * 0.15 : 1.0;
  }

  // ============================================================
  // SERVICIO DE PARÁMETROS CLIMÁTICOS
  // ============================================================

  static async obtenerParametrosClimaticos(departamentoCodigo: string): Promise<ParametrosClimaticosExtendido | null> {
    try {
      const { data, error } = await supabase.rpc('obtener_parametros_climaticos', {
        p_departamento_codigo: departamentoCodigo,
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return {
        departamentoCodigo,
        zonaClimatica: data[0].zona_climatica,
        altitudMinMsnm: data[0].altitud_min_msnm,
        altitudMaxMsnm: data[0].altitud_max_msnm,
        temperaturaMinC: data[0].temperatura_min_c,
        temperaturaMaxC: data[0].temperatura_max_c,
        humedadRelativaPromedioPct: data[0].humedad_relativa_promedio_pct,
        precipitacionPromedioMmMes: data[0].precipitacion_promedio_mm_mes,
        vientoPromedioKmh: data[0].viento_promedio_kmh,
        factorCuradoConcreto: data[0].factor_curado_concreto,
        factorRendimientoMO: data[0].factor_rendimiento_mo,
        factorProteccionEncofrados: data[0].factor_proteccion_encofrados,
        estacionCritica: data[0].estacion_critica,
        mesesCriticos: data[0].meses_criticos,
      };
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener parámetros climáticos (offline):', error);
      return null;
    }
  }

  static async obtenerFactorClimatico(departamentoCodigo: string, mes?: string): Promise<FactorClimatico> {
    try {
      const { data, error } = await supabase.rpc('obtener_factor_curado_climatico', {
        p_departamento_codigo: departamentoCodigo,
        p_mes: mes || null,
      });

      if (error) throw error;

      return {
        factorCurado: data[0].factor_curado,
        factorRendimiento: data[0].factor_rendimiento,
        factorProteccion: data[0].factor_proteccion,
        factorAjusteEstacional: data[0].factor_ajuste_estacional,
        observaciones: data[0].observaciones,
      };
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener factor climático (offline):', error);
      return {
        factorCurado: 1.0,
        factorRendimiento: 1.0,
        factorProteccion: 1.0,
        factorAjusteEstacional: 1.0,
        observaciones: 'Sin conexión — valores por defecto',
      };
    }
  }

  static async obtenerFactorTemperaturaDepartamento(departamentoCodigo: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('obtener_factor_temperatura_departamento', {
        p_departamento_codigo: departamentoCodigo,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener factor temperatura (offline):', error);
      return 1.0;
    }
  }

  static async obtenerFactorHumedadDepartamento(departamentoCodigo: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('obtener_factor_humedad_departamento', {
        p_departamento_codigo: departamentoCodigo,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener factor humedad (offline):', error);
      return 1.0;
    }
  }

  // ============================================================
  // SERVICIO DE MOVIMIENTO DE TIERRA
  // ============================================================

  static async calcularMovimientoTierra(mt: MovimientoTierra): Promise<ResultadoMovimientoTierra> {
    try {
      const { data, error } = await supabase.rpc('calcular_movimiento_tierra', {
        p_tipo: mt.tipo,
        p_suelo: mt.suelo,
        p_profundidad: mt.profundidad,
        p_acceso: mt.acceso,
        p_drenaje: mt.drenaje,
        p_volumen: mt.volumen,
      });

      if (error) throw error;

      return {
        costoUnitario: data[0].costo_unitario,
        costoTotal: data[0].costo_total,
        tiempoEstimadoDias: data[0].tiempo_estimado_dias,
        equipoRequerido: data[0].equipo_requerido,
        factorAjusteTotal: data[0].factor_ajuste_total,
      };
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al calcular movimiento de tierra (offline):', error);
      return {
        costoUnitario: 0,
        costoTotal: 0,
        tiempoEstimadoDias: 0,
        equipoRequerido: [],
        factorAjusteTotal: 1.0,
      };
    }
  }

  static async obtenerParametrosMovimientoTierra(suelo?: string) {
    try {
      let query = supabase
        .from('erp_parametros_movimiento_tierra')
        .select('*')
        .eq('activo', true);

      if (suelo) {
        query = query.eq('suelo', suelo);
      }

      const { data, error } = await query.order('tipo', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener parámetros de movimiento de tierra (offline):', error);
      return [];
    }
  }

  // ============================================================
  // SERVICIO DE SUBTIPOLOGÍAS
  // ============================================================

  /**
   * Obtener todas las subtipologías
   */
  static async obtenerSubtipologias(tipologia?: string): Promise<Subtipologia[]> {
    try {
      let query = supabase
        .from('erp_subtipologias')
        .select('*')
        .eq('activo', true);

      if (tipologia) {
        query = query.eq('tipologia', tipologia);
      }

      const { data, error } = await query.order('subtipo');

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener subtipologías (offline):', error);
      return [];
    }
  }

  /**
   * Obtener subtipología por subtipo
   */
  static async obtenerSubtipologia(tipologia: string, subtipo: string): Promise<Subtipologia | null> {
    try {
      const { data, error } = await supabase
        .from('erp_subtipologias')
        .select('*')
        .eq('tipologia', tipologia)
        .eq('subtipo', subtipo)
        .eq('activo', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener subtipología (offline):', error);
      return null;
    }
  }

  /**
   * Calcular pavimento
   */
  static async calcularPavimento(pavimento: Pavimento): Promise<ResultadoPavimento> {
    try {
      const { data, error } = await supabase.rpc('calcular_pavimento', {
        p_uso: pavimento.uso,
        p_tipo: pavimento.tipo,
        p_tipo_base: pavimento.tipoBase,
        p_tipo_sello: pavimento.tipoSello,
        p_area_m2: pavimento.areaM2
      });

      if (error) throw error;

      // Adaptar resultado al interfaz TypeScript
      return {
        espesorCm: data[0].espesor_cm,
        costoSuperficieM2: data[0].costo_superficie_m2,
        costoBaseM3: data[0].costo_base_m3,
        costoSelloM2: data[0].costo_sello_m2,
        costoTotalM2: data[0].costo_total_m2,
        costoTotal: data[0].costo_total,
        volumenBaseM3: data[0].volumen_base_m3,
        referenciaNorma: data[0].referencia_norma
      };
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al calcular pavimento (offline):', error);
      return {
        espesorCm: 15,
        costoSuperficieM2: 0,
        costoBaseM3: 0,
        costoSelloM2: 0,
        costoTotalM2: 0,
        costoTotal: 0,
        volumenBaseM3: 0,
        referenciaNorma: 'Sin conexión',
      };
    }
  }

  /**
   * Obtener parámetros de pavimentos
   */
  static async obtenerParametrosPavimentos(uso?: string, tipo?: string) {
    try {
      let query = supabase
        .from('erp_parametros_pavimentos')
        .select('*')
        .eq('activo', true);

      if (uso) {
        query = query.eq('uso', uso);
      }

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error } = await query.order('costo_base_m2', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener parámetros de pavimentos (offline):', error);
      return [];
    }
  }

  /**
   * Calcular red de infraestructura
   */
  static async calcularRedInfraestructura(red: RedInfraestructura): Promise<ResultadoRedInfraestructura> {
    try {
      const { data, error } = await supabase.rpc('calcular_red_infraestructura', {
        p_tipo: red.tipo,
        p_diametro_pulgadas: red.diametroPulgadas,
        p_material: red.material,
        p_presion: red.presion,
        p_longitud_ml: red.longitudMl
      });

      if (error) throw error;

      // Adaptar resultado al interfaz TypeScript
      return {
        costoUnitarioMl: data[0].costo_unitario_ml,
        costoTotal: data[0].costo_total,
        factorAjusteMaterial: data[0].factor_ajuste_material,
        referenciaNorma: data[0].referencia_norma
      };
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al calcular red de infraestructura (offline):', error);
      return {
        costoUnitarioMl: 0,
        costoTotal: 0,
        factorAjusteMaterial: 1.0,
        referenciaNorma: 'Sin conexión',
      };
    }
  }

  /**
   * Obtener parámetros de redes de infraestructura
   */
  static async obtenerParametrosRedesInfraestructura(tipo?: string, material?: string) {
    try {
      let query = supabase
        .from('erp_parametros_redes_infraestructura')
        .select('*')
        .eq('activo', true);

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      if (material) {
        query = query.eq('material', material);
      }

      const { data, error } = await query.order('costo_base_ml', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener parámetros de redes de infraestructura (offline):', error);
      return [];
    }
  }

  /**
   * Calcular muro de contención
   */
  static async calcularMuroContencion(muro: MuroContencion): Promise<ResultadoMuroContencion> {
    try {
      const { data, error } = await supabase.rpc('calcular_muro_contencion', {
        p_altura_m: muro.alturaM,
        p_tipo: muro.tipo,
        p_tipo_cimentacion: muro.tipoCimentacion,
        p_tipo_suelo: muro.tipoSuelo,
        p_tipo_drenaje: muro.tipoDrenaje,
        p_longitud_m: muro.longitudM
      });

      if (error) throw error;

      // Adaptar resultado al interfaz TypeScript
      return {
        costoUnitarioM2: data[0].costo_unitario_m2,
        costoTotal: data[0].costo_total,
        factorAjusteTotal: data[0].factor_ajuste_total,
        volumenConcretoM3: data[0].volumen_concreto_m3,
        referenciaNorma: data[0].referencia_norma
      };
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al calcular muro de contención (offline):', error);
      return {
        costoUnitarioM2: 0,
        costoTotal: 0,
        factorAjusteTotal: 1.0,
        volumenConcretoM3: 0,
        referenciaNorma: 'Sin conexión',
      };
    }
  }

  /**
   * Obtener parámetros de muros de contención
   */
  static async obtenerParametrosMurosContencion(tipo?: string, altura?: number) {
    try {
      let query = supabase
        .from('erp_parametros_muros_contencion')
        .select('*')
        .eq('activo', true);

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      if (altura) {
        query = query.gte('altura_m', altura);
      }

      const { data, error } = await query.order('altura_m', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener parámetros de muros de contención (offline):', error);
      return [];
    }
  }

  /**
   * Registrar cálculo en historial
   */
  static async registrarCalculo(
    proyectoId: string,
    tipoCalcululo: string,
    parametrosEntrada: Record<string, any>,
    resultadoCalculado: Record<string, any>,
    opciones?: {
      renglonId?: string;
      costoTotal?: number;
      costoUnitario?: number;
      usuarioId?: string;
      observaciones?: string;
    }
  ): Promise<string> {
    const payload = {
      proyecto_id: proyectoId,
      renglon_id: opciones?.renglonId,
      tipo_calculo: tipoCalcululo,
      parametros_entrada: parametrosEntrada,
      resultado_calculado: resultadoCalculado,
      costo_total: opciones?.costoTotal,
      costo_unitario: opciones?.costoUnitario,
      usuario_id: opciones?.usuarioId,
      observaciones: opciones?.observaciones,
    };
    useErpStore.getState().enqueueMutation('registrarCalculo', payload);
    return '';
  }

  /**
   * Crear snapshot de estado durante cálculo
   */
  static async crearSnapshotEstado(
    calculoId: string,
    tipoSnapshot: 'antes' | 'despues' | 'intermedio' | 'final',
    estadoCompleto: Record<string, any>,
    descripcion?: string
  ) {
    const payload = {
      calculo_id: calculoId,
      tipo_snapshot: tipoSnapshot,
      estado_completo: estadoCompleto,
      descripcion: descripcion,
    };
    useErpStore.getState().enqueueMutation('crearSnapshotEstado', payload);
    return null;
  }

  /**
   * Obtener snapshots de un cálculo
   */
  static async obtenerSnapshotsCalculo(calculoId: string) {
    try {
      const { data, error } = await supabase
        .from('erp_snapshots_estado_calculo')
        .select('*')
        .eq('calculo_id', calculoId)
        .order('timestamp_snapshot', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener snapshots (offline):', error);
      return [];
    }
  }

  /**
   * Obtener comparaciones de un cálculo
   */
  static async obtenerComparacionesCalculo(calculoId: string) {
    try {
      const { data, error } = await supabase
        .from('erp_comparaciones_calculos')
        .select('*')
        .or(`calculo_base_id.eq.${calculoId},calculo_comparado_id.eq.${calculoId}`)
        .order('fecha_comparacion', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener comparaciones (offline):', error);
      return [];
    }
  }

  /**
   * Obtener historial de cálculos de un proyecto
   */
  static async obtenerHistorialCalculos(proyectoId: string, tipoCalculo?: string) {
    try {
      let query = supabase
        .from('erp_calculos_proyecto')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .order('created_at', { ascending: false });

      if (tipoCalculo) {
        query = query.eq('tipo_calculo', tipoCalculo);
      }

      const { data, error } = await query;

      if (error) {
        safeLogger.warn('[motorCalculo] Error consultando erp_calculos_proyecto:', error);
        return [];
      }
      return data ?? [];
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al obtener historial de cálculos (capturado):', error);
      return [];
    }
  }

  /**
   * Comparar dos cálculos
   */
  static async compararCalculos(calculoId1: string, calculoId2: string) {
    try {
      const { data, error } = await supabase.rpc('comparar_calculos', {
        p_calculo_id_1: calculoId1,
        p_calculo_id_2: calculoId2
      });

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[motorCalculo] Error al comparar cálculos (offline):', error);
      return null;
    }
  }

  /**
   * Validar cálculo
   */
  static async validarCalculo(calculoId: string, notasValidacion?: string, aprobado: boolean = true) {
    try {
      const { error } = await supabase
        .from('erp_calculos_proyecto')
        .update({
          validado: aprobado,
          notas_validacion: notasValidacion,
          fecha_validacion: new Date().toISOString()
        })
        .eq('id', calculoId);

      if (error) {
        safeLogger.warn('[motorCalculo] Error validando cálculo, encolando mutación:', error);
        useErpStore.getState().enqueueMutation('validarCalculo', { id: calculoId, validado: aprobado, notas_validacion: notasValidacion, fecha_validacion: new Date().toISOString() });
        return true;
      }
      return true;
    } catch (error) {
      safeLogger.error('[motorCalculo] Error al validar cálculo:', error);
      return false;
    }
  }

  // ============================================================
  // INTEGRACIÓN CON MOTOR DE REGLAS DE FACTORES
  // ============================================================

  /**
   * Aplicar reglas de factores a un valor de costo
   */
  static async aplicarReglasFactores(
    valor: number,
    tipoFactor: ReglaFactor['tipo_factor'],
    contexto: Record<string, any> = {}
  ): Promise<ResultadoAplicacionReglas> {
    try {
      return await motorReglasFactores.aplicarReglasViaRPC(valor, tipoFactor, contexto);
    } catch (error) {
      safeLogger.error('Error aplicando reglas de factores:', error);
      // Fallback a cálculo local si RPC falla
      return await motorReglasFactores.aplicarReglas(valor, tipoFactor, contexto);
    }
  }

  /**
   * Calcular costo con aplicación de reglas jerárquicas
   */
  static async calcularCostoConReglas(
    costoBase: number,
    proyectoId: string,
    renglonId?: string
  ): Promise<{
    costoFinal: number;
    desgloseFactores: {
      zona: ResultadoAplicacionReglas;
      tipologia: ResultadoAplicacionReglas;
      sobrecosto: ResultadoAplicacionReglas;
      climatico: ResultadoAplicacionReglas;
    };
  }> {
    try {
      // Aplicar reglas en orden jerárquico
      const zonaFactor = await this.aplicarReglasFactores(costoBase, 'zona', {
        proyecto_id: proyectoId,
        renglon_id: renglonId,
      });

      const tipologiaFactor = await this.aplicarReglasFactores(zonaFactor.valor_final, 'tipologia', {
        proyecto_id: proyectoId,
        renglon_id: renglonId,
      });

      const climaticoFactor = await this.aplicarReglasFactores(tipologiaFactor.valor_final, 'climatico', {
        proyecto_id: proyectoId,
        renglon_id: renglonId,
      });

      const sobrecostoFactor = await this.aplicarReglasFactores(climaticoFactor.valor_final, 'sobrecosto', {
        proyecto_id: proyectoId,
        renglon_id: renglonId,
      });

      return {
        costoFinal: sobrecostoFactor.valor_final,
        desgloseFactores: {
          zona: zonaFactor,
          tipologia: tipologiaFactor,
          sobrecosto: sobrecostoFactor,
          climatico: climaticoFactor,
        },
      };
    } catch (error) {
      safeLogger.error('Error calculando costo con reglas:', error);
      return {
        costoFinal: costoBase,
        desgloseFactores: {
          zona: { valor_final: costoBase, reglas_aplicadas: [], factor_total: 1.0 },
          tipologia: { valor_final: costoBase, reglas_aplicadas: [], factor_total: 1.0 },
          sobrecosto: { valor_final: costoBase, reglas_aplicadas: [], factor_total: 1.0 },
          climatico: { valor_final: costoBase, reglas_aplicadas: [], factor_total: 1.0 },
        },
      };
    }
  }

  /**
   * Obtener reglas activas por tipo
   */
  static async obtenerReglasActivas(tipoFactor?: ReglaFactor['tipo_factor']) {
    return await motorReglasFactores.obtenerReglasActivas(tipoFactor);
  }

  /**
   * Crear nueva regla de factor
   */
  static async crearReglaFactor(regla: Partial<ReglaFactor>): Promise<ReglaFactor> {
    return await motorReglasFactores.crearRegla(regla);
  }

  /**
   * Actualizar regla de factor existente
   */
  static async actualizarReglaFactor(id: string, regla: Partial<ReglaFactor>): Promise<ReglaFactor> {
    return await motorReglasFactores.actualizarRegla(id, regla);
  }

  /**
   * Eliminar regla de factor
   */
  static async eliminarReglaFactor(id: string): Promise<void> {
    await motorReglasFactores.eliminarRegla(id);
  }

  /**
   * Obtener historial de aplicación de reglas
   */
  static async obtenerHistorialReglas(
    proyectoId?: string,
    renglonId?: string,
    reglaId?: string
  ) {
    return await motorReglasFactores.obtenerHistorial(proyectoId, renglonId, reglaId);
  }
}

// Exportar funciones de conveniencia
export const obtenerDosificacionesConcreto = ServicioMotorCalculo.obtenerDosificacionesConcreto;
export const calcularDosificacion = ServicioMotorCalculo.calcularDosificacion;
export const obtenerDepartamentos = ServicioMotorCalculo.obtenerDepartamentos;
export const obtenerMunicipiosPorDepartamento = ServicioMotorCalculo.obtenerMunicipiosPorDepartamento;
export const obtenerFactorCostoMunicipio = ServicioMotorCalculo.obtenerFactorCostoMunicipio;
export const obtenerFactorRendimientoMunicipio = ServicioMotorCalculo.obtenerFactorRendimientoMunicipio;
export const obtenerSubtipologias = ServicioMotorCalculo.obtenerSubtipologias;
export const obtenerSubtipologia = ServicioMotorCalculo.obtenerSubtipologia;
export const calcularMovimientoTierra = ServicioMotorCalculo.calcularMovimientoTierra;
export const obtenerParametrosMovimientoTierra = ServicioMotorCalculo.obtenerParametrosMovimientoTierra;
export const obtenerParametrosClimaticos = ServicioMotorCalculo.obtenerParametrosClimaticos;
export const obtenerFactorClimatico = ServicioMotorCalculo.obtenerFactorClimatico;
export const obtenerFactorTemperaturaDepartamento = ServicioMotorCalculo.obtenerFactorTemperaturaDepartamento;
export const obtenerFactorHumedadDepartamento = ServicioMotorCalculo.obtenerFactorHumedadDepartamento;
export const calcularPavimento = ServicioMotorCalculo.calcularPavimento;
export const obtenerParametrosPavimentos = ServicioMotorCalculo.obtenerParametrosPavimentos;
export const calcularRedInfraestructura = ServicioMotorCalculo.calcularRedInfraestructura;
export const obtenerParametrosRedesInfraestructura = ServicioMotorCalculo.obtenerParametrosRedesInfraestructura;
export const calcularMuroContencion = ServicioMotorCalculo.calcularMuroContencion;
export const obtenerParametrosMurosContencion = ServicioMotorCalculo.obtenerParametrosMurosContencion;
export const aplicarReglasFactores = ServicioMotorCalculo.aplicarReglasFactores;
export const calcularCostoConReglas = ServicioMotorCalculo.calcularCostoConReglas;
export const obtenerReglasActivas = ServicioMotorCalculo.obtenerReglasActivas;
export const crearReglaFactor = ServicioMotorCalculo.crearReglaFactor;
export const actualizarReglaFactor = ServicioMotorCalculo.actualizarReglaFactor;
export const eliminarReglaFactor = ServicioMotorCalculo.eliminarReglaFactor;
export const obtenerHistorialReglas = ServicioMotorCalculo.obtenerHistorialReglas;
export const registrarCalculo = ServicioMotorCalculo.registrarCalculo;
export const obtenerHistorialCalculos = ServicioMotorCalculo.obtenerHistorialCalculos;
export const compararCalculos = ServicioMotorCalculo.compararCalculos;
export const validarCalculo = ServicioMotorCalculo.validarCalculo;
export const crearSnapshotEstado = ServicioMotorCalculo.crearSnapshotEstado;
export const obtenerSnapshotsCalculo = ServicioMotorCalculo.obtenerSnapshotsCalculo;
export const obtenerComparacionesCalculo = ServicioMotorCalculo.obtenerComparacionesCalculo;
