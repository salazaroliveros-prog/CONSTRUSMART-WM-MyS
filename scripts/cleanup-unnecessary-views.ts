import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

// Vistas que se pueden eliminar (son temporales o duplicadas)
const UNNECESSARY_VIEWS = [
  'erp_audit_log_summary',
  'erp_error_log_recent',
  'erp_error_log_stats',
  'erp_error_logs',
];

async function cleanupUnnecessaryViews() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('=== LIMPIEZA DE VISTAS INNECESARIAS ===\n');

    for (const viewName of UNNECESSARY_VIEWS) {
      try {
        // Verificar si es una vista
        const isView = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.views
            WHERE table_schema = 'public'
              AND table_name = $1
          );
        `, [viewName]);

        if (!isView.rows[0].exists) {
          console.log(`⏭️ ${viewName}: no es una vista o no existe, salto`);
          continue;
        }

        // Eliminar la vista
        await client.query(`DROP VIEW IF EXISTS ${viewName} CASCADE`);
        console.log(`✅ ${viewName}: vista eliminada`);
      } catch (err) {
        console.log(`❌ ${viewName}: error - ${err.message}`);
      }
    }

    console.log('\n=== VERIFICACIÓN FINAL ===\n');

    // Verificar tablas ERP reales
    const realTables = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables t
      JOIN pg_class c ON c.relname = t.table_name
      WHERE t.table_schema = 'public'
        AND t.table_name LIKE 'erp_%'
        AND c.relkind = 'r'
    `);

    console.log(`Tablas ERP reales: ${realTables.rows[0].count}`);

    // Verificar vistas ERP
    const views = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name LIKE 'erp_%'
    `);

    console.log(`Vistas ERP: ${views.rows[0].count}`);

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

cleanupUnnecessaryViews();