import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54260/postgres';

async function checkMigrations() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Verificar si existe la tabla de migraciones
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'supabase_migrations' 
        AND table_name = 'schema_migrations'
      );
    `);

    if (!checkTable.rows[0].exists) {
      console.log('⚠️ La tabla supabase_migrations.schema_migrations no existe');
      console.log('La base de datos no tiene migraciones de Supabase aplicadas\n');
      await client.end();
      return;
    }

    const migrations = await client.query(`
      SELECT version, name 
      FROM supabase_migrations.schema_migrations 
      ORDER BY version
    `);

    console.log(`Migraciones aplicadas: ${migrations.rows.length}\n`);

    for (const row of migrations.rows) {
      console.log(`✅ ${row.version}: ${row.name}`);
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

checkMigrations();