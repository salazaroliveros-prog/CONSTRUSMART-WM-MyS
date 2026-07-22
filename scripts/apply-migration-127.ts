import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:AngelDario2027@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres';
const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

const FILE = '000000000127_strategic_composite_indexes.sql';

async function applyMigration() {
  const client = new pg.Client({
    connectionString: DB_URL,
    connectionTimeoutMillis: 30000,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a Supabase remoto\n');

    const fullPath = path.join(MIGRATIONS_DIR, FILE);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Archivo no encontrado: ${fullPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(fullPath, 'utf-8');
    console.log(`▶ Ejecutando ${FILE}...`);
    await client.query(sql);
    console.log(`✅ ${FILE}: aplicado correctamente\n`);

    console.log('✅ Migración 127 (índices compuestos estratégicos) aplicada en Supabase remoto');
    await client.end();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

applyMigration();
