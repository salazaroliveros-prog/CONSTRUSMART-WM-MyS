import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54260/postgres';

// Tablas críticas que deben alinearse con schemas Zod
const CRITICAL_TABLES = [
  'erp_proyectos',
  'erp_presupuestos',
  'erp_ordenes_compra',
  'erp_movimientos',
  'erp_materiales',
  'erp_empleados',
  'erp_proveedores',
  'erp_avances',
  'erp_hitos',
  'erp_riesgos',
  'erp_bitacora',
  'erp_ordenes_cambio',
  'erp_notificaciones',
  'erp_publicaciones_muro',
  'erp_cotizaciones_negocio',
  'erp_cuentas_cobrar',
  'erp_cuentas_pagar',
  'erp_vales_salida',
  'erp_planos',
  'erp_rfis',
  'erp_submittals',
  'erp_activos',
  'erp_cuadros',
  'erp_pagos_proveedor',
  'erp_destajos',
  'erp_recepciones_almacen',
  'erp_centros_costo',
  'erp_plantillas_proyectos',
  'erp_error_log',
  'erp_audit_log',
  'erp_insumos_base',
  'erp_access_log',
  'erp_cajas_chicas',
  'erp_anticipos',
  'erp_amortizaciones',
  'erp_rendimientos_campo',
  'erp_bodega',
  'erp_documentos',
  'erp_permisos',
  'erp_checklist',
  'erp_configuracion',
  'erp_api_keys',
  'erp_proyecto_weather',
];

async function verifyDetailedAlignment() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('=== VERIFICACIÓN DE ALINEACIÓN DETALLADA ===\n');

    const issues = [];

    for (const tableName of CRITICAL_TABLES) {
      // Verificar si la tabla existe
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);

      if (!exists.rows[0].exists) {
        issues.push(`❌ ${tableName}: TABLA FALTANTE`);
        continue;
      }

      // Verificar si tiene RLS habilitado
      const rlsEnabled = await client.query(`
        SELECT relreplident 
        FROM pg_class 
        WHERE relname = $1
      `, [tableName]);

      // Verificar columnas estándar
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      const columnNames = columns.rows.map(c => c.column_name);

      // Verificar columnas estándar de auditoría
      const expectedAuditColumns = ['created_at', 'updated_at'];
      const missingAuditColumns = expectedAuditColumns.filter(col => !columnNames.includes(col));

      if (missingAuditColumns.length > 0) {
        issues.push(`⚠️ ${tableName}: faltan columnas de auditoría: ${missingAuditColumns.join(', ')}`);
      }

      // Verificar si tiene primary key
      const hasPk = columns.rows.some(c => c.column_name === 'id');
      if (!hasPk) {
        issues.push(`⚠️ ${tableName}: no tiene columna 'id'`);
      }

      console.log(`✅ ${tableName}: ${columns.rows.length} columnas`);
    }

    if (issues.length > 0) {
      console.log('\n=== PROBLEMAS ENCONTRADOS ===\n');
      for (const issue of issues) {
        console.log(issue);
      }
    } else {
      console.log('\n✅ Todas las tablas críticas están alineadas');
    }

    // Verificar tablas de motor de cálculo
    console.log('\n=== TABLAS DE MOTOR DE CÁLCULO ===\n');
    const calculationTables = [
      'erp_calculos_proyecto',
      'erp_reglas_factores',
      'erp_normativa_departamental',
      'erp_escalas_produccion',
      'erp_estacionalidad',
      'erp_historial_aplicacion_reglas',
      'erp_ajustes_estacionales_actividad',
      'erp_aplicacion_escalas',
      'erp_cumplimiento_normativo',
      'erp_snapshots_estado_calculo',
      'erp_comparaciones_calculos',
    ];

    for (const tableName of calculationTables) {
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);

      if (exists.rows[0].exists) {
        const columns = await client.query(`
          SELECT COUNT(*) as count
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
        `, [tableName]);
        console.log(`✅ ${tableName}: ${columns.rows[0].count} columnas`);
      } else {
        console.log(`❌ ${tableName}: FALTANTE`);
      }
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

verifyDetailedAlignment();