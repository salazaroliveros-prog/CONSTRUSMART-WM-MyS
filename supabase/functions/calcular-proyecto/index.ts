// Edge Function: Procesamiento intensivo de cálculos
// Ubicación: supabase/functions/calcular-proyecto/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Habilitar CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { proyectoId, tipoCalculo, parametros } = await req.json();

    // Validar entrada
    if (!proyectoId || !tipoCalculo || !parametros) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Crear cliente Supabase con service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ejecutar cálculo según tipo
    let resultado;
    switch (tipoCalculo) {
      case 'dosificacion_concreto':
        resultado = await calcularDosificacionConcreto(parametros);
        break;
      case 'movimiento_tierra':
        resultado = await calcularMovimientoTierra(parametros);
        break;
      case 'pavimento':
        resultado = await calcularPavimento(parametros);
        break;
      case 'rentabilidad':
        resultado = await calcularRentabilidad(proyectoId, supabase);
        break;
      default:
        return new Response('Tipo de cálculo no soportado', { status: 400 });
    }

    // Registrar cálculo en historial
    await supabase.from('erp_calculos_proyecto').insert({
      proyecto_id: proyectoId,
      tipo_calculo: tipoCalculo,
      parametros_entrada: parametros,
      resultado_calculado: resultado,
      fecha_calculo: new Date().toISOString(),
      origen_calculo: 'automatico',
      validado: false,
    });

    return new Response(JSON.stringify({
      success: true,
      resultado,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error en edge function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

// Funciones de cálculo (stub - implementar lógica real)
async function calcularDosificacionConcreto(parametros: any) {
  const { volumen, resistencia, tipo } = parametros;
  
  // Lógica de cálculo (simplificada para ejemplo)
  const cementoSacos = 6.5 * volumen;
  const arenaM3 = 0.45 * volumen;
  const piedraM3 = 0.85 * volumen;
  const aguaLt = 180 * volumen;
  
  return {
    cementoSacos,
    arenaM3,
    piedraM3,
    aguaLt,
    costoTotal: cementoSacos * 92 + arenaM3 * 145 + piedraM3 * 195,
  };
}

async function calcularMovimientoTierra(parametros: any) {
  const { volumen, tipo, suelo } = parametros;
  
  // Lógica de cálculo (simplificada)
  const costoUnitario = 45;
  const costoTotal = volumen * costoUnitario;
  
  return {
    costoUnitario,
    costoTotal,
    tiempoEstimadoDias: Math.ceil(volumen / 50),
  };
}

async function calcularPavimento(parametros: any) {
  const { areaM2, uso, tipo } = parametros;
  
  // Lógica de cálculo (simplificada)
  const costoM2 = 85;
  const costoTotal = areaM2 * costoM2;
  
  return {
    costoM2,
    costoTotal,
    espesorCm: 15,
  };
}

async function calcularRentabilidad(proyectoId: string, supabase: any) {
  // Obtener movimientos del proyecto
  const { data: movimientos } = await supabase
    .from('erp_movimientos')
    .select('*')
    .eq('proyecto_id', proyectoId);
  
  // Obtener datos del proyecto
  const { data: proyecto } = await supabase
    .from('erp_proyectos')
    .select('*')
    .eq('id', proyectoId)
    .single();
  
  // Calcular métricas
  const costoReal = movimientos?.filter((m: any) => m.tipo === 'gasto')
    .reduce((sum: number, m: any) => sum + m.monto, 0) || 0;
  
  const ingresoReal = movimientos?.filter((m: any) => m.tipo === 'ingreso')
    .reduce((sum: number, m: any) => sum + m.monto, 0) || 0;
  
  const utilidadBruta = ingresoReal - costoReal;
  const margenBruto = ingresoReal > 0 ? (utilidadBruta / ingresoReal) * 100 : 0;
  const variacionPresupuesto = proyecto?.presupuesto_total > 0
    ? ((costoReal - proyecto.presupuesto_total) / proyecto.presupuesto_total) * 100
    : 0;
  
  return {
    costoReal,
    ingresoReal,
    utilidadBruta,
    margenBruto,
    variacionPresupuesto,
    estadoRentabilidad: margenBruto >= 15 ? 'bueno' : 'riesgoso',
  };
}
