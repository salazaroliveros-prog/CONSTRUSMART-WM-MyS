import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || '';
if (!DB_URL) throw new Error('SUPABASE_DB_URL or VITE_SUPABASE_DB_URL must be set');

async function checkRemoteDB() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a Supabase remoto\n');

    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tableNames = tables.rows.map(r => r.table_name);
    console.log(`Tablas encontradas: ${tableNames.length}`);

    const criticalTables = [
      'erp_proyectos', 'erp_presupuestos', 'erp_ordenes_compra', 'erp_movimientos',
      'erp_materiales', 'erp_empleados', 'erp_proveedores', 'erp_avances',
      'erp_hitos', 'erp_riesgos', 'erp_bitacora', 'erp_incidentes',
      'erp_ordenes_cambio', 'erp_notificaciones', 'erp_publicaciones_muro',
      'erp_cotizaciones_negocio', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
      'erp_vales_salida', 'erp_planos', 'erp_rfis', 'erp_submittals',
      'erp_activos', 'erp_cuadros', 'erp_pagos_proveedor', 'erp_destajos',
      'erp_recepciones', 'erp_centros_costo', 'erp_plantillas_proyectos',
      'erp_error_log', 'erp_audit_log', 'erp_auditoria', 'erp_insumos_base'
    ];

    console.log('\n=== VERIFICACIÓN TABLAS CRÍTICAS ===\n');

    for (const tableName of criticalTables) {
      const exists = tableNames.find(t => t === tableName);
      if (!exists) {
        console.log(`❌ ${tableName}: FALTA`);
        continue;
      }

      const cols = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      console.log(`✅ ${tableName}: ${cols.rows.length} columnas`);
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

checkRemoteDB();