import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || '';
if (!DB_URL) throw new Error('SUPABASE_DB_URL or VITE_SUPABASE_DB_URL must be set');

async function comprehensiveCheck() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Connected to local Supabase PostgreSQL\n');

    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

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

    console.log('Critical tables status:');
    console.log('='.repeat(60));

    for (const tableName of criticalTables) {
      const exists = tables.rows.find(t => t.table_name === tableName);
      if (!exists) {
        console.log(`❌ ${tableName}: MISSING`);
        continue;
      }

      const cols = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      const colNames = cols.rows.map(r => r.column_name).join(', ');
      console.log(`✅ ${tableName}: ${cols.rows.length} columns`);
      console.log(`   ${colNames}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('Verification complete');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch (endError) {
      console.error('Error closing client:', endError);
    }
    process.exit(1);
  }
}

comprehensiveCheck();
