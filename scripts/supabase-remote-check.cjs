require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_DB_URL) {
  console.error('Falta SUPABASE_DB_URL en el ambiente.');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: SUPABASE_DB_URL });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT version, name, executed_at
      FROM supabase_migrations.schema_migrations
      ORDER BY version ASC
    `);
    console.log('Remote migrations:', res.rowCount);
    for (const row of res.rows) {
      console.log(row.version, '|', row.name, '|', row.executed_at);
    }
  } catch (e) {
    console.error('Error consultando migraciones remotas:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();