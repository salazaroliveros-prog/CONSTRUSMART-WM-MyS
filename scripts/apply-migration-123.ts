import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || '';
if (!DB_URL) throw new Error('SUPABASE_DB_URL or VITE_SUPABASE_DB_URL must be set');

async function applyMigration123() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a Supabase remoto');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.erp_audit_log (
        id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        table_name text,
        record_id text,
        action text,
        old_data jsonb,
        new_data jsonb,
        changed_by uuid,
        changed_at timestamp without time zone,
        changed_fields jsonb
      );
    `);

    console.log('✅ Migration 123 aplicada: erp_audit_log creada/verificada');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

applyMigration123();