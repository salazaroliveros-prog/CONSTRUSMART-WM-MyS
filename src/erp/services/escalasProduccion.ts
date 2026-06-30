import { supabase } from '@/lib/supabase';
import { safeLogger } from '@/lib/safeLogger';
import { logErrorFromException } from '@/lib/error-logger';
import { useErpStore } from '@/erp/zustandStore';

import { EscalaProduccion } from '@/erp/types';
import { escalaProduccionSchema } from '@/erp/store/schemas/calculos';
import { safeParseArray } from '@/erp/utils';

export const safeParseEscalaProduccionArray = (value: unknown): EscalaProduccion[] =>
  safeParseArray(value, escalaProduccionSchema) as EscalaProduccion[];

export const parseEscalaProduccion = (value: unknown): EscalaProduccion | null => {
  const parsed = escalaProduccionSchema.safeParse(value);
  return parsed.success ? (parsed.data as EscalaProduccion) : null;
};

export interface AplicacionEscala {
  id?: string;
  proyecto_id: string;
  escala_id: string;
  tamano_proyecto: number;
  presupuesto_estimado?: number;
  cantidad_renglones?: number;
  factor_economia_aplicado: number;
  factor_administracion_aplicado: number;
  factor_imprevistos_aplicado: number;
  factor_logistica_aplicado: number;
  factor_financiero_aplicado: number;
  factor_total: number;
  costo_ajustado: number;
  ahorro_estimado: number;
  usuario_aplicacion?: string;
  fecha_aplicacion?: string;
  observaciones?: string;
}

export interface ResultadoAplicacionEscala {
  costo_ajustado: number;
  factor_economia: number;
  factor_administracion: number;
  factor_imprevistos: number;
  factor_logistica: number;
  factor_financiero: number;
  factor_total: number;
  ahorro_estimado: number;
  rango_tamano: string;
}

export class EscalasProduccion {
  async obtenerEscalasProduccion(
    tipoProyecto?: string,
    subtipoProyecto?: string
  ): Promise<EscalaProduccion[]> {
    try {
      let query = supabase
        .from('erp_escalas_produccion')
        .select('*')
        .eq('activo', true)
        .order('rango_tamano');

      if (tipoProyecto) {
        query = query.eq('tipo_proyecto', tipoProyecto);
      }

      if (subtipoProyecto) {
        query = query.eq('subtipo_proyecto', subtipoProyecto);
      }

      const { data, error } = await query;
      if (error) throw error;
      return safeParseEscalaProduccionArray(data);
    } catch (error) {
      safeLogger.warn('Error obteniendo escalas de producción (offline esperado):', error);
      return [];
    }
  }

  async determinarEscalaProyecto(
    tipoProyecto: string,
    tamanoProyecto: number,
    subtipoProyecto?: string
  ): Promise<EscalaProduccion | null> {
    try {
      const { data, error } = await supabase.rpc('determinar_escala_produccion', {
        p_tipo_proyecto: tipoProyecto,
        p_subtipo_proyecto: subtipoProyecto || null,
        p_tamano_proyecto: tamanoProyecto
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      safeLogger.warn('Error determinando escala del proyecto (offline esperado):', error);
      return null;
    }
  }

  async aplicarFactoresEscala(
    costoBase: number,
    tipoProyecto: string,
    tamanoProyecto: number,
    opciones?: {
      subtipoProyecto?: string;
      presupuestoEstimado?: number;
    }
  ): Promise<ResultadoAplicacionEscala> {
    try {
      const { data, error } = await supabase.rpc('aplicar_factores_escala', {
        p_costo_base: costoBase,
        p_tipo_proyecto: tipoProyecto,
        p_subtipo_proyecto: opciones?.subtipoProyecto || null,
        p_tamano_proyecto: tamanoProyecto,
        p_presupuesto_estimado: opciones?.presupuestoEstimado || null
      });

      if (error) throw error;
      const rows = safeParseEscalaProduccionArray(data);
      return rows[0] ?? {
        costo_ajustado: costoBase,
        factor_economia: 1.0,
        factor_administracion: 1.0,
        factor_imprevistos: 1.0,
        factor_logistica: 1.0,
        factor_financiero: 1.0,
        factor_total: 1.0,
        ahorro_estimado: 0,
        rango_tamano: 'mediano'
      };
    } catch (error) {
      safeLogger.warn('Error aplicando factores de escala (offline esperado):', error);
      return {
        costo_ajustado: costoBase,
        factor_economia: 1.0,
        factor_administracion: 1.0,
        factor_imprevistos: 1.0,
        factor_logistica: 1.0,
        factor_financiero: 1.0,
        factor_total: 1.0,
        ahorro_estimado: 0,
        rango_tamano: 'mediano'
      };
    }
  }

  async registrarAplicacionEscala(
    proyectoId: string,
    escalaId: string,
    resultadoAplicacion: ResultadoAplicacionEscala,
    metadatos?: {
      tamanoProyecto: number;
      presupuestoEstimado?: number;
      cantidadRenglones?: number;
      usuarioAplicacion?: string;
      observaciones?: string;
    }
  ): Promise<AplicacionEscala> {
    try {
      const { data, error } = await supabase
        .from('erp_aplicacion_escalas')
        .insert({
          proyecto_id: proyectoId,
          escala_id: escalaId,
          tamano_proyecto: metadatos?.tamanoProyecto,
          presupuesto_estimado: metadatos?.presupuestoEstimado,
          cantidad_renglones: metadatos?.cantidadRenglones,
          factor_economia_aplicado: resultadoAplicacion.factor_economia,
          factor_administracion_aplicado: resultadoAplicacion.factor_administracion,
          factor_imprevistos_aplicado: resultadoAplicacion.factor_imprevistos,
          factor_logistica_aplicado: resultadoAplicacion.factor_logistica,
          factor_financiero_aplicado: resultadoAplicacion.factor_financiero,
          factor_total: resultadoAplicacion.factor_total,
          costo_ajustado: resultadoAplicacion.costo_ajustado,
          ahorro_estimado: resultadoAplicacion.ahorro_estimado,
          usuario_aplicacion: metadatos?.usuarioAplicacion,
          observaciones: metadatos?.observaciones,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[escalasProduccion] Error registrando aplicación de escala, encolando mutación:', error);
      useErpStore.getState().enqueueMutation('registrarAplicacionEscala', {
        proyecto_id: proyectoId, escala_id: escalaId, ...resultadoAplicacion, ...metadatos
      });
      return data || null;
    }
  }

  async obtenerHistorialAplicacion(proyectoId: string): Promise<AplicacionEscala[]> {
    try {
      const { data, error } = await supabase
        .from('erp_aplicacion_escalas')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .order('fecha_aplicacion', { ascending: false });

      if (error) throw error;
      return safeParseEscalaProduccionArray(data);
    } catch (error) {
      safeLogger.error('Error obteniendo histórico de aplicaciones de escala:', error);
      return [];
    }
  }

  async crearEscala(escala: Partial<EscalaProduccion>): Promise<EscalaProduccion> {
    try {
      const { data, error } = await supabase
        .from('erp_escalas_produccion')
        .insert(escala)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[escalasProduccion] Error creando escala, encolando mutación:', error);
      useErpStore.getState().enqueueMutation('addEscalaProduccion', escala);
      return { ...escala, id: crypto.randomUUID?.() || Date.now().toString() } as EscalaProduccion;
    }
  }

  async actualizarEscala(id: string, escala: Partial<EscalaProduccion>): Promise<EscalaProduccion> {
    try {
      const { data, error } = await supabase
        .from('erp_escalas_produccion')
        .update(escala)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      safeLogger.warn('[escalasProduccion] Error actualizando escala, encolando mutación:', error);
      useErpStore.getState().enqueueMutation('updateEscalaProduccion', { id, ...escala });
      return { id, ...escala } as EscalaProduccion;
    }
  }

  async eliminarEscala(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('erp_escalas_produccion')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      safeLogger.warn('[escalasProduccion] Error eliminando escala, encolando mutación:', error);
      useErpStore.getState().enqueueMutation('deleteEscalaProduccion', { id });
      return;
    }
  }

   async obtenerEscalaPorId(id: string): Promise<EscalaProduccion | null> {
    try {
      const { data, error } = await supabase
        .from('erp_escalas_produccion')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return parseEscalaProduccion(data);
    } catch (error) {
      safeLogger.error('Error obteniendo escala por ID:', error);
      return null;
    }
  }

  async obtenerEscalasPorRango(rango: 'pequeno' | 'mediano' | 'grande' | 'muy_grande' | 'mega'): Promise<EscalaProduccion[]> {
    try {
      const { data, error } = await supabase
        .from('erp_escalas_produccion')
        .select('*')
        .eq('rango_tamano', rango)
        .eq('activo', true)
        .order('tipo_proyecto', 'subtipo_proyecto');

      if (error) throw error;
      return safeParseEscalaProduccionArray(data);
    } catch (error) {
      safeLogger.error('Error obteniendo escalas por rango:', error);
      return [];
    }
  }

  async calcularAhorroEscala(
    costoBase: number,
    tipoProyecto: string,
    tamanoProyecto: number,
    subtipoProyecto?: string
  ): Promise<{ costoBase: number; costoAjustado: number; ahorro: number; porcentajeAhorro: number; rango: string }> {
    try {
      const resultado = await this.aplicarFactoresEscala(costoBase, tipoProyecto, tamanoProyecto, { subtipoProyecto });
      
      const ahorro = resultado.ahorro_estimado;
      const porcentajeAhorro = costoBase > 0 ? (ahorro / costoBase) * 100 : 0;

      return {
        costoBase,
        costoAjustado: resultado.costo_ajustado,
        ahorro,
        porcentajeAhorro,
        rango: resultado.rango_tamano
      };
    } catch (error) {
      safeLogger.error('Error calculando ahorro de escala:', error);
      return {
        costoBase,
        costoAjustado: costoBase,
        ahorro: 0,
        porcentajeAhorro: 0,
        rango: 'mediano'
      };
    }
  }
}

export const escalasProduccion = new EscalasProduccion();

export const listarEscalasProduccion = escalasProduccion.obtenerEscalasProduccion;
