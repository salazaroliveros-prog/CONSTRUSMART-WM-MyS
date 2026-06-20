import { supabase } from '@/lib/supabase';
import { EscalaProduccion } from '@/erp/types';

export class ServicioEscalasProduccion {
  static async obtenerEscalaPorPresupuesto(
    tipoProyecto: string,
    presupuesto: number
  ): Promise<EscalaProduccion | null> {
    try {
      const { data, error } = await supabase.rpc('obtener_escala_produccion', {
        p_tipo_proyecto: tipoProyecto,
        p_presupuesto: presupuesto
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error al obtener escala de producción:', error);
      throw error;
    }
  }

  static async aplicarFactoresEscala(
    tipoProyecto: string,
    presupuestoBase: number,
    costoDirecto: number
  ): Promise<{
    presupuestoBase: number;
    costoAjustado: number;
    factorEconomiaAplicado: number;
    factorAdministracionAplicado: number;
    factorImprevistosAplicado: number;
    factorTotal: number;
    presupuestoFinal: number;
    escalaIdentificada: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('aplicar_factores_escala', {
        p_tipo_proyecto: tipoProyecto,
        p_presupuesto_base: presupuestoBase,
        p_costo_directo: costoDirecto
      });

      if (error) throw error;
      return data?.[0] || {
        presupuestoBase: presupuestoBase,
        costoAjustado: costoDirecto,
        factorEconomiaAplicado: 1.10,
        factorAdministracionAplicado: 1.12,
        factorImprevistosAplicado: 1.08,
        factorTotal: 1.10 * 1.12 * 1.08,
        presupuestoFinal: costoDirecto * 1.10 * 1.12 * 1.08,
        escalaIdentificada: 'desconocido'
      };
    } catch (error) {
      console.error('Error al aplicar factores de escala:', error);
      throw error;
    }
  }

  static async listarEscalas(filtro?: { tipoProyecto?: string; rangoTamano?: string }) {
    try {
      let query = supabase
        .from('erp_escalas_produccion')
        .select('*')
        .eq('activo', true);

      if (filtro?.tipoProyecto) {
        query = query.eq('tipo_proyecto', filtro.tipoProyecto);
      }

      if (filtro?.rangoTamano) {
        query = query.eq('rango_tamano', filtro.rangoTamano);
      }

      const { data, error } = await query.order('tipo_proyecto', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al listar escalas de producción:', error);
      throw error;
    }
  }

  static async obtenerTiposProyecto() {
    try {
      const { data, error } = await supabase
        .from('erp_escalas_produccion')
        .select('tipo_proyecto')
        .eq('activo', true);

      if (error) throw error;
      const tipos = [...new Set(data?.map(d => d.tipo_proyecto))];
      return tipos;
    } catch (error) {
      console.error('Error al obtener tipos de proyecto:', error);
      throw error;
    }
  }
}

export const obtenerEscalaProduccion = ServicioEscalasProduccion.obtenerEscalaPorPresupuesto;
export const aplicarFactoresEscala = ServicioEscalasProduccion.aplicarFactoresEscala;
export const listarEscalasProduccion = ServicioEscalasProduccion.listarEscalas;
export const obtenerTiposProyecto = ServicioEscalasProduccion.obtenerTiposProyecto;