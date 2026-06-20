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

const supabase = createClient(supabaseUrl, supabaseKey);

async function probarCalculoPavimento() {
  console.log('\n🔍 Prueba 1: calcular_pavimento');
  try {
    const { data, error } = await supabase.rpc('calcular_pavimento', {
      p_uso: 'peatonal',
      p_tipo: 'adoquinado',
      p_tipo_base: 'c4',
      p_tipo_sello: 'arena',
      p_area_m2: 50
    });

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return false;
    }

    if (data && data.length > 0) {
      console.log(`✅ Éxito: Costo total Q${data[0].costo_total} para 50m²`);
      console.log(`   Espesor: ${data[0].espesor_cm}cm`);
      return true;
    } else {
      console.log('⚠️  Sin datos retornados');
      return false;
    }
  } catch (err) {
    console.log(`❌ Error: ${err}`);
    return false;
  }
}

async function probarCalculoRedInfraestructura() {
  console.log('\n🔍 Prueba 2: calcular_red_infraestructura');
  try {
    const { data, error } = await supabase.rpc('calcular_red_infraestructura', {
      p_tipo: 'agua_potable',
      p_diametro_pulgadas: 1.0,
      p_material: 'pvc',
      p_presion: 'media',
      p_longitud_ml: 100
    });

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return false;
    }

    if (data && data.length > 0) {
      console.log(`✅ Éxito: Costo total Q${data[0].costo_total} para 100ml`);
      console.log(`   Factor material: x${data[0].factor_ajuste_material}`);
      return true;
    } else {
      console.log('⚠️  Sin datos retornados');
      return false;
    }
  } catch (err) {
    console.log(`❌ Error: ${err}`);
    return false;
  }
}

async function probarCalculoMuroContencion() {
  console.log('\n🔍 Prueba 3: calcular_muro_contencion');
  try {
    const { data, error } = await supabase.rpc('calcular_muro_contencion', {
      p_altura_m: 2.0,
      p_tipo: 'gravedad',
      p_tipo_cimentacion: 'zapata_corrida',
      p_tipo_suelo: 'arena',
      p_tipo_drenaje: 'sin_drenaje',
      p_longitud_m: 10
    });

    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return false;
    }

    if (data && data.length > 0) {
      console.log(`✅ Éxito: Costo total Q${data[0].costo_total} para muro 2x10m`);
      console.log(`   Factor ajuste: x${data[0].factor_ajuste_total}`);
      return true;
    } else {
      console.log('⚠️  Sin datos retornados');
      return false;
    }
  } catch (err) {
    console.log(`❌ Error: ${err}`);
    return false;
  }
}

async function verificarDatosTablas() {
  console.log('\n🔍 Verificando datos en tablas...');
  
  const tablas = ['erp_parametros_pavimentos', 'erp_parametros_redes_infraestructura', 'erp_parametros_muros_contencion'];
  
  for (const tabla of tablas) {
    const { count, error } = await supabase
      .from(tabla)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`❌ ${tabla}: Error - ${error.message}`);
    } else {
      console.log(`📊 ${tabla}: ${count} registros`);
    }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   PRUEBA INTEGRAL MOTORES FASE 3             ║');
  console.log('╚══════════════════════════════════════════════╝');

  await verificarDatosTablas();
  
  const resultado1 = await probarCalculoPavimento();
  const resultado2 = await probarCalculoRedInfraestructura();
  const resultado3 = await probarCalculoMuroContencion();

  console.log('\n📋 RESUMEN:');
  console.log(`   calcular_pavimento: ${resultado1 ? '✅ FUNCIONAL' : '❌ ERROR'}`);
  console.log(`   calcular_red_infraestructura: ${resultado2 ? '✅ FUNCIONAL' : '❌ ERROR'}`);
  console.log(`   calcular_muro_contencion: ${resultado3 ? '✅ FUNCIONAL' : '❌ ERROR'}`);

  if (resultado1 && resultado2 && resultado3) {
    console.log('\n🎉 TODOS LOS MOTORES FASE 3 ESTÁN FUNCIONALES');
  } else {
    console.log('\n⚠️  ALGUNOS MOTORES REQUIEREN ATENCIÓN');
  }
}

main().catch(console.error);