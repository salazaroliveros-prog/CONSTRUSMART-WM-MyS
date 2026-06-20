const { createClient } = require('@supabase/supabase-js');

// Credenciales desde .env
const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const supabaseKey = 'JWT_ANON_KEY_PLACEHOLDER';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarTablas() {
  console.log('=== Verificando estado de tablas en Supabase ===\n');

  // Lista de tablas esperadas
  const tablasEsperadas = [
    'erp_reglas_factores',
    'erp_historial_aplicacion_reglas',
    'erp_calculos_proyecto',
    'erp_comparaciones_calculos',
    'erp_snapshots_estado_calculo',
    'erp_normativa_departamental',
    'erp_cumplimiento_normativo',
    'erp_escalas_produccion',
    'erp_aplicacion_escalas',
    'erp_estacionalidad',
    'erp_ajustes_estacionales_actividad'
  ];

  const tablasExistentes = [];
  const tablasFaltantes = [];

  for (const tabla of tablasEsperadas) {
    try {
      const { data, error } = await supabase
        .from(tabla)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST116') {
          // La tabla no existe
          tablasFaltantes.push(tabla);
        } else {
          console.error(`Error al verificar tabla ${tabla}:`, error);
          tablasFaltantes.push(tabla);
        }
      } else {
        tablasExistentes.push(tabla);
        console.log(`✅ Tabla existe: ${tabla}`);
      }
    } catch (e) {
      console.error(`Excepción al verificar tabla ${tabla}:`, e);
      tablasFaltantes.push(tabla);
    }
  }

  console.log('\n=== Resumen ===');
  console.log(`Tablas existentes: ${tablasExistentes.length}/${tablasEsperadas.length}`);
  console.log(`Tablas faltantes: ${tablasFaltantes.length}/${tablasEsperadas.length}`);

  if (tablasFaltantes.length > 0) {
    console.log('\nTablas faltantes:', tablasFaltantes.join(', '));
  }

  return { tablasExistentes, tablasFaltantes };
}

async function verificarFuncionesRPC() {
  console.log('\n=== Verificando funciones RPC ===\n');

  const funcionesEsperadas = [
    'aplicar_reglas_factor',
    'evaluar_condicion_regla',
    'registrar_calculo',
    'comparar_calculos',
    'crear_snapshot_estado',
    'obtener_normativa_departamental',
    'validar_cumplimiento_normativo',
    'determinar_escala_produccion',
    'aplicar_factores_escala',
    'obtener_factores_estacionales',
    'aplicar_factores_estacionales'
  ];

  const funcionesExistentes = [];
  const funcionesFaltantes = [];

  for (const func of funcionesEsperadas) {
    try {
      // Intentar llamar a la función RPC (con parámetros vacíos si es necesario)
      if (func === 'aplicar_reglas_factor') {
        await supabase.rpc(func, { p_valor: 1, p_tipo_factor: 'zona', p_contexto: {} });
      } else if (func === 'registrar_calculo') {
        await supabase.rpc(func, { p_proyecto_id: 'test', p_tipo_calculo: 'test', p_parametros_entrada: {}, p_resultado_calculado: {} });
      } else if (func === 'determinar_escala_produccion') {
        await supabase.rpc(func, { p_tipo_proyecto: 'residencial', p_tamano_proyecto: 100 });
      } else if (func === 'aplicar_factores_escala') {
        await supabase.rpc(func, { p_costo_base: 100, p_tipo_proyecto: 'residencial', p_tamano_proyecto: 100 });
      } else if (func === 'aplicar_factores_estacionales') {
        await supabase.rpc(func, { p_costo_base: 100, p_departamento_codigo: 'GT-01', p_mes: 1 });
      } else {
        await supabase.rpc(func);
      }

      funcionesExistentes.push(func);
      console.log(`✅ Función existe: ${func}`);
    } catch (e) {
      funcionesFaltantes.push(func);
      console.log(`❌ Función no existe o error: ${func}`);
    }
  }

  console.log('\n=== Resumen Funciones RPC ===');
  console.log(`Funciones existentes: ${funcionesExistentes.length}/${funcionesEsperadas.length}`);
  console.log(`Funciones faltantes: ${funcionesFaltantes.length}/${funcionesEsperadas.length}`);

  if (funcionesFaltantes.length > 0) {
    console.log('\nFunciones faltantes:', funcionesFaltantes.join(', '));
  }

  return { funcionesExistentes, funcionesFaltantes };
}

async function main() {
  try {
    await verificarTablas();
    await verificarFuncionesRPC();
  } catch (error) {
    console.error('Error en verificación:', error);
    process.exit(1);
  }
}

main();