import pg from 'pg';
import { config } from 'dotenv';

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' });

const { Client } = pg;

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

async function verifySupabaseDB() {
  const supabaseUrl = process.env.SUPABASE_DB_URL;
  
  if (!supabaseUrl) {
    console.error('❌ Error: SUPABASE_DB_URL must be set in .env.local');
    console.error('Format: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres');
    process.exit(1);
  }

  const client = new Client({
    connectionString: supabaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');
    console.log('📋 SUPABASE DATABASE VERIFICATION REPORT\n');
    console.log('=' .repeat(60));

    // 1. Verificar tablas existentes
    console.log('\n📊 TABLE VERIFICATION');
    console.log('-'.repeat(60));
    
    const tablesQuery = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'erp_%'
      ORDER BY table_name
    `);

    const existingTables = tablesQuery.rows.map(row => row.table_name);
    const missingTables = EXPECTED_TABLES.filter(t => !existingTables.includes(t));
    const extraTables = existingTables.filter(t => !EXPECTED_TABLES.includes(t));

    console.log(`\nExpected tables: ${EXPECTED_TABLES.length}`);
    console.log(`Existing tables: ${existingTables.length}`);
    console.log(`Missing tables: ${missingTables.length}`);
    console.log(`Extra tables: ${extraTables.length}`);

    if (missingTables.length > 0) {
      console.log('\n❌ MISSING TABLES:');
      missingTables.forEach(table => console.log(`  - ${table}`));
    } else {
      console.log('\n✅ All expected tables exist');
    }

    if (extraTables.length > 0) {
      console.log('\n⚠️  EXTRA TABLES (not in expected list):');
      extraTables.forEach(table => console.log(`  - ${table}`));
    }

    // 2. Verificar RLS policies
    console.log('\n\n🛡️  RLS POLICIES VERIFICATION');
    console.log('-'.repeat(60));

    const rlsQuery = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'public'
      AND tablename LIKE 'erp_%'
      ORDER BY tablename, policyname
    `);

    const tablesWithPolicies = new Set(rlsQuery.rows.map(r => r.tablename));
    const tablesWithoutPolicies = existingTables.filter(t => !tablesWithPolicies.has(t));

    console.log(`\nTables with RLS policies: ${tablesWithPolicies.size}`);
    console.log(`Tables without RLS policies: ${tablesWithoutPolicies.length}`);

    if (tablesWithoutPolicies.length > 0) {
      console.log('\n⚠️  TABLES WITHOUT RLS POLICIES:');
      tablesWithoutPolicies.forEach(table => console.log(`  - ${table}`));
    } else {
      console.log('\n✅ All tables have RLS policies');
    }

    // Mostrar detalle de policies por tabla
    console.log('\n📋 RLS Policies Detail:');
    rlsQuery.rows.forEach(policy => {
      console.log(`  ${policy.tablename}.${policy.policyname}`);
      console.log(`    Command: ${policy.cmd}, Roles: ${policy.roles || 'public'}`);
    });

    // 3. Verificar Foreign Keys
    console.log('\n\n🔗 FOREIGN KEYS VERIFICATION');
    console.log('-'.repeat(60));

    const fkQuery = await client.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name LIKE 'erp_%'
      ORDER BY tc.table_name, tc.constraint_name
    `);

    console.log(`\nTotal foreign keys found: ${fkQuery.rows.length}`);

    // Agrupar por tabla
    const fksByTable = new Map<string, typeof fkQuery.rows>();
    fkQuery.rows.forEach(fk => {
      if (!fksByTable.has(fk.table_name)) {
        fksByTable.set(fk.table_name, []);
      }
      fksByTable.get(fk.table_name)!.push(fk);
    });

    console.log('\n📋 Foreign Keys by Table:');
    fksByTable.forEach((fks, tableName) => {
      console.log(`  ${tableName}:`);
      fks.forEach(fk => {
        console.log(`    ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    });

    // 4. Verificar Índices
    console.log('\n\n📇 INDEXES VERIFICATION');
    console.log('-'.repeat(60));

    const indexQuery = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename LIKE 'erp_%'
      ORDER BY tablename, indexname
    `);

    console.log(`\nTotal indexes found: ${indexQuery.rows.length}`);

    const indexesByTable = new Map<string, typeof indexQuery.rows>();
    indexQuery.rows.forEach(idx => {
      if (!indexesByTable.has(idx.tablename)) {
        indexesByTable.set(idx.tablename, []);
      }
      indexesByTable.get(idx.tablename)!.push(idx);
    });

    console.log('\n📋 Indexes by Table:');
    indexesByTable.forEach((indexes, tableName) => {
      console.log(`  ${tableName}: ${indexes.length} indexes`);
      indexes.forEach(idx => {
        console.log(`    - ${idx.indexname}`);
      });
    });

    // 5. Verificar Realtime
    console.log('\n\n📡 REALTIME VERIFICATION');
    console.log('-'.repeat(60));

    const realtimeQuery = await client.query(`
      SELECT 
        pubname,
        schemaname,
        tablename
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename LIKE 'erp_%'
      ORDER BY tablename
    `);

    const realtimeTables = realtimeQuery.rows.map(r => r.tablename);
    const tablesWithoutRealtime = existingTables.filter(t => !realtimeTables.includes(t));

    console.log(`\nTables in supabase_realtime: ${realtimeTables.length}`);
    console.log(`Tables without realtime: ${tablesWithoutRealtime.length}`);

    if (tablesWithoutRealtime.length > 0) {
      console.log('\n⚠️  TABLES WITHOUT REALTIME:');
      tablesWithoutRealtime.forEach(table => console.log(`  - ${table}`));
    } else {
      console.log('\n✅ All tables have realtime enabled');
    }

    // 6. Verificar Triggers
    console.log('\n\n⚡ TRIGGERS VERIFICATION');
    console.log('-'.repeat(60));

    const triggerQuery = await client.query(`
      SELECT 
        trigger_name,
        event_object_table,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
      AND event_object_table LIKE 'erp_%'
      ORDER BY event_object_table, trigger_name
    `);

    console.log(`\nTotal triggers found: ${triggerQuery.rows.length}`);

    const triggersByTable = new Map<string, typeof triggerQuery.rows>();
    triggerQuery.rows.forEach(trig => {
      if (!triggersByTable.has(trig.event_object_table)) {
        triggersByTable.set(trig.event_object_table, []);
      }
      triggersByTable.get(trig.event_object_table)!.push(trig);
    });

    console.log('\n📋 Triggers by Table:');
    triggersByTable.forEach((triggers, tableName) => {
      console.log(`  ${tableName}: ${triggers.length} triggers`);
      triggers.forEach(trig => {
        console.log(`    - ${trig.trigger_name} (${trig.event_manipulation} ${trig.action_timing})`);
      });
    });

    // 7. Verificar columnas críticas en tablas principales
    console.log('\n\n📋 CRITICAL COLUMNS VERIFICATION');
    console.log('-'.repeat(60));

    const criticalColumns = {
      'erp_proyectos': ['id', 'nombre', 'cliente_id', 'estado', 'avance_fisico', 'avance_financiero'],
      'erp_proyecto_weather': ['id', 'proyecto_id', 'weather_data', 'impact', 'construction_metrics'],
      'erp_publicaciones_muro': ['id', 'proyecto_id', 'contenido', 'autor_id']
    };

    for (const [table, expectedCols] of Object.entries(criticalColumns)) {
      if (!existingTables.includes(table)) {
        console.log(`\n⚠️  ${table}: Table doesn't exist, skipping column check`);
        continue;
      }

      const columnsQuery = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      const actualColumns = columnsQuery.rows.map(r => r.column_name);
      const missingCols = expectedCols.filter(c => !actualColumns.includes(c));

      if (missingCols.length > 0) {
        console.log(`\n❌ ${table}: Missing columns: ${missingCols.join(', ')}`);
      } else {
        console.log(`\n✅ ${table}: All critical columns present`);
      }
    }

    // 8. Resumen final
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));

    const totalChecks = 8;
    const passedChecks = [
      missingTables.length === 0,
      tablesWithoutPolicies.length === 0,
      fkQuery.rows.length > 0,
      indexQuery.rows.length > 0,
      realtimeTables.length > 0,
      triggerQuery.rows.length > 0
    ].filter(Boolean).length;

    console.log(`\n✅ Tables: ${existingTables.length}/${EXPECTED_TABLES.length} expected exist`);
    console.log(`✅ RLS Policies: ${tablesWithPolicies.size}/${existingTables.length} tables protected`);
    console.log(`✅ Foreign Keys: ${fkQuery.rows.length} relationships`);
    console.log(`✅ Indexes: ${indexQuery.rows.length} performance indexes`);
    console.log(`✅ Realtime: ${realtimeTables.length} tables with realtime`);
    console.log(`✅ Triggers: ${triggerQuery.rows.length} automation triggers`);

    if (missingTables.length === 0 && tablesWithoutPolicies.length === 0) {
      console.log('\n🎉 DATABASE IS READY FOR PRODUCTION');
    } else {
      console.log('\n⚠️  DATABASE REQUIRES ATTENTION - See issues above');
    }

    console.log('\n✅ VERIFICATION COMPLETE\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await client.end();
  }
}

verifySupabaseDB().catch(console.error);