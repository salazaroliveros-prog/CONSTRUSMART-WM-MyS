import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54260/postgres';
const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

async function checkPendingMigrations() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // Obtener migraciones aplicadas
    const appliedResult = await client.query(`
      SELECT version 
      FROM supabase_migrations.schema_migrations 
      ORDER BY version
    `);

    const appliedVersions = new Set(appliedResult.rows.map(r => r.version));
    console.log(`Migraciones aplicadas: ${appliedVersions.size}\n`);

    // Obtener archivos de migración
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Archivos de migración: ${migrationFiles.length}\n`);

    const pending = [];

    for (const file of migrationFiles) {
      const version = file.split('_')[0];
      if (!appliedVersions.has(version)) {
        pending.push(file);
      }
    }

    if (pending.length === 0) {
      console.log('✅ Todas las migraciones están aplicadas');
    } else {
      console.log(`⚠️ Migraciones pendientes: ${pending.length}\n`);
      for (const file of pending) {
        console.log(`❌ ${file}`);
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

checkPendingMigrations();