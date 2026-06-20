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

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' }
});

async function verificarTablasSistema() {
  console.log('🔍 Verificando tablas en esquema public de Supabase...\n');

  try {
    // Consultar information_schema para ver tablas existentes
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .ilike('table_name', 'erp_parametros_%');

    if (error) {
      console.log(`❌ Error consultando information_schema: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️  No se encontraron tablas erp_parametros_*');
    } else {
      console.log(`✅ Encontradas ${data.length} tablas erp_parametros_*:`);
      data.forEach((t: any) => {
        console.log(`   - ${t.table_schema}.${t.table_name}`);
      });
    }
  } catch (err) {
    console.log(`❌ Error inesperado: ${err}`);
  }
}

async function probarAccesoDirecto() {
  console.log('\n🔍 Probando acceso directo a tablas Fase 3...\n');

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
        console.log(`❌ ${tabla}: ${error.code} - ${error.message}`);
      } else {
        console.log(`✅ ${tabla}: Accesible (${count} registros)`);
      }
    } catch (err) {
      console.log(`❌ ${tabla}: Error - ${err}`);
    }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   DIAGNÓSTICO COMPLETO SUPABASE FASE 3      ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  console.log('URL Supabase:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NO CONFIGURADA');
  console.log('Key Supabase:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NO CONFIGURADA\n');

  await verificarTablasSistema();
  await probarAccesoDirecto();

  console.log('\n📋 Conclusión:');
  console.log('Si las tablas NO existen, requiere ejecutar migraciones SQL completas');
  console.log('en Supabase Dashboard → SQL Editor con las 3 migraciones de Fase 3.');
}

main().catch(console.error);