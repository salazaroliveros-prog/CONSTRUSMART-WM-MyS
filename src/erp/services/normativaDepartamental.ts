import { supabase } from '@/lib/supabase';
import { NormativaDepartamental } from '@/erp/types';

export class ServicioNormativaDepartamental {
  static async obtenerNormativaPorDepartamento(
    departamentoCodigo: string,
    tipoNorma?: string
  ): Promise<NormativaDepartamental[]> {
    try {
      const { data, error } = await supabase.rpc('obtener_normativa_departamental', {
        p_departamento_codigo: departamentoCodigo,
        p_tipo_norma: tipoNorma || null
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener normativa departamental:', error);
      throw error;
    }
  }

  static async validarCumplimiento(
    departamentoCodigo: string,
    tipoNorma: string,
    parametros: Record<string, any>
  ): Promise<{
    cumpleNorma: boolean;
    normativaAplicable: string;
    observaciones: string[];
    requisitosFaltantes: string[];
  }> {
    try {
      const { data, error } = await supabase.rpc('validar_cumplimiento_normativo', {
        p_departamento_codigo: departamentoCodigo,
        p_tipo_norma: tipoNorma,
        p_parametros_calculo: parametros
      });

      if (error) throw error;
      return data?.[0] || {
        cumpleNorma: true,
        normativaAplicable: 'Sin normativa aplicable',
        observaciones: [],
        requisitosFaltantes: []
      };
    } catch (error) {
      console.error('Error al validar cumplimiento normativo:', error);
      throw error;
    }
  }

  static async listarNormativas(filtro?: { departamentoCodigo?: string; tipoNorma?: string }) {
    try {
      let query = supabase
        .from('erp_normativa_departamental')
        .select('*')
        .eq('activo', true);

      if (filtro?.departamentoCodigo) {
        query = query.eq('departamento_codigo', filtro.departamentoCodigo);
      }

      if (filtro?.tipoNorma) {
        query = query.eq('tipo_norma', filtro.tipoNorma);
      }

      const { data, error } = await query.order('departamento_codigo', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al listar normativas:', error);
      throw error;
    }
  }

  static async obtenerDepartamentosConNormativa() {
    try {
      const { data, error } = await supabase
        .from('erp_normativa_departamental')
        .select('departamento_codigo')
        .eq('activo', true);

      if (error) throw error;
      const departamentos = [...new Set(data?.map(d => d.departamento_codigo))];
      return departamentos;
    } catch (error) {
      console.error('Error al obtener departamentos con normativa:', error);
      throw error;
    }
  }
}

export const obtenerNormativaDepartamental = ServicioNormativaDepartamental.obtenerNormativaPorDepartamento;
export const validarCumplimientoNormativo = ServicioNormativaDepartamental.validarCumplimiento;
export const listarNormativas = ServicioNormativaDepartamental.listarNormativas;
export const obtenerDepartamentosConNormativa = ServicioNormativaDepartamental.obtenerDepartamentosConNormativa;