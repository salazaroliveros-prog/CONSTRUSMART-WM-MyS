import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Leer archivo .env manualmente
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envContent = readFileSync('.env', 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    } else if (line.startsWith('VITE_SUPABASE_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
} catch (err) {
  console.error('❌ No se pudo leer archivo .env');
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarTablasFase3() {
  console.log('🔍 Verificando tablas Fase 3 en Supabase...\n');

  const tablas = [
    'erp_parametros_pavimentos',
    'erp_parametros_redes_infraestructura',
    'erp_parametros_muros_contencion'
  ];

  for (const tabla of tablas) {
    try {
      const { count, error } = await supabase
        .from(tabla)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${tabla}: Tabla no existe o error de acceso`);
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log(`✅ ${tabla}: Existe con ${count} registros`);
      }
    } catch (err) {
      console.log(`❌ ${tabla}: Error inesperado - ${err}\n`);
    }
  }
}

async function verificarFuncionesRPC() {
  console.log('\n🔍 Verificando funciones RPC...\n');

  const funciones = [
    'calcular_pavimento',
    'calcular_red_infraestructura',
    'calcular_muro_contencion'
  ];

  for (const func of funciones) {
    try {
      const { data, error } = await supabase.rpc(func, {
        p_uso: 'peatonal',
        p_tipo: 'adoquinado',
        p_tipo_base: 'c4',
        p_tipo_sello: 'arena',
        p_area_m2: 10
      });

      if (error) {
        console.log(`❌ ${func}: No existe o error`);
        console.log(`   Error: ${error.message}\n`);
      } else {
        console.log(`✅ ${func}: Existe y responde correctamente`);
      }
    } catch (err) {
      console.log(`❌ ${func}: Error inesperado - ${err}\n`);
    }
  }
}

async function verificarDatosPrueba() {
  console.log('\n🔍 Verificando datos de prueba...\n');

  try {
    const { count: pavimentosCount } = await supabase
      .from('erp_parametros_pavimentos')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Pavimentos: ${pavimentosCount || 0} registros`);

    const { count: redesCount } = await supabase
      .from('erp_parametros_redes_infraestructura')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Redes Infraestructura: ${redesCount || 0} registros`);

    const { count: murosCount } = await supabase
      .from('erp_parametros_muros_contencion')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Muros Contención: ${murosCount || 0} registros`);
  } catch (err) {
    console.log(`❌ Error al verificar datos: ${err}`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   VERIFICACIÓN FASE 3 SUPABASE CONSTRUSMART  ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  await verificarTablasFase3();
  await verificarFuncionesRPC();
  await verificarDatosPrueba();

  console.log('\n✅ Verificación completada');
}

main().catch(console.error);