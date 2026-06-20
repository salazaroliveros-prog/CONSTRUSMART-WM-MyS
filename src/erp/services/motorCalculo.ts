import { supabase } from '@/lib/supabase';
import { DosificacionConcreto, ResultadoDosificacion, DepartamentoGT, MunicipioGT, Subtipologia } from '@/erp/types';

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
      console.error('Error al obtener dosificaciones:', error);
      throw error;
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
      // Obtener dosificación base
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

      if (error || !dosificacionBase) {
        throw new Error('No se encontró la dosificación especificada');
      }

      // Calcular factores de ajuste
      const factorAltitud = this.calcularFactorAltitud(altitud || 1500);
      const factorTemperatura = await this.calcularFactorTemperatura(departamento);
      const factorCurado = this.calcularFactorCurado(dosificacion.curado);
      const factorAjuste = factorAltitud * factorTemperatura * factorCurado;

      // Calcular cantidades ajustadas
      const cementoSacos = dosificacionBase.cemento_sacos_m3 * volumen * factorAltitud * factorCurado;
      const arenaM3 = dosificacionBase.arena_m3_m3 * volumen * factorAltitud;
      const piedraM3 = dosificacionBase.piedra_m3_m3 * volumen * factorAltitud;
      const aguaLt = dosificacionBase.agua_lt_m3 * volumen * factorTemperatura;

      // Calcular desglose de costos
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
      console.error('Error al calcular dosificación:', error);
      throw error;
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
  private static async calcularFactorTemperatura(departamento?: string): Promise<number> {
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
  static async obtenerDepartamentos(): Promise<DepartamentoGT[]> {
    try {
      const { data, error } = await supabase
        .from('erp_departamentos_gt')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener departamentos:', error);
      throw error;
    }
  }

  /**
   * Obtener municipios por departamento
   */
  static async obtenerMunicipiosPorDepartamento(departamentoCodigo: string): Promise<MunicipioGT[]> {
    try {
      const { data, error } = await supabase
        .from('erp_municipios_gt')
        .select('*')
        .eq('departamento_codigo', departamentoCodigo)
        .order('nombre');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener municipios:', error);
      throw error;
    }
  }

  /**
   * Obtener municipio por código
   */
  static async obtenerMunicipio(codigo: string): Promise<MunicipioGT | null> {
    try {
      const { data, error } = await supabase
        .from('erp_municipios_gt')
        .select('*')
        .eq('codigo', codigo)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error al obtener municipio:', error);
      throw error;
    }
  }

  /**
   * Obtener departamento por código
   */
  static async obtenerDepartamento(codigo: string): Promise<DepartamentoGT | null> {
    try {
      const { data, error } = await supabase
        .from('erp_departamentos_gt')
        .select('*')
        .eq('codigo', codigo)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error al obtener departamento:', error);
      throw error;
    }
  }

  /**
   * Obtener factor de costo para un municipio específico
   */
  static async obtenerFactorCostoMunicipio(codigoMunicipio: string): Promise<number> {
    try {
      const municipio = await this.obtenerMunicipio(codigoMunicipio);
      return municipio?.factor_costo || 1.0;
    } catch (error) {
      console.error('Error al obtener factor costo municipio:', error);
      return 1.0;
    }
  }

  /**
   * Obtener factor de rendimiento para un municipio específico
   */
  static async obtenerFactorRendimientoMunicipio(codigoMunicipio: string): Promise<number> {
    try {
      const municipio = await this.obtenerMunicipio(codigoMunicipio);
      return municipio?.factor_rendimiento || 1.0;
    } catch (error) {
      console.error('Error al obtener factor rendimiento municipio:', error);
      return 1.0;
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
      console.error('Error al obtener subtipologías:', error);
      throw error;
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
      console.error('Error al obtener subtipología:', error);
      throw error;
    }
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
