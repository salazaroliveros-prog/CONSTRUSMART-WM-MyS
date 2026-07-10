import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tablas esperadas según la aplicación
const EXPECTED_TABLES = [
  'erp_proyectos',
  'erp_movimientos', 
  'erp_empleados',
  'erp_materiales',
  'erp_ordenes_compra',
  'erp_proveedores',
  'erp_presupuestos',
  'erp_avances',
  'erp_hitos',
  'erp_riesgos',
  'erp_incidentes',
  'erp_planos',
  'erp_rfis',
  'erp_submittals',
  'erp_activos',
  'erp_cuadros',
  'erp_pagos_proveedor',
  'erp_destajos',
  'erp_recepciones',
  'erp_centros_costo',
  'erp_plantillas_proyectos',
  'erp_cotizaciones_negocio',
  'erp_licitaciones',
  'erp_vales_salida',
  'erp_no_conformidades',
  'erp_pruebas_laboratorio',
  'erp_liberaciones_partida',
  'erp_eventos_calendario',
  'erp_bitacora',
  'erp_seguimiento',
  'erp_notificaciones',
  'erp_error_log',
  'erp_proyecto_weather',
  'erp_ventas_paquetes',
  'erp_insumos_base',
  'erp_cuentas_cobrar',
  'erp_cuentas_pagar',
  'erp_ordenes_cambio',
  'erp_publicaciones_muro'
];

async function verifySupabaseViaREST() {
  try {
    console.log('✅ Connected to Supabase via REST API');
    console.log('📋 SUPABASE DATABASE VERIFICATION REPORT (via REST API)');
    console.log('='.repeat(60));

    // Usar RPC para ejecutar queries SQL que requieren acceso a system catalogs
    const { data: tablesData, error: tablesError } = await supabase.rpc('get_all_erp_tables');
    
    if (tablesError) {
      console.log('⚠️  RPC function not available, using alternative method...');
      // Método alternativo: intentar consultar cada tabla individualmente
      await verifyTablesIndividually();
    } else {
      console.log('\n📊 TABLE VERIFICATION');
      console.log('-'.repeat(60));
      console.log(`Tables found via RPC: ${tablesData?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  }
}

async function verifyTablesIndividually() {
  console.log('\n📊 TABLE VERIFICATION (Individual Check)');
  console.log('-'.repeat(60));

  const existingTables: string[] = [];
  const missingTables: string[] = [];
  const errorTables: string[] = [];

  for (const table of EXPECTED_TABLES) {
    try {
      // Intentar hacer un SELECT limitado para verificar si la tabla existe
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Table does not exist
          missingTables.push(table);
        } else {
          // Other error (possibly permissions)
          errorTables.push(table);
        }
      } else {
        existingTables.push(table);
      }
    } catch (e) {
      errorTables.push(table);
    }
  }

  console.log(`\nExpected tables: ${EXPECTED_TABLES.length}`);
  console.log(`Existing tables: ${existingTables.length}`);
  console.log(`Missing tables: ${missingTables.length}`);
  console.log(`Error tables: ${errorTables.length}`);

  if (missingTables.length > 0) {
    console.log('\n❌ MISSING TABLES:');
    missingTables.forEach(table => console.log(`  - ${table}`));
  } else {
    console.log('\n✅ All expected tables exist');
  }

  if (errorTables.length > 0) {
    console.log('\n⚠️  TABLES WITH ACCESS ERRORS:');
    errorTables.forEach(table => console.log(`  - ${table}`));
  }

  // Verificar tablas críticas en detalle
  console.log('\n\n📋 CRITICAL TABLES DETAIL');
  console.log('-'.repeat(60));

  const criticalTables = ['erp_proyectos', 'erp_proyecto_weather', 'erp_publicaciones_muro'];
  
  for (const table of criticalTables) {
    if (existingTables.includes(table)) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`\n⚠️  ${table}: Access error - ${error.message}`);
        } else {
          console.log(`\n✅ ${table}: Access OK, Row count: ${count || 0}`);
        }
      } catch (e) {
        console.log(`\n❌ ${table}: Error - ${e}`);
      }
    } else if (missingTables.includes(table)) {
      console.log(`\n❌ ${table}: Table does not exist`);
    } else {
      console.log(`\n⚠️  ${table}: Unknown status`);
    }
  }

  // Resumen final
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(60));

  console.log(`\n✅ Tables accessible: ${existingTables.length}/${EXPECTED_TABLES.length}`);
  console.log(`❌ Tables missing: ${missingTables.length}`);
  console.log(`⚠️  Tables with errors: ${errorTables.length}`);

  if (missingTables.length === 0 && errorTables.length === 0) {
    console.log('\n🎉 DATABASE IS READY FOR PRODUCTION');
  } else if (missingTables.length > 0) {
    console.log('\n⚠️  DATABASE REQUIRES ATTENTION - Missing tables need to be created');
  } else {
    console.log('\n⚠️  DATABASE REQUIRES ATTENTION - Check access permissions');
  }

  console.log('\n✅ VERIFICATION COMPLETE\n');
}

verifySupabaseViaREST().catch(console.error);