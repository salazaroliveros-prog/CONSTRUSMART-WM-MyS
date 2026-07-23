import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function verifyEmptyTables() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('=== VERIFICANDO TABLAS VACÍAS ===\n');

    const allTablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'erp_%'
      ORDER BY table_name
    `);

    const allTables = allTablesResult.rows.map(row => row.table_name);
    console.log(`📊 Verificando ${allTables.length} tablas ERP\n`);

    let tablesWithData = [];
    let totalRecords = 0;

    for (const tableName of allTables) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      const count = parseInt(countResult.rows[0].count);

      if (count > 0) {
        tablesWithData.push({ table: tableName, count });
        totalRecords += count;
        console.log(`⚠️  ${tableName}: ${count} registros`);
      }
    }

    if (tablesWithData.length === 0) {
      console.log('✅ Todas las tablas ERP están vacías');
    } else {
      console.log(`\n⚠️ ${tablesWithData.length} tablas tienen datos (${totalRecords} registros totales)`);
    }

    // Excepciones: tablas de configuración/reference que pueden tener datos base
    const allowedTables = [
      'erp_departamentos_gt',
      'erp_municipios_gt',
    ];

    const unexpectedData = tablesWithData.filter(t => !allowedTables.includes(t.table));

    if (unexpectedData.length === 0) {
      console.log('\n✅ BASE DE DATOS LIMPIA - Solo datos de referencia permitidos');
    } else {
      console.log('\n⚠️ Tablas con datos inesperados:');
      unexpectedData.forEach(t => console.log(`   - ${t.table}: ${t.count} registros`));
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

verifyEmptyTables();
