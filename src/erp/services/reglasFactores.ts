import { supabase } from '@/lib/supabase';
import { safeLogger } from '@/lib/safeLogger';
import { logErrorFromException } from '@/lib/error-logger';
import { useErpStore } from '@/erp/zustandStore';

import { ReglaFactor } from '@/erp/types';
import { reglaFactorSchema } from '@/erp/store/schemas/calculos';
import { safeParseArray } from '@/erp/utils';

export const safeParseReglaFactorArray = (value: unknown): ReglaFactor[] =>
  safeParseArray(value, reglaFactorSchema) as ReglaFactor[];

export const parseReglaFactor = (value: unknown): ReglaFactor | null => {
  const parsed = reglaFactorSchema.safeParse(value);
  return parsed.success ? (parsed.data as ReglaFactor) : null;
};

export interface ReglaFactor {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo_factor: 'zona' | 'tipologia' | 'escalas' | 'estacional' | 'climatico' | 'normativa' | 'sobrecosto';
  prioridad: number;
  condicion: Record<string, unknown>;
  factor_aplicacion: number;
  operador: 'multiplicar' | 'sumar' | 'restar' | 'porcentaje';
  ambito: 'global' | 'departamento' | 'municipio' | 'proyecto' | 'renglon';
  departamento_id?: string;
  municipio_id?: string;
  tipologia?: string;
  activo: boolean;
  fecha_inicio?: string;
  fecha_fin?: string;
  created_at: string;
  updated_at: string;
}

export interface HistorialAplicacionRegla {
  id: string;
  proyecto_id?: string;
  renglon_id?: string;
  regla_id: string;
  valor_original: number;
  valor_aplicado: number;
  factor_aplicado: number;
  contexto_aplicacion: Record<string, unknown>;
  usuario_id?: string;
  fecha_aplicacion: string;
  created_at: string;
}

export interface ResultadoAplicacionReglas {
  valor_final: number;
  reglas_aplicadas: Array<{
    regla_id: string;
    nombre: string;
    factor: number;
    operador: string;
    prioridad: number;
  }>;
  factor_total: number;
}

export interface ContextoAplicacion {
  departamento?: string;
  municipio?: string;
  tipologia?: string;
  altitud?: number;
  proyecto_id?: string;
  renglon_id?: string;
  usuario_id?: string;
  fecha?: string;
  [key: string]: unknown;
}

export class MotorReglasFactores {
   async obtenerReglasActivas(
    tipoFactor?: ReglaFactor['tipo_factor'],
    ambito?: ReglaFactor['ambito']
  ): Promise<ReglaFactor[]> {
    let query = supabase
      .from('erp_reglas_factores')
      .select('*')
      .eq('activo', true)
      .order('prioridad', { ascending: false });

    if (tipoFactor) {
      query = query.eq('tipo_factor', tipoFactor);
    }

    if (ambito) {
      query = query.eq('ambito', ambito);
    }

    const { data, error } = await query;
    if (error) throw error;
    return safeParseReglaFactorArray(data);
  }

  async evaluarCondicion(
    condicion: Record<string, unknown>,
    contexto: ContextoAplicacion
  ): Promise<boolean> {
    if (!condicion || Object.keys(condicion).length === 0) {
      return true;
    }

    for (const [key, condValue] of Object.entries(condicion)) {
      const contextValue = contexto[key];

      if (contextValue === undefined || contextValue === null) {
        return false;
      }

      if (typeof condValue === 'object' && condValue !== null) {
        const condObj = condValue as Record<string, unknown>;
        
        if ('operador' in condObj && 'valor' in condObj) {
          const operador = condObj.operador as string;
          const valor = condObj.valor;
          
          switch (operador) {
            case 'igual':
              if (contextValue !== valor) return false;
              break;
            case 'mayor':
              if (typeof contextValue === 'number' && typeof valor === 'number') {
                if (contextValue <= valor) return false;
              }
              break;
            case 'menor':
              if (typeof contextValue === 'number' && typeof valor === 'number') {
                if (contextValue >= valor) return false;
              }
              break;
            case 'contiene':
              if (typeof contextValue === 'string' && typeof valor === 'string') {
                if (!contextValue.includes(valor)) return false;
              }
              break;
            case 'en':
              if (typeof valor === 'string') {
                const valores = valor.split(',').map(v => v.trim());
                if (!valores.includes(String(contextValue))) return false;
              }
              break;
            default:
              if (contextValue !== valor) return false;
          }
        } else {
          if (contextValue !== condValue) return false;
        }
      } else {
        if (contextValue !== condValue) return false;
      }
    }

    return true;
  }

  async aplicarReglas(
    valor: number,
    tipoFactor: ReglaFactor['tipo_factor'],
    contexto: ContextoAplicacion = {}
  ): Promise<ResultadoAplicacionReglas> {
    try {
      const reglas = await this.obtenerReglasActivas(tipoFactor);
      let valorActual = valor;
      let factorAcumulado = 1.0;
      const reglasAplicadas: ResultadoAplicacionReglas['reglas_aplicadas'] = [];

      for (const regla of reglas) {
        const condicionCumplida = await this.evaluarCondicion(regla.condicion, contexto);

        if (condicionCumplida) {
          switch (regla.operador) {
            case 'multiplicar':
              valorActual = valorActual * regla.factor_aplicacion;
              factorAcumulado *= regla.factor_aplicacion;
              break;
            case 'sumar':
              valorActual = valorActual + regla.factor_aplicacion;
              break;
            case 'restar':
              valorActual = valorActual - regla.factor_aplicacion;
              break;
            case 'porcentaje':
              valorActual = valorActual * (1 + regla.factor_aplicacion / 100);
              factorAcumulado *= (1 + regla.factor_aplicacion / 100);
              break;
          }

          reglasAplicadas.push({
            regla_id: regla.id,
            nombre: regla.nombre,
            factor: regla.factor_aplicacion,
            operador: regla.operador,
            prioridad: regla.prioridad,
          });

          await this.registrarAplicacion(regla, valor, valorActual, regla.factor_aplicacion, contexto);
        }
      }

      return {
        valor_final: valorActual,
        reglas_aplicadas: reglasAplicadas,
        factor_total: factorAcumulado,
      };
    } catch (error) {
      safeLogger.error('Error aplicando reglas:', error);
      return {
        valor_final: valor,
        reglas_aplicadas: [],
        factor_total: 1.0,
      };
    }
  }

  async aplicarReglasViaRPC(
    valor: number,
    tipoFactor: ReglaFactor['tipo_factor'],
    contexto: ContextoAplicacion = {}
  ): Promise<ResultadoAplicacionReglas> {
    try {
      const { data, error } = await supabase.rpc('aplicar_reglas_factor', {
        p_valor: valor,
        p_tipo_factor: tipoFactor,
        p_contexto: contexto as Record<string, unknown>,
        p_proyecto_id: contexto.proyecto_id,
        p_renglon_id: contexto.renglon_id,
        p_usuario_id: contexto.usuario_id,
      });

      if (error) throw error;

      const resultado = data[0];
      return {
        valor_final: resultado.valor_final,
        reglas_aplicadas: resultado.reglas_aplicadas,
        factor_total: resultado.factor_total,
      };
    } catch (error) {
      safeLogger.error('Error aplicando reglas via RPC:', error);
      return {
        valor_final: valor,
        reglas_aplicadas: [],
        factor_total: 1.0,
      };
    }
  }

  private async registrarAplicacion(
    regla: ReglaFactor,
    valorOriginal: number,
    valorAplicado: number,
    factorAplicado: number,
    contexto: ContextoAplicacion
  ): Promise<void> {
    const payload = {
      proyecto_id: contexto.proyecto_id,
      renglon_id: contexto.renglon_id,
      regla_id: regla.id,
      valor_original: valorOriginal,
      valor_aplicado: valorAplicado,
      factor_aplicado: factorAplicado,
      contexto_aplicacion: contexto,
      usuario_id: contexto.usuario_id,
    };
    useErpStore.getState().enqueueMutation('addHistorialAplicacionRegla', payload);
  }

  async obtenerHistorial(
    proyectoId?: string,
    renglonId?: string,
    reglaId?: string,
    limite: number = 50
  ): Promise<HistorialAplicacionRegla[]> {
    let query = supabase
      .from('erp_historial_aplicacion_reglas')
      .select('*')
      .order('fecha_aplicacion', { ascending: false })
      .limit(limite);

    if (proyectoId) {
      query = query.eq('proyecto_id', proyectoId);
    }

    if (renglonId) {
      query = query.eq('renglon_id', renglonId);
    }

    if (reglaId) {
      query = query.eq('regla_id', reglaId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return safeParseReglaFactorArray(data as unknown as ReglaFactor[]);
  }

  async crearRegla(regla: Partial<ReglaFactor>): Promise<ReglaFactor> {
    const optimistic = { ...regla, id: crypto.randomUUID?.() || Date.now().toString() } as ReglaFactor;
    useErpStore.getState().enqueueMutation('addReglaFactor', regla);
    return optimistic;
  }

  async actualizarRegla(id: string, regla: Partial<ReglaFactor>): Promise<ReglaFactor> {
    useErpStore.getState().enqueueMutation('updateReglaFactor', { id, ...regla });
    return { id, ...regla } as ReglaFactor;
  }

  async eliminarRegla(id: string): Promise<void> {
    useErpStore.getState().enqueueMutation('deleteReglaFactor', { id });
  }

  async obtenerReglaPorId(id: string): Promise<ReglaFactor | null> {
    const { data, error } = await supabase
      .from('erp_reglas_factores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return parseReglaFactor(data);
  }
}

export const motorReglasFactores = new MotorReglasFactores();
