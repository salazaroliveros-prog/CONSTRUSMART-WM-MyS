import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const DB_URL = 'postgresql://postgres:AngelDario2027@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres';
const SUPABASE_URL = 'https://neygzluxugodiwcuctbj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI2MDg5MiwiZXhwIjoyMDk1ODM2ODkyfQ.tExTkymdTg60mbD5wuikxnJMVryiT-9ld-6PhJhAFJM';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjA4OTIsImV4cCI6MjA5NTgzNjg5Mn0.IfCMtFbZYL0GDgV_3zwqBmqjCNf3PZfYS-SvbRGXhY0';

interface ValidationResult {
  category: string;
  check: string;
  status: 'OK' | 'WARN' | 'ERROR' | 'SKIP';
  detail?: string;
}

const results: ValidationResult[] = [];

function log(r: ValidationResult) {
  results.push(r);
  const icon = r.status === 'OK' ? '✅' : r.status === 'WARN' ? '⚠️' : r.status === 'ERROR' ? '❌' : '⏭';
  console.log(`${icon} [${r.category}] ${r.check}${r.detail ? ': ' + r.detail : ''}`);
}

async function validatePgConnection(client: pg.Client): Promise<void> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  VALIDACIÓN VÍA pg (conexión directa)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const versionRow = await client.query('SELECT version(), current_database(), pg_size_pretty(pg_database_size(current_database())) as db_size');
  const v = versionRow.rows[0];
  log({ category: 'CONEXIÓN', check: 'PostgreSQL version', status: 'OK', detail: v.version.split(' ')[1] });
  log({ category: 'CONEXIÓN', check: 'Database', status: 'OK', detail: v.current_database });
  log({ category: 'CONEXIÓN', check: 'Database size', status: 'OK', detail: v.db_size });
}

async function validateTables(client: pg.Client): Promise<string[]> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TABLAS Y ESQUEMA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const res = await client.query<{ table_name: string; row_estimate: number; total_size: string }>(
    `SELECT
      t.table_name,
      c.reltuples::bigint AS row_estimate,
      pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name))) AS total_size
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
    ORDER BY pg_total_relation_size(quote_ident(t.table_name)) DESC NULLS LAST`
  );

  const allTables = res.rows.map(r => r.table_name);
  log({ category: 'TABLAS', check: 'Total tablas public', status: 'OK', detail: String(allTables.length) });

  const erpTables = allTables.filter(t => t.startsWith('erp_'));
  log({ category: 'TABLAS', check: 'Tablas ERP (erp_*)', status: 'OK', detail: String(erpTables.length) });

  console.log('\n  Tablas ERP (tamaño DESC):');
  res.rows
    .filter(r => r.table_name.startsWith('erp_'))
    .slice(0, 30)
    .forEach(r => {
      console.log(`    ${r.table_name.padEnd(45)} rows≈${String(r.row_estimate || 0).padStart(8)}  ${r.total_size}`);
    });

  const requiredTables = [
    'erp_proyectos', 'erp_presupuestos', 'erp_movimientos', 'erp_empleados',
    'erp_materiales', 'erp_ordenes_compra', 'erp_proveedores', 'erp_hitos',
    'erp_riesgos', 'erp_crm_pipeline', 'erp_plantillas_proyectos', 'erp_cotizaciones',
    'erp_cuentas_cobrar', 'erp_cuentas_pagar', 'erp_error_log', 'erp_api_keys',
    'erp_audit_log', 'erp_activos', 'erp_destajos', 'erp_recepciones',
    'erp_cajas_chicas', 'erp_anticipos', 'erp_checklist', 'erp_configuracion',
    'erp_permisos', 'erp_documentos', 'erp_ordenes_cambio', 'erp_avances',
    'erp_notificaciones', 'erp_bodega'
  ];

  console.log('\n  Verificación tablas requeridas:');
  for (const t of requiredTables) {
    if (allTables.includes(t)) {
      log({ category: 'TABLA_REQ', check: t, status: 'OK' });
    } else {
      log({ category: 'TABLA_REQ', check: t, status: 'ERROR', detail: 'TABLA NO EXISTE' });
    }
  }

  return allTables;
}

async function validateRLS(client: pg.Client, tables: string[]): Promise<void> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ROW LEVEL SECURITY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const rlsRes = await client.query<{ relname: string; rowsecurity: boolean }>(
    `SELECT c.relname, c.relrowsecurity AS rowsecurity
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
     ORDER BY c.relname`
  );

  const rlsMap = new Map(rlsRes.rows.map(r => [r.relname, r.rowsecurity]));

  const erpTables = tables.filter(t => t.startsWith('erp_'));
  const withRLS = erpTables.filter(t => rlsMap.get(t) === true);
  const withoutRLS = erpTables.filter(t => rlsMap.get(t) === false);

  log({ category: 'RLS', check: 'Tablas ERP con RLS habilitado', status: withoutRLS.length === 0 ? 'OK' : 'WARN', detail: `${withRLS.length}/${erpTables.length}` });

  if (withoutRLS.length > 0) {
    console.log('\n  ⚠️  Tablas SIN RLS:');
    withoutRLS.forEach(t => {
      log({ category: 'RLS', check: t, status: 'WARN', detail: 'SIN RLS' });
    });
  }

  const policiesRes = await client.query<{ tablename: string; count: string }>(
    `SELECT tablename, count(*) as count
     FROM pg_policies
     WHERE schemaname = 'public'
     GROUP BY tablename
     ORDER BY tablename`
  );

  log({ category: 'RLS', check: 'Tablas con políticas', status: 'OK', detail: String(policiesRes.rows.length) });
}

async function validateIndexes(client: pg.Client): Promise<void> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ÍNDICES EXISTENTES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const idxRes = await client.query<{ tablename: string; indexname: string; indexdef: string }>(
    `SELECT tablename, indexname, indexdef
     FROM pg_indexes
     WHERE schemaname = 'public'
       AND tablename LIKE 'erp_%'
     ORDER BY tablename, indexname`
  );

  log({ category: 'ÍNDICES', check: 'Total índices ERP', status: 'OK', detail: String(idxRes.rows.length) });

  const byTable = new Map<string, string[]>();
  for (const row of idxRes.rows) {
    const list = byTable.get(row.tablename) || [];
    list.push(row.indexname);
    byTable.set(row.tablename, list);
  }

  console.log('\n  Índices por tabla:');
  for (const [tbl, idxs] of byTable) {
    console.log(`    ${tbl.padEnd(45)} ${idxs.length} índice(s)`);
    idxs.forEach(i => console.log(`      · ${i}`));
  }

  const unusedRes = await client.query<{ relname: string; indexrelname: string; idx_scan: string }>(
    `SELECT s.relname, s.indexrelname, s.idx_scan
     FROM pg_stat_user_indexes s
     JOIN pg_index i ON i.indexrelid = s.indexrelid
     WHERE s.schemaname = 'public'
       AND s.relname LIKE 'erp_%'
       AND s.idx_scan = 0
       AND i.indisprimary = false
       AND i.indisunique = false
     ORDER BY s.relname`
  );

  if (unusedRes.rows.length > 0) {
    log({ category: 'ÍNDICES', check: 'Índices no usados (0 scans)', status: 'WARN', detail: String(unusedRes.rows.length) });
    unusedRes.rows.forEach(r => {
      console.log(`    ⚠️  ${r.relname} → ${r.indexrelname} (${r.idx_scan} scans)`);
    });
  } else {
    log({ category: 'ÍNDICES', check: 'Índices no usados', status: 'OK', detail: 'Ninguno' });
  }

  const fkNoIdxRes = await client.query<{ table_name: string; column_name: string }>(
    `SELECT
        tc.table_name,
        kcu.column_name
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
     JOIN information_schema.referential_constraints rc
       ON tc.constraint_name = rc.constraint_name
       AND tc.table_schema = rc.constraint_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_schema = 'public'
       AND tc.table_name LIKE 'erp_%'
       AND NOT EXISTS (
         SELECT 1 FROM pg_indexes pi2
         WHERE pi2.schemaname = 'public'
           AND pi2.tablename = tc.table_name
           AND pi2.indexdef LIKE '%' || kcu.column_name || '%'
       )
     ORDER BY tc.table_name, kcu.column_name`
  );

  if (fkNoIdxRes.rows.length > 0) {
    log({ category: 'ÍNDICES', check: 'FKs sin índice', status: 'WARN', detail: String(fkNoIdxRes.rows.length) });
    fkNoIdxRes.rows.forEach(r => {
      console.log(`    ⚠️  FK sin índice: ${r.table_name}.${r.column_name}`);
    });
  } else {
    log({ category: 'ÍNDICES', check: 'FKs sin índice', status: 'OK', detail: 'Todas tienen índice' });
  }
}

async function validateMigrations(client: pg.Client): Promise<void> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  MIGRACIONES SUPABASE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const migRes = await client.query<{ version: string; inserted_at: string }>(
      `SELECT version, inserted_at
       FROM supabase_migrations.schema_migrations
       ORDER BY inserted_at DESC
       LIMIT 10`
    );
    log({ category: 'MIGRACIONES', check: 'schema_migrations accesible', status: 'OK' });
    console.log('\n  Últimas 10 migraciones aplicadas:');
    migRes.rows.forEach(r => {
      console.log(`    ${r.version}  (${new Date(r.inserted_at).toISOString().split('T')[0]})`);
    });
  } catch (e: any) {
    log({ category: 'MIGRACIONES', check: 'schema_migrations', status: 'WARN', detail: e.message });

    const localMigs = fs.readdirSync(path.join(process.cwd(), 'supabase', 'migrations'))
      .filter(f => f.endsWith('.sql'))
      .sort();
    log({ category: 'MIGRACIONES', check: 'Migraciones locales', status: 'OK', detail: `${localMigs.length} archivos` });
    console.log(`    Última: ${localMigs[localMigs.length - 1]}`);
  }
}

async function validateSupabaseClient(): Promise<void> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  VALIDACIÓN VÍA @supabase/supabase-js');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!SERVICE_KEY) {
    log({ category: 'SUPABASE_JS', check: 'Service role key', status: 'WARN', detail: 'No configurada — usando anon key' });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY || ANON_KEY);

  const { data: proyectos, error: pErr } = await supabase
    .from('erp_proyectos')
    .select('id, nombre, estado')
    .limit(5);

  if (pErr) {
    log({ category: 'SUPABASE_JS', check: 'SELECT erp_proyectos', status: 'ERROR', detail: pErr.message });
  } else {
    log({ category: 'SUPABASE_JS', check: 'SELECT erp_proyectos', status: 'OK', detail: `${proyectos?.length || 0} filas (sample)` });
  }

  const { data: mats, error: mErr } = await supabase
    .from('erp_materiales')
    .select('id')
    .limit(1);

  if (mErr) {
    log({ category: 'SUPABASE_JS', check: 'SELECT erp_materiales', status: 'ERROR', detail: mErr.message });
  } else {
    log({ category: 'SUPABASE_JS', check: 'SELECT erp_materiales', status: 'OK' });
  }

  const { data: movs, error: movErr } = await supabase
    .from('erp_movimientos')
    .select('id, tipo, fecha')
    .order('fecha', { ascending: false })
    .limit(3);

  if (movErr) {
    log({ category: 'SUPABASE_JS', check: 'SELECT erp_movimientos (ORDER BY fecha)', status: 'ERROR', detail: movErr.message });
  } else {
    log({ category: 'SUPABASE_JS', check: 'SELECT erp_movimientos (ORDER BY fecha)', status: 'OK', detail: `${movs?.length || 0} filas` });
  }

  const { data: auditData, error: auditErr } = await supabase
    .from('erp_audit_log')
    .select('id')
    .limit(1);

  if (auditErr) {
    log({ category: 'SUPABASE_JS', check: 'SELECT erp_audit_log', status: 'WARN', detail: auditErr.message });
  } else {
    log({ category: 'SUPABASE_JS', check: 'SELECT erp_audit_log', status: 'OK' });
  }
}

async function analyzeQueryPerformance(client: pg.Client): Promise<void> {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ANÁLISIS DE PERFORMANCE (EXPLAIN)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const queries = [
    {
      name: 'proyectos por estado',
      sql: `EXPLAIN (FORMAT TEXT) SELECT id, nombre, estado FROM erp_proyectos WHERE estado = 'activo' ORDER BY created_at DESC LIMIT 20`
    },
    {
      name: 'movimientos por proyecto+tipo+fecha',
      sql: `EXPLAIN (FORMAT TEXT) SELECT id, monto, tipo, fecha FROM erp_movimientos WHERE proyecto_id = '00000000-0000-0000-0000-000000000001' AND tipo = 'egreso' ORDER BY fecha DESC LIMIT 50`
    },
    {
      name: 'hitos por proyecto+estado',
      sql: `EXPLAIN (FORMAT TEXT) SELECT id, nombre, estado FROM erp_hitos WHERE proyecto_id = '00000000-0000-0000-0000-000000000001' AND estado = 'pendiente'`
    },
    {
      name: 'ordenes_compra pendientes',
      sql: `EXPLAIN (FORMAT TEXT) SELECT id, estado FROM erp_ordenes_compra WHERE estado IN ('borrador', 'aprobacion') LIMIT 20`
    }
  ];

  for (const q of queries) {
    try {
      const res = await client.query(q.sql);
      const plan = res.rows.map((r: any) => Object.values(r)[0]).join('\n');
      const usesIndex = plan.includes('Index') || plan.includes('Bitmap');
      log({
        category: 'EXPLAIN',
        check: q.name,
        status: usesIndex ? 'OK' : 'WARN',
        detail: usesIndex ? 'usa índice' : 'FULL SCAN — considera agregar índice'
      });
      if (!usesIndex) {
        console.log(`    Plan:\n${plan.split('\n').map((l: string) => '      ' + l).join('\n')}`);
      }
    } catch (e: any) {
      log({ category: 'EXPLAIN', check: q.name, status: 'SKIP', detail: e.message.split('\n')[0] });
    }
  }
}

function printSummary(): void {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  RESUMEN FINAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const byStatus = {
    OK: results.filter(r => r.status === 'OK').length,
    WARN: results.filter(r => r.status === 'WARN').length,
    ERROR: results.filter(r => r.status === 'ERROR').length,
    SKIP: results.filter(r => r.status === 'SKIP').length,
  };

  console.log(`  ✅ OK:    ${byStatus.OK}`);
  console.log(`  ⚠️  WARN:  ${byStatus.WARN}`);
  console.log(`  ❌ ERROR: ${byStatus.ERROR}`);
  console.log(`  ⏭  SKIP:  ${byStatus.SKIP}`);

  if (byStatus.ERROR > 0) {
    console.log('\n  Errores detectados:');
    results.filter(r => r.status === 'ERROR').forEach(r => {
      console.log(`    ❌ [${r.category}] ${r.check}: ${r.detail}`);
    });
  }

  if (byStatus.WARN > 0) {
    console.log('\n  Advertencias:');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`    ⚠️  [${r.category}] ${r.check}: ${r.detail || ''}`);
    });
  }

  console.log('\n  Estado general:', byStatus.ERROR === 0 ? '✅ SALUDABLE' : '❌ REQUIERE ATENCIÓN');
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  CONSTRUSMART — Validación Supabase DB   ║');
  console.log(`║  ${new Date().toISOString()}  ║`);
  console.log('╚══════════════════════════════════════════╝');

  const client = new pg.Client({
    connectionString: DB_URL,
    connectionTimeoutMillis: 30000,
    query_timeout: 15000,
  });

  try {
    await client.connect();
    log({ category: 'CONEXIÓN', check: 'pg direct connection', status: 'OK', detail: DB_URL.split('@')[1] });

    await validatePgConnection(client);
    const tables = await validateTables(client);
    await validateRLS(client, tables);
    await validateIndexes(client);
    await validateMigrations(client);
    await validateSupabaseClient();
    await analyzeQueryPerformance(client);

    printSummary();
    await client.end();
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Error crítico:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

main();
