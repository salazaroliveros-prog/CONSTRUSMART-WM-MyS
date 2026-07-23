import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function vacuumAnalyzeDatabase() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('=== VACUUM Y ANALYZE DE BASE DE DATOS ===\n');

    // VACUUM ANALYZE de todas las tablas ERP
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'erp_%'
      ORDER BY table_name
    `);

    console.log(`Optimizando ${tables.rows.length} tablas ERP...\n`);

    for (const row of tables.rows) {
      const tableName = row.table_name;
      try {
        await client.query(`VACUUM ANALYZE ${tableName}`);
        console.log(`✅ ${tableName}: optimizada`);
      } catch (err) {
        console.log(`⚠️ ${tableName}: ${err.message}`);
      }
    }

    // ANALYZE general
    await client.query('ANALYZE');
    console.log('\n✅ ANALYZE general completado');

    // Verificar tamaño de la base de datos
    const dbSize = await client.query(`
      SELECT pg_size_pretty(pg_database_size('postgres')) as size
    `);

    console.log(`\n📊 Tamaño de la base de datos: ${dbSize.rows[0].size}`);

    // Verificar fragmentación
    const fragmentation = await client.query(`
      SELECT schemaname, relname, n_dead_tup, n_live_tup,
             ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND relname LIKE 'erp_%'
        AND n_dead_tup > 0
      ORDER BY dead_ratio DESC
      LIMIT 10
    `);

    if (fragmentation.rows.length > 0) {
      console.log('\n⚠️ Tablas con alta fragmentación:');
      for (const row of fragmentation.rows) {
        console.log(`   ${row.relname}: ${row.dead_ratio}% tuples muertos`);
      }
    } else {
      console.log('\n✅ No hay fragmentación significativa');
    }

    console.log('\n=== OPTIMIZACIÓN COMPLETADA ===\n');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

vacuumAnalyzeDatabase();