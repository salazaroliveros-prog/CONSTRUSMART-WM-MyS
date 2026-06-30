import { supabase } from '@/lib/supabase';
import { safeLogger } from '@/lib/safeLogger';
import { logErrorFromException } from '@/lib/error-logger';
import { useErpStore } from '@/erp/zustandStore';
import { Estacionalidad } from '@/erp/types';
import { estacionalidadSchema } from '@/erp/store/schemas/calculos';
import { safeParseArray } from '@/erp/utils';

export const safeParseEstacionalidadArray = (value: unknown): Estacionalidad[] =>
  safeParseArray(value, estacionalidadSchema) as Estacionalidad[];

export const parseEstacionalidad = (value: unknown): Estacionalidad | null => {
  const parsed = estacionalidadSchema.safeParse(value);
  return parsed.success ? (parsed.data as Estacionalidad) : null;
};

export interface AjusteEstacionalActividad {
  id?: string;
  estacionalidad_id: string;
  tipo_actividad: string;
  factor_especifico: number;
  impacto_duracion?: number;
  recomendaciones?: string[];
  medidas_mitigacion?: string[];
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FactoresEstacionales {
  id: string;
  departamento_codigo: string;
  mes: number;
  temporada: string;
  factor_disponibilidad: number;
  factor_costo: number;
  factor_productividad: number;
  factor_especifico: number;
  condiciones_climaticas: string;
  restricciones_especiales: string[];
  riesgos_estacionales: string[];
}

export interface ResultadoAplicacionEstacional {
  costo_ajustado: number;
  factor_disponibilidad: number;
  factor_costo: number;
  factor_productividad: number;
  factor_especifico: number;
  factor_total: number;
  diferencia_costo: number;
  porcentaje_ajuste: number;
  temporada: string;
  condiciones_climaticas: string;
}

export class Estacionalidad {
  async obtenerFactoresEstacionales(
    departamentoCodigo: string,
    mes: number,
    tipoActividad?: string
  ): Promise<FactoresEstacionales | null> {
    try {
      const { data, error } = await supabase.rpc('obtener_factores_estacionales', {
        p_departamento_codigo: departamentoCodigo,
        p_mes: mes,
        p_tipo_actividad: tipoActividad || null
      });

      if (error) throw error;
      const rows = safeParseEstacionalidadArray(data);
      return rows[0] ?? null;
    } catch (error) {
      safeLogger.warn('Error obteniendo factores estacionales (offline esperado):', error);
      return null;
    }
  }

  async obtenerEstacionalidadDepartamento(
    departamentoCodigo: string,
    mes?: number
  ): Promise<Estacionalidad[]> {
    try {
      let query = supabase
        .from('erp_estacionalidad')
        .select('*')
        .eq('departamento_codigo', departamentoCodigo)
        .eq('activo', true)
        .order('mes');

      if (mes) {
        query = query.eq('mes', mes);
      }

      const { data, error } = await query;
      if (error) throw error;
      return safeParseEstacionalidadArray(data);
    } catch (error) {
      safeLogger.warn('Error obteniendo estacionalidad del departamento (offline esperado):', error);
      return [];
    }
  }

  async aplicarFactoresEstacionales(
    costoBase: number,
    departamentoCodigo: string,
    mes: number,
    tipoActividad?: string
  ): Promise<ResultadoAplicacionEstacional> {
    try {
      const { data, error } = await supabase.rpc('aplicar_factores_estacionales', {
        p_costo_base: costoBase,
        p_departamento_codigo: departamentoCodigo,
        p_mes: mes,
        p_tipo_actividad: tipoActividad || null
      });

      if (error) throw error;
      return data?.[0] || {
        costo_ajustado: costoBase,
        factor_disponibilidad: 1.0,
        factor_costo: 1.0,
        factor_productividad: 1.0,
        factor_especifico: 1.0,
        factor_total: 1.0,
        diferencia_costo: 0,
        porcentaje_ajuste: 0,
        temporada: 'seca',
        condiciones_climaticas: 'Condiciones normales'
      };
    } catch (error) {
      safeLogger.warn('Error aplicando factores estacionales (offline esperado):', error);
      return {
        costo_ajustado: costoBase,
        factor_disponibilidad: 1.0,
        factor_costo: 1.0,
        factor_productividad: 1.0,
        factor_especifico: 1.0,
        factor_total: 1.0,
        diferencia_costo: 0,
        porcentaje_ajuste: 0,
        temporada: 'seca',
        condiciones_climaticas: 'Condiciones normales'
      };
    }
  }

  async obtenerAjustesEstacionales(estacionalidadId: string): Promise<AjusteEstacionalActividad[]> {
    try {
      const { data, error } = await supabase
        .from('erp_ajustes_estacionales_actividad')
        .select('*')
        .eq('estacionalidad_id', estacionalidadId)
        .eq('activo', true)
        .order('tipo_actividad');

      if (error) throw error;
      return safeParseEstacionalidadArray(data);
    } catch (error) {
      safeLogger.warn('Error obteniendo ajustes estacionales (offline esperado):', error);
      return [];
    }
  }

  async obtenerEstacionalidadPorTemporada(
    temporada: 'seca' | 'lluviosa' | 'transicion_seca' | 'transicion_lluviosa',
    departamentoCodigo?: string
  ): Promise<Estacionalidad[]> {
    try {
      let query = supabase
        .from('erp_estacionalidad')
        .select('*')
        .eq('temporada', temporada)
        .eq('activo', true)
        .order('departamento_codigo', 'mes');

      if (departamentoCodigo) {
        query = query.eq('departamento_codigo', departamentoCodigo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return safeParseEstacionalidadArray(data);
    } catch (error) {
      safeLogger.warn('Error obteniendo estacionalidad por temporada (offline esperado):', error);
      return [];
    }
  }

  async crearEstacionalidad(estacionalidad: Partial<Estacionalidad>): Promise<Estacionalidad> {
    try {
      const { data, error } = await supabase
        .from('erp_estacionalidad')
        .insert(estacionalidad)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[estacionalidad] Error creando estacionalidad, encolando mutación:', error);
      useErpStore.getState().enqueueMutation('addEstacionalidad', estacionalidad);
      return { ...estacionalidad, id: crypto.randomUUID?.() || Date.now().toString() } as Estacionalidad;
    }
  }

  async actualizarEstacionalidad(id: string, estacionalidad: Partial<Estacionalidad>): Promise<Estacionalidad> {
    try {
      const { data, error } = await supabase
        .from('erp_estacionalidad')
        .update(estacionalidad)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[estacionalidad] Error actualizando estacionalidad, encolando mutación:', error);
      useErpStore.getState().enqueueMutation('updateEstacionalidad', { id, ...estacionalidad });
      return { id, ...estacionalidad } as Estacionalidad;
    }
  }

  async eliminarEstacionalidad(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('erp_estacionalidad')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      safeLogger.warn('[estacionalidad] Error eliminando estacionalidad, encolando mutación:', error);
      useErpStore.getState().enqueueMutation('deleteEstacionalidad', { id });
      return;
    }
  }

   async obtenerEstacionalidadPorId(id: string): Promise<Estacionalidad | null> {
    try {
      const { data, error } = await supabase
        .from('erp_estacionalidad')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return parseEstacionalidad(data);
    } catch (error) {
      safeLogger.error('Error obteniendo estacionalidad por ID:', error);
      return null;
    }
  }

  async crearAjusteEstacional(ajuste: Partial<AjusteEstacionalActividad>): Promise<AjusteEstacionalActividad> {
    try {
      const { data, error } = await supabase
        .from('erp_ajustes_estacionales_actividad')
        .insert(ajuste)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[estacionalidad] Error creando ajuste estacional, encolando mutación:', error);
      useErpStore.getState().enqueueMutation('addAjusteEstacionalActividad', ajuste);
      return { ...ajuste, id: crypto.randomUUID?.() || Date.now().toString() } as AjusteEstacionalActividad;
    }
  }

  async actualizarAjusteEstacional(id: string, ajuste: Partial<AjusteEstacionalActividad>): Promise<AjusteEstacionalActividad> {
    try {
      const { data, error } = await supabase
        .from('erp_ajustes_estacionales_actividad')
        .update(ajuste)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[estacionalidad] Error actualizando ajuste estacional, encolando mutación:', error);
      useErpStore.getState().enqueueMutation('updateAjusteEstacionalActividad', { id, ...ajuste });
      return { id, ...ajuste } as AjusteEstacionalActividad;
    }
  }

  async eliminarAjusteEstacional(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('erp_ajustes_estacionales_actividad')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      safeLogger.warn('[estacionalidad] Error eliminando ajuste estacional, encolando mutación:', error);
      useErpStore.getState().enqueueMutation('deleteAjusteEstacionalActividad', { id });
      return;
    }
  }

  async calcularImpactoEstacional(
    costoBase: number,
    departamentoCodigo: string,
    mesInicio: number,
    mesFin: number,
    tipoActividad?: string
  ): Promise<{ costoTotal: number; costoAjustado: number; impactoTotal: number; porcentajeImpacto: number; desgloseMes: Array<{ mes: number; costo: number; factor: number }> }> {
    try {
      let costoTotal = 0;
      let costoAjustado = 0;
      const desgloseMes: Array<{ mes: number; costo: number; factor: number }> = [];

      for (let mes = mesInicio; mes <= mesFin; mes++) {
        const resultado = await this.aplicarFactoresEstacionales(costoBase, departamentoCodigo, mes, tipoActividad);
        costoTotal += costoBase;
        costoAjustado += resultado.costo_ajustado;
        desgloseMes.push({
          mes,
          costo: resultado.costo_ajustado,
          factor: resultado.factor_total
        });
      }

      const impactoTotal = costoAjustado - costoTotal;
      const porcentajeImpacto = costoTotal > 0 ? (impactoTotal / costoTotal) * 100 : 0;

      return {
        costoTotal,
        costoAjustado,
        impactoTotal,
        porcentajeImpacto,
        desgloseMes
      };
    } catch (error) {
      safeLogger.error('Error calculando impacto estacional:', error);
      return {
        costoTotal: costoBase,
        costoAjustado: costoBase,
        impactoTotal: 0,
        porcentajeImpacto: 0,
        desgloseMes: []
      };
    }
  }

  async obtenerMejorMesParaActividad(
    departamentoCodigo: string,
    tipoActividad: string,
    costoBase: number
  ): Promise<{ mejorMes: number; peorMes: number; costoMejor: number; costoPeor: number; ahorroMejor: number }> {
    try {
      let mejorMes = 1;
      let peorMes = 1;
      let costoMejor = Infinity;
      let costoPeor = -Infinity;

      for (let mes = 1; mes <= 12; mes++) {
        const resultado = await this.aplicarFactoresEstacionales(costoBase, departamentoCodigo, mes, tipoActividad);
        
        if (resultado.costo_ajustado < costoMejor) {
          costoMejor = resultado.costo_ajustado;
          mejorMes = mes;
        }

        if (resultado.costo_ajustado > costoPeor) {
          costoPeor = resultado.costo_ajustado;
          peorMes = mes;
        }
      }

      const ahorroMejor = costoPeor - costoMejor;

      return {
        mejorMes,
        peorMes,
        costoMejor,
        costoPeor,
        ahorroMejor
      };
    } catch (error) {
      safeLogger.error('Error obteniendo mejor mes para actividad:', error);
      return {
        mejorMes: 1,
        peorMes: 1,
        costoMejor: costoBase,
        costoPeor: costoBase,
        ahorroMejor: 0
      };
    }
  }
}

export const estacionalidad = new Estacionalidad();

export const listarEstacionalidad = estacionalidad.obtenerEstacionalidadDepartamento;
