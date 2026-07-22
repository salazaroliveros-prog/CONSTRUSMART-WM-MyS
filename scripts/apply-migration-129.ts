import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://neygzluxugodiwcuctbj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI2MDg5MiwiZXhwIjoyMDk1ODM2ODkyfQ.tExTkymdTg60mbD5wuikxnJMVryiT-9ld-6PhJhAFJM';

const MIGRATION_FILE = '000000000129_additional_indexes_and_fixes.sql';
const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

async function main() {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const filePath = path.join(MIGRATIONS_DIR, MIGRATION_FILE);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado: ${filePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, 'utf-8');
  console.log(`\n📄 Aplicando migración: ${MIGRATION_FILE}`);
  console.log(`   Tamaño: ${sql.length} chars`);
  console.log('   Conectando via RPC exec_sql...\n');

  const { data, error } = await sb.rpc('exec_sql', { sql });

  if (error) {
    console.error('❌ Error aplicando migración:', error.message);
    console.error('   Detalles:', error.details || '');
    process.exit(1);
  }

  console.log('✅ Migración aplicada correctamente');
  if (data) console.log('   Resultado:', JSON.stringify(data).slice(0, 200));

  console.log('\n📊 Verificando índices creados...');
  const { data: indexData, error: idxErr } = await sb.rpc('exec_sql', {
    sql: `SELECT tablename, count(*) as num_indexes
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename LIKE 'erp_%'
          GROUP BY tablename
          ORDER BY num_indexes DESC, tablename
          LIMIT 40`
  });

  if (idxErr) {
    console.warn('⚠️  No se pudo verificar índices:', idxErr.message);
  } else if (indexData) {
    console.log('\n  Tablas ERP con más índices:');
    const rows = Array.isArray(indexData) ? indexData : [];
    rows.forEach((r: any) => {
      console.log(`  ${r.tablename?.padEnd(45)} ${r.num_indexes} índices`);
    });
  }

  console.log('\n📊 Verificando índices de audit_log...');
  const { data: auditIdxData, error: auditIdxErr } = await sb.rpc('exec_sql', {
    sql: `SELECT indexname, indexdef
          FROM pg_indexes
          WHERE schemaname='public' AND tablename='erp_audit_log'
          ORDER BY indexname`
  });

  if (auditIdxErr) {
    console.warn('⚠️  No se pudo verificar índices de audit_log:', auditIdxErr.message);
  } else {
    console.log('  Índices en erp_audit_log:');
    const rows = Array.isArray(auditIdxData) ? auditIdxData : [];
    rows.forEach((r: any) => console.log(`    · ${r.indexname}`));
  }

  console.log('\n✅ Migración 129 completada exitosamente');
  process.exit(0);
}

main().catch(e => {
  console.error('❌ Error fatal:', e);
  process.exit(1);
});
