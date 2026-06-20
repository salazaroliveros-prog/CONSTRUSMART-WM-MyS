import { supabase } from '@/lib/supabase';
import { Estacionalidad } from '@/erp/types';

export class ServicioEstacionalidad {
  static async obtenerFactorEstacional(
    departamentoCodigo: string,
    mes: number
  ): Promise<Estacionalidad | null> {
    try {
      const { data, error } = await supabase.rpc('obtener_factor_estacional', {
        p_departamento_codigo: departamentoCodigo,
        p_mes: mes
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error al obtener factor estacional:', error);
      throw error;
    }
  }

  static async aplicarAjusteEstacional(
    departamentoCodigo: string,
    fechaInicio: string,
    diasDuracion: number,
    costoBase: number
  ): Promise<{
    costoBase: number;
    factorEstacionalPromedio: number;
    costoAjustado: number;
    diferenciaCosto: number;
    porcentajeAjuste: number;
    condicionesEspeciales: string[];
  }> {
    try {
      const { data, error } = await supabase.rpc('aplicar_ajuste_estacional', {
        p_departamento_codigo: departamentoCodigo,
        p_fecha_inicio: fechaInicio,
        p_dias_duracion: diasDuracion,
        p_costo_base: costoBase
      });

      if (error) throw error;
      return data?.[0] || {
        costoBase: costoBase,
        factorEstacionalPromedio: 1.0,
        costoAjustado: costoBase,
        diferenciaCosto: 0,
        porcentajeAjuste: 0,
        condicionesEspeciales: []
      };
    } catch (error) {
      console.error('Error al aplicar ajuste estacional:', error);
      throw error;
    }
  }

  static async listarEstacionalidad(filtro?: { departamentoCodigo?: string; mes?: number }) {
    try {
      let query = supabase
        .from('erp_estacionalidad')
        .select('*')
        .eq('activo', true);

      if (filtro?.departamentoCodigo) {
        query = query.eq('departamento_codigo', filtro.departamentoCodigo);
      }

      if (filtro?.mes !== undefined) {
        query = query.eq('mes', filtro.mes);
      }

      const { data, error } = await query.order('departamento_codigo', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al listar estacionalidad:', error);
      throw error;
    }
  }

  static async obtenerDepartamentosConEstacionalidad() {
    try {
      const { data, error } = await supabase
        .from('erp_estacionalidad')
        .select('departamento_codigo')
        .eq('activo', true);

      if (error) throw error;
      const departamentos = [...new Set(data?.map(d => d.departamento_codigo))];
      return departamentos;
    } catch (error) {
      console.error('Error al obtener departamentos con estacionalidad:', error);
      throw error;
    }
  }

  static async obtenerMejorMesParaDepartamento(departamentoCodigo: string) {
    try {
      const { data, error } = await supabase
        .from('erp_estacionalidad')
        .select('*')
        .eq('departamento_codigo', departamentoCodigo)
        .eq('activo', true);

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const mejorMes = data.reduce((best, actual) => {
        const productividadBest = best.factor_disponibilidad * best.factor_productividad;
        const productividadActual = actual.factor_disponibilidad * actual.factor_productividad;
        return productividadActual > productividadBest ? actual : best;
      });

      return {
        mes: mejorMes.mes,
        nombreMes: new Date(0, mejorMes.mes - 1).toLocaleString('es-ES', { month: 'long' }),
        factorDisponibilidad: mejorMes.factor_disponibilidad,
        factorProductividad: mejorMes.factor_productividad,
        condiciones: mejorMes.condiciones_especiales
      };
    } catch (error) {
      console.error('Error al obtener mejor mes:', error);
      throw error;
    }
  }
}

export const obtenerFactorEstacional = ServicioEstacionalidad.obtenerFactorEstacional;
export const aplicarAjusteEstacional = ServicioEstacionalidad.aplicarAjusteEstacional;
export const listarEstacionalidad = ServicioEstacionalidad.listarEstacionalidad;
export const obtenerDepartamentosConEstacionalidad = ServicioEstacionalidad.obtenerDepartamentosConEstacionalidad;
export const obtenerMejorMesParaDepartamento = ServicioEstacionalidad.obtenerMejorMesParaDepartamento;