import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54260/postgres';

async function checkSchemaAlignment() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Obtener todas las tablas ERP
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'erp_%'
      ORDER BY table_name
    `);

    console.log(`Tablas ERP encontradas: ${tables.rows.length}\n`);

    const tableDetails = [];

    for (const row of tables.rows) {
      const tableName = row.table_name;
      
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      tableDetails.push({
        table: tableName,
        columns: columns.rows.map(c => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable === 'YES',
          default: c.column_default
        }))
      });
    }

    console.log('=== DETALLE DE TABLAS ===\n');
    for (const detail of tableDetails) {
      console.log(`${detail.table}: ${detail.columns.length} columnas`);
      for (const col of detail.columns) {
        console.log(`  - ${col.name}: ${col.type}${col.nullable ? ' (nullable)' : ''}${col.default ? ` (default: ${col.default})` : ''}`);
      }
      console.log('');
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

checkSchemaAlignment();