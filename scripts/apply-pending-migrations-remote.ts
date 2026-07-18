import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || '';
if (!DB_URL) throw new Error('SUPABASE_DB_URL or VITE_SUPABASE_DB_URL must be set');
const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

const FILES = [
  '000000000122_fix_rls_if_tables_exist.sql',
  '000000000123_create_erp_audit_log.sql',
  '000000000124_create_missing_tables.sql',
];

async function applyMigrations() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a Supabase remoto\n');

    for (const file of FILES) {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️ ${file}: no encontrado, salto`);
        continue;
      }
      const sql = fs.readFileSync(fullPath, 'utf-8');
      console.log(`▶ Ejecutando ${file}...`);
      await client.query(sql);
      console.log(`✅ ${file}: aplicado\n`);
    }

    console.log('✅ Migrations aplicadas correctamente');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

applyMigrations();