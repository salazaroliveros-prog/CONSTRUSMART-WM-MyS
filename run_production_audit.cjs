const url = 'https://neygzluxugodiwcuctbj.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI2MDg5MiwiZXhwIjoyMDk1ODM2ODkyfQ.tExTkymdTg60mbD5wuikxnJMVryiT-9ld-6PhJhAFJM';
const headers = { 'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' };

async function rpc(name, body) {
  const r = await fetch(url + '/rest/v1/rpc/' + name, {
    method: 'POST', headers, body: JSON.stringify(body)
  });
  const text = await r.text();
  return { status: r.status, body: text };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const createSQL = `
    CREATE OR REPLACE FUNCTION run_sql_query(sql_text TEXT)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      result JSONB;
    BEGIN
      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || sql_text || ') t' INTO result;
      RETURN COALESCE(result, '[]'::jsonb);
    END;
    $$;
    REVOKE EXECUTE ON FUNCTION run_sql_query(TEXT) FROM anon, authenticated, public;
    ALTER FUNCTION run_sql_query(TEXT) OWNER TO postgres;
  `;
  await rpc('exec_sql', { sql: createSQL });
  await sleep(5000);

  const report = {
    timestamp: new Date().toISOString(),
    project: 'neygzluxugodiwcuctbj',
    tables: { total: 0, erp: 0, missing: [] },
    rls: { enabled: 0, disabled: [], policies: 0, noPolicy: [] },
    fks: { total: 0, bad: [] },
    realtime: { published: 0, notPublished: [] },
    enums: [],
    views: [],
    issues: []
  };

  // 1. TABLE INVENTORY
  console.log('=== 1. TABLE INVENTORY ===');
  const r1 = await rpc('run_sql_query', { sql_text: "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_type, table_name" });
  const allTables = JSON.parse(r1.body);
  report.tables.total = allTables.length;
  const erpTables = allTables.filter(t => t.table_name.startsWith('erp_'));
  report.tables.erp = erpTables.length;

  const expectedTables = [
    'erp_proyectos','erp_movimientos','erp_empleados','erp_materiales',
    'erp_ordenes_compra','erp_proveedores','erp_cuentas_cobrar','erp_cuentas_pagar',
    'erp_hitos','erp_riesgos','erp_licitaciones','erp_cotizaciones_negocio',
    'erp_vales_salida','erp_no_conformidades','erp_incidentes','erp_planos',
    'erp_rfis','erp_submittals','erp_activos','erp_cuadros','erp_pagos_proveedor',
    'erp_destajos','erp_recepciones','erp_centros_costo','erp_seguimiento',
    'erp_bitacora','erp_muro','erp_notificaciones','erp_presupuestos','erp_avances',
    'erp_eventos_calendario','erp_ventas_paquetes','erp_ordenes_cambio',
    'erp_pruebas_laboratorio','erp_liberaciones_partida','erp_error_log',
    'erp_proyecto_weather','erp_app_config','erp_audit_log',
    'erp_insumos_base','erp_plantillas_proyectos',
    'erp_departamentos_gt','erp_municipios_gt',
    'erp_reglas_factores','erp_normativa_departamental',
    'erp_escalas_produccion','erp_estacionalidad',
    'erp_historial_aplicacion_reglas','erp_rendimientos_cuadrilla',
    'erp_insumos','erp_calculos_proyecto','erp_solicitudes','erp_archivos_tipo',
    'erp_comentarios_muro','erp_muro_likes',
    'erp_cumplimiento_normativo','erp_aplicacion_escalas',
    'erp_ajustes_estacionales_actividad'
  ];

  const missing = expectedTables.filter(t => !erpTables.some(e => e.table_name === t));
  report.tables.missing = missing;
  if (missing.length > 0) {
    console.log('  MISSING TABLES:', missing.join(', '));
    report.issues.push({ severity: 'HIGH', category: 'TABLES', message: `Missing ${missing.length} tables: ${missing.join(', ')}` });
  } else {
    console.log('  All expected tables present');
  }

  // 2. RLS STATUS
  console.log('\n=== 2. ROW LEVEL SECURITY ===');
  const r2 = await rpc('run_sql_query', { sql_text: "SELECT tablename, rowsecurity AS rls_enabled FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'erp_%' ORDER BY tablename" });
  const rls = JSON.parse(r2.body);
  const rlsOff = rls.filter(r => !r.rls_enabled);
  report.rls.enabled = rls.length - rlsOff.length;
  report.rls.disabled = rlsOff.map(r => r.tablename);
  
  if (rlsOff.length > 0) {
    console.log(`  RLS DISABLED on ${rlsOff.length} tables:`, rlsOff.map(r => r.tablename).join(', '));
    report.issues.push({ severity: 'HIGH', category: 'RLS', message: `${rlsOff.length} tables have RLS disabled` });
  } else {
    console.log('  All erp_* tables have RLS enabled');
  }

  // 3. POLICIES
  console.log('\n=== 3. RLS POLICIES ===');
  const r3 = await rpc('run_sql_query', { sql_text: "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname" });
  const policies = JSON.parse(r3.body);
  report.rls.policies = policies.filter(p => p.tablename.startsWith('erp_')).length;
  
  const polByTable = {};
  policies.forEach(p => { if (p.tablename.startsWith('erp_')) polByTable[p.tablename] = (polByTable[p.tablename] || 0) + 1; });
  const noPol = rls.filter(r => r.rls_enabled && !polByTable[r.tablename]);
  report.rls.noPolicy = noPol.map(r => r.tablename);
  
  if (noPol.length > 0) {
    console.log(`  WARNING: ${noPol.length} tables have RLS but NO policies:`, noPol.map(r => r.tablename).join(', '));
    report.issues.push({ severity: 'MEDIUM', category: 'RLS', message: `${noPol.length} tables have RLS but no policies` });
  } else {
    console.log('  All RLS-enabled tables have policies');
  }

  // 4. FOREIGN KEYS
  console.log('\n=== 4. FOREIGN KEYS ===');
  const r4 = await rpc('run_sql_query', { sql_text: "SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' ORDER BY tc.table_name, kcu.column_name" });
  const fks = JSON.parse(r4.body);
  report.fks.total = fks.filter(f => f.table_name.startsWith('erp_')).length;
  
  const badProjFK = fks.filter(f => f.column_name === 'proyecto_id' && f.foreign_table_name !== 'erp_proyectos');
  report.fks.bad = badProjFK;
  if (badProjFK.length > 0) {
    console.log('  BAD FKs:', badProjFK.map(f => `${f.table_name}.proyecto_id -> ${f.foreign_table_name}`).join(', '));
    report.issues.push({ severity: 'HIGH', category: 'FK', message: `${badProjFK.length} broken proyecto_id references` });
  } else {
    console.log('  All proyecto_id FKs point to erp_proyectos');
  }

  // 5. REALTIME PUBLICATION
  console.log('\n=== 5. REALTIME PUBLICATION ===');
  const r5 = await rpc('run_sql_query', { sql_text: "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename" });
  const pubs = JSON.parse(r5.body);
  const pubSet = new Set(pubs.map(p => p.tablename));
  report.realtime.published = pubs.length;
  report.realtime.notPublished = erpTables.filter(t => t.table_type === 'BASE TABLE' && !pubSet.has(t.table_name)).map(t => t.table_name);
  
  if (report.realtime.notPublished.length > 0) {
    console.log(`  NOT PUBLISHED: ${report.realtime.notPublished.join(', ')}`);
  } else {
    console.log('  All tables in realtime publication');
  }

  // 6. ENUMS
  console.log('\n=== 6. CUSTOM ENUMS ===');
  const r6 = await rpc('run_sql_query', { sql_text: "SELECT t.typname AS enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' GROUP BY t.typname ORDER BY t.typname" });
  const enums = JSON.parse(r6.body);
  report.enums = enums;
  console.log(`  ${enums.length} custom enums`);

  // 7. VIEWS
  console.log('\n=== 7. VIEWS ===');
  const views = erpTables.filter(t => t.table_type === 'VIEW');
  report.views = views.map(v => v.table_name);
  console.log(`  ${views.length} views: ${views.map(v => v.table_name).join(', ') || 'none'}`);

  // 8. CHECK FOR auth users with no role
  console.log('\n=== 8. AUTH USERS WITHOUT ROLE ===');
  const r8 = await rpc('run_sql_query', { sql_text: "SELECT id, email FROM auth.users WHERE id NOT IN (SELECT usuario_id FROM public.profiles WHERE usuario_id IS NOT NULL)" });
  const orphanUsers = JSON.parse(r8.body);
  if (orphanUsers.length > 0) {
    console.log(`  ${orphanUsers.length} auth users without profile:`, orphanUsers.map(u => u.email).join(', '));
    report.issues.push({ severity: 'MEDIUM', category: 'AUTH', message: `${orphanUsers.length} auth users without profile` });
  } else {
    console.log('  All auth users have profiles');
  }

  // 9. CHECK FOR NULL proyecto_id in critical tables
  console.log('\n=== 9. NULL proyecto_id CHECK ===');
  const criticalTables = ['erp_proyectos', 'erp_movimientos', 'erp_empleados', 'erp_materiales', 'erp_ordenes_compra', 'erp_presupuestos', 'erp_avances', 'erp_hitos', 'erp_riesgos', 'erp_notificaciones', 'erp_vales_salida', 'erp_ordenes_cambio', 'erp_incidentes'];
  for (const tbl of criticalTables) {
    const r = await rpc('run_sql_query', { sql_text: `SELECT COUNT(*)::int AS cnt FROM ${tbl} WHERE proyecto_id IS NULL` });
    const result = JSON.parse(r.body);
    if (result.length > 0 && result[0].cnt > 0) {
      console.log(`  ${tbl}: ${result[0].cnt} rows with NULL proyecto_id`);
      report.issues.push({ severity: 'LOW', category: 'DATA', message: `${tbl} has ${result[0].cnt} rows with NULL proyecto_id` });
    }
  }

  // 10. CHECK FOR unused indexes
  console.log('\n=== 10. INDEX USAGE ===');
  const r10 = await rpc('run_sql_query', { sql_text: "SELECT indexname, idx_scan FROM pg_stat_user_indexes WHERE schemaname = 'public' AND idx_scan = 0 ORDER BY indexname" });
  const unusedIdx = JSON.parse(r10.body);
  if (unusedIdx.length > 0) {
    console.log(`  ${unusedIdx.length} unused indexes:`, unusedIdx.map(i => i.indexname).join(', '));
    report.issues.push({ severity: 'LOW', category: 'PERFORMANCE', message: `${unusedIdx.length} indexes have never been used` });
  } else {
    console.log('  All indexes have been used');
  }

  // SUMMARY
  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Tables: ${report.tables.erp} erp_* tables (${report.tables.missing.length} missing)`);
  console.log(`RLS: ${report.rls.enabled} enabled, ${report.rls.disabled.length} disabled`);
  console.log(`Policies: ${report.rls.policies} total, ${report.rls.noPolicy.length} tables without policies`);
  console.log(`FKs: ${report.fks.total} total, ${report.fks.bad.length} broken`);
  console.log(`Realtime: ${report.realtime.published} published, ${report.realtime.notPublished.length} not published`);
  console.log(`Enums: ${report.enums.length}`);
  console.log(`Views: ${report.views.length}`);
  console.log(`Issues: ${report.issues.length}`);

  const high = report.issues.filter(i => i.severity === 'HIGH').length;
  const medium = report.issues.filter(i => i.severity === 'MEDIUM').length;
  const low = report.issues.filter(i => i.severity === 'LOW').length;
  console.log(`  HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low}`);

  // Save report
  const fs = await import('fs');
  fs.writeFileSync('audit_report.json', JSON.stringify(report, null, 2));
  console.log('\nReport saved to audit_report.json');

  await rpc('exec_sql', { sql: 'DROP FUNCTION IF EXISTS run_sql_query(TEXT)' });
  console.log('=== Done ===');
}

main().catch(e => console.error('FATAL:', e));
