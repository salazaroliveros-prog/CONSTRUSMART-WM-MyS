import pg from 'pg';
import { TABLE_MAP } from '../src/erp/constants/table-mappings';

const DB_URL = 'postgresql://postgres:AngelDario2027@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres';

async function auditSupabase() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();

  console.log('✅ Conectado a Supabase remoto\n');

  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  const tableNames = new Set(tables.rows.map(r => r.table_name));
  console.log(`Tablas totales en public: ${tableNames.size}\n`);

  console.log('=== 1) TABLAS ESPERADAS POR LA APP vs REMOTO ===\n');
  const expectedTables = Object.keys(TABLE_MAP);
  const missing: string[] = [];
  const extra: string[] = [];
  for (const t of expectedTables) {
    if (!tableNames.has(t)) missing.push(t);
  }
  for (const t of tableNames) {
    if (t.startsWith('erp_') && !expectedTables.includes(t)) extra.push(t);
  }
  if (missing.length === 0) console.log('✅ Ninguna tabla esperada falta en Supabase');
  else console.log('❌ Tablas esperadas faltantes:', missing.join(', '));
  if (extra.length === 0) console.log('✅ Sin tablas erp_ extra inesperadas');
  else console.log('⚠️ Tablas erp_ extra en Supabase:', extra.join(', '));

  console.log('\n=== 2) RLS HABILITADO ===\n');
  const rlsTables = await client.query(`
    SELECT t.table_name
    FROM information_schema.tables t
    JOIN pg_class c ON c.relname = t.table_name
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    WHERE t.table_schema = 'public'
      AND t.table_name LIKE 'erp_%'
      AND c.relrowsecurity = true
    ORDER BY t.table_name
  `);
  const rlsSet = new Set(rlsTables.rows.map(r => r.table_name));
  const withoutRls = expectedTables.filter(t => !rlsSet.has(t));
  if (withoutRls.length === 0) console.log('✅ Todas las tablas erp_ tienen RLS habilitado');
  else console.log('❌ Tablas sin RLS:', withoutRls.join(', '));

  console.log('\n=== 3) POLÍTICAS RLS ESPERADAS ===\n');
  const policies = await client.query(`
    SELECT tablename, policyname, permissive, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename LIKE 'erp_%'
    ORDER BY tablename, cmd, policyname
  `);
  const policyTable: Record<string, { select?: string; insert?: string; update?: string; delete?: string }> = {};
  for (const p of policies.rows) {
    const entry = policyTable[p.tablename] || {};
    entry[p.cmd.toLowerCase() as 'select' | 'insert' | 'update' | 'delete'] = p.policyname;
    policyTable[p.tablename] = entry;
  }
  const requiredPoliciesPerTable = ['select', 'insert', 'update', 'delete'];
  const policyIssues: string[] = [];
  for (const t of expectedTables) {
    const p = policyTable[t];
    if (!p) {
      policyIssues.push(`${t}: sin políticas`);
      continue;
    }
    for (const cmd of requiredPoliciesPerTable) {
      if (!p[cmd]) policyIssues.push(`${t}: falta policy ${cmd.toUpperCase()}`);
    }
  }
  if (policyIssues.length === 0) console.log('✅ Todas las tablas tienen policies SELECT/INSERT/UPDATE/DELETE');
  else console.log('❌ Políticas faltantes:', policyIssues.join('; '));

  console.log('\n=== 4) PUBLICACIONES REALTIME ===\n');
  const publications = await client.query(`
    SELECT pubname, pubinsert, pubupdate, pubdelete, puballtables
    FROM pg_publication
    WHERE pubname LIKE 'supabase_realtime%'
    ORDER BY pubname
  `);
  console.log(`Publicaciones realtime: ${publications.rows.length}`);
  for (const pub of publications.rows) {
    console.log(` - ${pub.pubname}: insert=${pub.pubinsert} update=${pub.pubupdate} delete=${pub.pubdelete}`);
  }

  console.log('\n=== 5) COLUMNAS CRÍTICAS (muestra) ===\n');
  const sampleTables = ['erp_proyectos', 'erp_presupuestos', 'erp_empleados', 'erp_cuentas_cobrar'];
  for (const t of sampleTables) {
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [t]);
    console.log(`✅ ${t}: ${cols.rows.length} columnas`);
    for (const c of cols.rows.slice(0, 8)) {
      console.log(`   ${c.column_name} (${c.data_type}${c.is_nullable === 'YES' ? ', nullable' : ''})`);
    }
    if (cols.rows.length > 8) console.log(`   ... +${cols.rows.length - 8} más`);
  }

  await client.end();
  console.log('\n✅ Auditoría completada');
}

auditSupabase().catch(err => {
  console.error('❌ Error en auditoría:', err.message);
  process.exit(1);
});
