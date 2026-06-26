import { supabase } from '@/lib/supabase';
import { NormativaDepartamental } from '@/erp/types';

export interface CumplimientoNormativo {
  id?: string;
  proyecto_id: string;
  norma_id: string;
  estado_cumplimiento: 'pendiente' | 'en_proceso' | 'cumple' | 'no_cumple' | 'excepcionado';
  fecha_verificacion?: string;
  responsable_verificacion?: string;
  evidencias_cumplimiento: Record<string, any>;
  observaciones?: string;
  requiere_acciones_correctivas?: boolean;
  acciones_correctivas?: string[];
  fecha_limite_correccion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResultadoValidacionNormativa {
  norma_id: string;
  codigo_norma: string;
  estado_cumplimiento: string;
  alertas: Array<{
    tipo: string;
    mensaje: string;
    codigo_norma: string;
    valor_actual: any;
    valor_requerido: any;
  }>;
}

export class NormativaDepartamental {
  async obtenerNormativasDepartamento(
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
      console.error('Error obteniendo normativa departamental:', error);
      return [];
    }
  }

  async obtenerTodasNormativas(): Promise<NormativaDepartamental[]> {
    try {
      const { data, error } = await supabase
        .from('erp_normativa_departamental')
        .select('*')
        .eq('activo', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo todas las normativas:', error);
      return [];
    }
  }

  async validarCumplimientoNormativo(
    proyectoId: string,
    departamentoCodigo: string,
    tipoCalculo: string,
    parametrosCalculo: Record<string, any>
  ): Promise<ResultadoValidacionNormativa[]> {
    try {
      const { data, error } = await supabase.rpc('validar_cumplimiento_normativo', {
        p_proyecto_id: proyectoId,
        p_departamento_codigo: departamentoCodigo,
        p_tipo_calculo: tipoCalculo,
        p_parametros_calculo: parametrosCalculo
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error validando cumplimiento normativo:', error);
      return [];
    }
  }

  async obtenerCumplimientoProyecto(proyectoId: string): Promise<CumplimientoNormativo[]> {
    try {
      const { data, error } = await supabase
        .from('erp_cumplimiento_normativo')
        .select('*')
        .eq('proyecto_id', proyectoId)
        .order('fecha_verificacion', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo cumplimiento del proyecto:', error);
      return [];
    }
  }

  async registrarCumplimiento(
    proyectoId: string,
    normaId: string,
    estado: CumplimientoNormativo['estado_cumplimiento'],
    opciones?: {
      fechaVerificacion?: string;
      responsableVerificacion?: string;
      evidencias?: Record<string, any>;
      observaciones?: string;
    }
  ): Promise<CumplimientoNormativo> {
    try {
      const { data, error } = await supabase
        .from('erp_cumplimiento_normativo')
        .upsert({
          proyecto_id: proyectoId,
          norma_id: normaId,
          estado_cumplimiento: estado,
          fecha_verificacion: opciones?.fechaVerificacion || new Date().toISOString().slice(0, 10),
          responsable_verificacion: opciones?.responsableVerificacion,
          evidencias_cumplimiento: opciones?.evidencias || {},
          observaciones: opciones?.observaciones,
        }, {
          onConflict: 'proyecto_id,norma_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error registrando cumplimiento:', error);
      throw error;
    }
  }

  async crearNormativa(normativa: Partial<NormativaDepartamental>): Promise<NormativaDepartamental> {
    try {
      const { data, error } = await supabase
        .from('erp_normativa_departamental')
        .insert(normativa)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creando normativa:', error);
      throw error;
    }
  }

  async actualizarNormativa(id: string, normativa: Partial<NormativaDepartamental>): Promise<NormativaDepartamental> {
    try {
      const { data, error } = await supabase
        .from('erp_normativa_departamental')
        .update(normativa)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error actualizando normativa:', error);
      throw error;
    }
  }

  async eliminarNormativa(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('erp_normativa_departamental')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error eliminando normativa:', error);
      throw error;
    }
  }

  async obtenerNormativaPorId(id: string): Promise<NormativaDepartamental | null> {
    try {
      const { data, error } = await supabase
        .from('erp_normativa_departamental')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error obteniendo normativa por ID:', error);
      return null;
    }
  }

  async obtenerNormativasPorTipo(tipoNorma: string): Promise<NormativaDepartamental[]> {
    try {
      const { data, error } = await supabase
        .from('erp_normativa_departamental')
        .select('*')
        .eq('tipo_norma', tipoNorma)
        .eq('activo', true)
        .order('departamento_codigo')
        .order('obligatoria', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo normativas por tipo:', error);
      return [];
    }
  }
}

export const normativaDepartamental = new NormativaDepartamental();

export const listarNormativas = normativaDepartamental.obtenerTodasNormativas;