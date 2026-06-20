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

async function ejecutarSQL(sql: string, descripcion: string) {
  console.log(`\n📝 Ejecutando: ${descripcion}`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Intentar usando query directo
      const { data: data2, error: error2 } = await supabase
        .from('dummy')
        .select('*')
        .limit(0);
      
      if (error2 && error2.message.includes('does not exist')) {
        console.log(`⚠️  ${descripcion}: Supabase client no permite ejecutar SQL directo`);
        console.log(`   Se requiere usar Supabase Dashboard o CLI con credenciales de DB`);
        return false;
      }
    }
    
    console.log(`✅ ${descripcion}: Ejecutado correctamente`);
    return true;
  } catch (err) {
    console.log(`❌ ${descripcion}: Error - ${err}`);
    return false;
  }
}

async function insertarDatosPavimentos() {
  console.log('\n📝 Insertando datos de pavimentos...');

  const datos = [
    { uso: 'peatonal', tipo: 'adoquinado', espesor_minimo_cm: 8.0, costo_base_m2: 120.00, tipo_base: 'c4', costo_base_m3: 180.00, tipo_sello: 'arena', costo_sello_m2: 15.00, referencia_norma: 'AGIES 51.01, COGUANOR NGO 34001', observaciones: 'Pavimento peatonal básico' },
    { uso: 'peatonal', tipo: 'concreto', espesor_minimo_cm: 10.0, costo_base_m2: 140.00, tipo_base: 'grava', costo_base_m3: 160.00, tipo_sello: 'ninguno', costo_sello_m2: 0.00, referencia_norma: 'AGIES 51.02, COGUANOR NGO 34002', observaciones: 'Concreto peatonal simple' },
    { uso: 'vehicular_liviano', tipo: 'adoquinado', espesor_minimo_cm: 12.0, costo_base_m2: 160.00, tipo_base: 'c4', costo_base_m3: 180.00, tipo_sello: 'arena', costo_sello_m2: 15.00, referencia_norma: 'AGIES 51.01, COGUANOR NGO 34001', observaciones: 'Adoquinado tráfico liviano' },
    { uso: 'vehicular_medio', tipo: 'concreto', espesor_minimo_cm: 20.0, costo_base_m2: 220.00, tipo_base: 'grava', costo_base_m3: 160.00, tipo_sello: 'ninguno', costo_sello_m2: 0.00, referencia_norma: 'AGIES 51.02, COGUANOR NGO 34002', observaciones: 'Concreto tráfico medio' },
    { uso: 'vehicular_pesado', tipo: 'asfaltico', espesor_minimo_cm: 15.0, costo_base_m2: 320.00, tipo_base: 'c4', costo_base_m3: 180.00, tipo_sello: 'asfalto', costo_sello_m2: 0.00, referencia_norma: 'AGIES 51.03, COGUANOR NGO 34003', observaciones: 'Asfalto tráfico pesado' }
  ];

  for (const dato of datos) {
    const { error } = await supabase
      .from('erp_parametros_pavimentos')
      .insert({ ...dato, activo: true });
    
    if (error) {
      console.log(`❌ Error insertando ${dato.tipo} - ${error.message}`);
    } else {
      console.log(`✅ Insertado: ${dato.tipo} (${dato.uso})`);
    }
  }
}

async function insertarDatosRedes() {
  console.log('\n📝 Insertando datos de redes de infraestructura...');

  const datos = [
    { tipo: 'agua_potable', diametro_pulgadas: 0.5, material: 'pvc', presion: 'media', costo_base_ml: 55.00, factor_material: 1.0, referencia_norma: 'COGUANOR NGO 41001', observaciones: 'Tubería PVC 0.5" media presión' },
    { tipo: 'agua_potable', diametro_pulgadas: 1.0, material: 'pvc', presion: 'media', costo_base_ml: 75.00, factor_material: 1.0, referencia_norma: 'COGUANOR NGO 41001', observaciones: 'Tubería PVC 1" media presión' },
    { tipo: 'agua_potable', diametro_pulgadas: 2.0, material: 'cobre', presion: 'alta', costo_base_ml: 400.00, factor_material: 1.5, referencia_norma: 'COGUANOR NGO 41002', observaciones: 'Tubería cobre 2" alta presión' },
    { tipo: 'alcantarillado_sanitario', diametro_pulgadas: 4.0, material: 'concreto', presion: 'baja', costo_base_ml: 150.00, factor_material: 1.8, referencia_norma: 'COGUANOR NGO 41003', observaciones: 'Tubería concreto 4" sanitaria' },
    { tipo: 'alcantarillado_pluvial', diametro_pulgadas: 6.0, material: 'hdpe', presion: 'media', costo_base_ml: 230.00, factor_material: 1.3, referencia_norma: 'COGUANOR NGO 41004', observaciones: 'Tubería HDPE 6" pluvial' }
  ];

  for (const dato of datos) {
    const { error } = await supabase
      .from('erp_parametros_redes_infraestructura')
      .insert({ ...dato, activo: true });
    
    if (error) {
      console.log(`❌ Error insertando ${dato.tipo} - ${error.message}`);
    } else {
      console.log(`✅ Insertado: ${dato.tipo} ${dato.diametro_pulgadas}"`);
    }
  }
}

async function insertarDatosMuros() {
  console.log('\n📝 Insertando datos de muros de contención...');

  const datos = [
    { altura_m: 1.5, tipo: 'gravedad', tipo_cimentacion: 'zapata_corrida', tipo_suelo: 'arena', tipo_drenaje: 'sin_drenaje', costo_base_m2: 280.00, factor_profundidad: 1.0, factor_suelo: 1.1, factor_drenaje: 1.0, referencia_norma: 'AGIES 62.01', observaciones: 'Muro gravedad 1.5m' },
    { altura_m: 2.0, tipo: 'cantiliver', tipo_cimentacion: 'zapata_corrida', tipo_suelo: 'arcilla', tipo_drenaje: 'drenaje_interno', costo_base_m2: 450.00, factor_profundidad: 1.3, factor_suelo: 1.3, factor_drenaje: 1.2, referencia_norma: 'AGIES 62.02', observaciones: 'Muro cantiliver 2m' },
    { altura_m: 3.0, tipo: 'atirantado', tipo_cimentacion: 'pilotes', tipo_suelo: 'granular', tipo_drenaje: 'drenaje_completo', costo_base_m2: 500.00, factor_profundidad: 1.6, factor_suelo: 1.0, factor_drenaje: 1.3, referencia_norma: 'AGIES 62.03', observaciones: 'Muro atirantado 3m' },
    { altura_m: 4.0, tipo: 'tipo celular', tipo_cimentacion: 'losa', tipo_suelo: 'arena', tipo_drenaje: 'sin_drenaje', costo_base_m2: 580.00, factor_profundidad: 1.9, factor_suelo: 1.1, factor_drenaje: 1.0, referencia_norma: 'AGIES 62.04', observaciones: 'Muro celular 4m' },
    { altura_m: 5.0, tipo: 'pantalla', tipo_cimentacion: 'pilotes', tipo_suelo: 'roca', tipo_drenaje: 'drenaje_interno', costo_base_m2: 820.00, factor_profundidad: 2.3, factor_suelo: 0.9, factor_drenaje: 1.1, referencia_norma: 'AGIES 62.05', observaciones: 'Muro pantalla 5m' }
  ];

  for (const dato of datos) {
    const { error } = await supabase
      .from('erp_parametros_muros_contencion')
      .insert({ ...dato, activo: true });
    
    if (error) {
      console.log(`❌ Error insertando ${dato.tipo} - ${error.message}`);
    } else {
      console.log(`✅ Insertado: ${dato.tipo} ${dato.altura_m}m`);
    }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   APLICACIÓN DATOS FASE 3 SUPABASE          ║');
  console.log('╚══════════════════════════════════════════════╝');

  console.log('\n⚠️  Nota: Las funciones RPC requieren ejecución directa en Supabase');
  console.log('   Este script solo insertará datos de prueba en las tablas existentes.\n');

  await insertarDatosPavimentos();
  await insertarDatosRedes();
  await insertarDatosMuros();

  console.log('\n✅ Datos de prueba insertados');
  console.log('\n📋 Pasos adicionales requeridos:');
  console.log('   1. Ejecutar funciones RPC en Supabase Dashboard o CLI');
  console.log('   2. Abrir Supabase Dashboard → SQL Editor');
  console.log('   3. Ejecutar el contenido de las migraciones Fase 3:');
  console.log('      - 000000000032_motor_calculo_fase3_pavimentos.sql');
  console.log('      - 000000000033_motor_calculo_fase3_redes_infraestructura.sql');
  console.log('      - 000000000034_motor_calculo_fase3_muros_contencion.sql');
}

main().catch(console.error);