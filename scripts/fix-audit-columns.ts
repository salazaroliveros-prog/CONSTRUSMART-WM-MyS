import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54260/postgres';

async function fixAuditColumns() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('=== CORRECCIÓN DE COLUMNAS DE AUDITORÍA ===\n');

    // Corregir erp_error_log (falta updated_at)
    try {
      await client.query(`
        ALTER TABLE erp_error_log 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `);
      console.log('✅ erp_error_log: updated_at añadida');
    } catch (err) {
      console.log(`⚠️ erp_error_log: ${err.message}`);
    }

    // Corregir erp_audit_log (falta created_at, updated_at)
    try {
      await client.query(`
        ALTER TABLE erp_audit_log 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `);
      console.log('✅ erp_audit_log: created_at, updated_at añadidas');
    } catch (err) {
      console.log(`⚠️ erp_audit_log: ${err.message}`);
    }

    // Corregir erp_access_log (falta updated_at)
    try {
      await client.query(`
        ALTER TABLE erp_access_log 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `);
      console.log('✅ erp_access_log: updated_at añadida');
    } catch (err) {
      console.log(`⚠️ erp_access_log: ${err.message}`);
    }

    // Corregir erp_api_keys (falta updated_at)
    try {
      await client.query(`
        ALTER TABLE erp_api_keys 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `);
      console.log('✅ erp_api_keys: updated_at añadida');
    } catch (err) {
      console.log(`⚠️ erp_api_keys: ${err.message}`);
    }

    console.log('\n=== CORRECCIONES COMPLETADAS ===\n');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

fixAuditColumns();