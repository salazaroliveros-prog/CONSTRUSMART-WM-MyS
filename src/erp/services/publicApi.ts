import { supabase, hasSupabase } from '@/lib/supabase';
import { safeLogger } from '@/lib/safeLogger';

export interface ApiKeyInfo {
  id: string;
  name: string;
  scopes: string[];
  empresaId?: string;
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface ProyectoPublico {
  id: string;
  nombre: string;
  cliente: string;
  tipologia: string;
  estado: string;
  presupuestoTotal: number;
  montoContrato: number;
  avanceFisico: number;
  avanceFinanciero: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface MovimientoPublico {
  id: string;
  proyectoId: string;
  tipo: string;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
}

export interface KPIsProyecto {
  presupuestoTotal: number;
  costoReal: number;
  ingresoReal: number;
  utilidadBruta: number;
  margenBruto: number;
  variacionPresupuesto: number;
  avanceFisico: number;
  avanceFinanciero: number;
}

export class PublicApiService {
  /**
   * Generar una nueva API key
   */
  static async generarApiKey(
    nombre: string,
    empresaId?: string,
    scopes: string[] = ['read'],
    expiresDays?: number
  ): Promise<{ key: string; keyHash: string }> {
    if (!hasSupabase) {
      throw new Error('Supabase no está disponible');
    }

    try {
      const { data, error } = await supabase.rpc('generar_api_key_hash', {
        p_name: nombre,
        p_empresa_id: empresaId || null,
        p_scopes: scopes,
        p_expires_days: expiresDays || null,
      });

      if (error) throw error;

      return {
        key: data, // Key original (se debe guardar y mostrar al usuario)
        keyHash: '', // Hash se maneja internamente
      };
    } catch (error) {
      safeLogger.error('Error generando API key:', error);
      throw error;
    }
  }

  /**
   * Obtener API keys del usuario actual
   */
  static async obtenerApiKeys(): Promise<ApiKeyInfo[]> {
    if (!hasSupabase) return [];

    try {
      const { data, error } = await supabase
        .from('erp_api_keys')
        .select('*')
        .eq('activo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((key: any) => ({
        id: key.id,
        name: key.name,
        scopes: key.scopes,
        empresaId: key.empresa_id,
        expiresAt: key.expires_at,
        createdAt: key.created_at,
        lastUsedAt: key.last_used_at,
      }));
    } catch (error) {
      safeLogger.error('Error obteniendo API keys:', error);
      return [];
    }
  }

  /**
   * Revocar (desactivar) una API key
   */
  static async revocarApiKey(keyId: string): Promise<void> {
    if (!hasSupabase) return;

    try {
      const { error } = await supabase
        .from('erp_api_keys')
        .update({ activo: false })
        .eq('id', keyId);

      if (error) throw error;
    } catch (error) {
      safeLogger.error('Error revocando API key:', error);
      throw error;
    }
  }

  /**
   * Obtener proyectos públicos (para integraciones externas)
   */
  static async obtenerProyectosPublicos(
    apiKeyHash: string,
    empresaId?: string,
    estado?: string,
    limit = 50,
    offset = 0
  ): Promise<ProyectoPublico[]> {
    if (!hasSupabase) return [];

    try {
      const { data, error } = await supabase.rpc('api_obtener_proyectos', {
        p_api_key_hash: apiKeyHash,
        p_empresa_id: empresaId || null,
        p_estado: estado || null,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      safeLogger.error('Error obteniendo proyectos públicos:', error);
      throw error;
    }
  }

  /**
   * Obtener movimientos de un proyecto (para integraciones externas)
   */
  static async obtenerMovimientosProyecto(
    apiKeyHash: string,
    proyectoId: string,
    tipo?: string,
    categoria?: string,
    limit = 100
  ): Promise<MovimientoPublico[]> {
    if (!hasSupabase) return [];

    try {
      const { data, error } = await supabase.rpc('api_obtener_movimientos_proyecto', {
        p_api_key_hash: apiKeyHash,
        p_proyecto_id: proyectoId,
        p_tipo: tipo || null,
        p_categoria: categoria || null,
        p_limit: limit,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      safeLogger.error('Error obteniendo movimientos:', error);
      throw error;
    }
  }

  /**
   * Obtener KPIs de un proyecto (para integraciones externas)
   */
  static async obtenerKPIsProyecto(
    apiKeyHash: string,
    proyectoId: string
  ): Promise<KPIsProyecto | null> {
    if (!hasSupabase) return null;

    try {
      const { data, error } = await supabase.rpc('api_obtener_kpis_proyecto', {
        p_api_key_hash: apiKeyHash,
        p_proyecto_id: proyectoId,
      });

      if (error) throw error;

      if (!data || data.length === 0) return null;

      return data[0];
    } catch (error) {
      safeLogger.error('Error obteniendo KPIs:', error);
      throw error;
    }
  }

  /**
   * Webhook: Proyecto creado (para notificar sistemas externos)
   */
  static async notificarProyectoCreado(
    webhookUrl: string,
    proyecto: ProyectoPublico,
    apiKey: string
  ): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          event: 'proyecto_creado',
          data: proyecto,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }
    } catch (error) {
      safeLogger.error('Error notificando webhook:', error);
      throw error;
    }
  }

  /**
   * Webhook: Movimiento creado (para notificar sistemas externos)
   */
  static async notificarMovimientoCreado(
    webhookUrl: string,
    movimiento: MovimientoPublico,
    apiKey: string
  ): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          event: 'movimiento_creado',
          data: movimiento,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }
    } catch (error) {
      safeLogger.error('Error notificando webhook:', error);
      throw error;
    }
  }
}

export const publicApiService = new PublicApiService();
