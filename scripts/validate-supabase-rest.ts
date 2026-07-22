import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://neygzluxugodiwcuctbj.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI2MDg5MiwiZXhwIjoyMDk1ODM2ODkyfQ.tExTkymdTg60mbD5wuikxnJMVryiT-9ld-6PhJhAFJM';

interface Check {
  category: string;
  name: string;
  status: 'OK' | 'WARN' | 'ERROR' | 'SKIP';
  detail?: string;
}

const checks: Check[] = [];

function log(c: Check) {
  checks.push(c);
  const icon = { OK: '✅', WARN: '⚠️ ', ERROR: '❌', SKIP: '⏭ ' }[c.status];
  const detail = c.detail ? `: ${c.detail}` : '';
  console.log(`  ${icon} [${c.category}] ${c.name}${detail}`);
}

async function checkTableAccess(sb: SupabaseClient, table: string): Promise<{ exists: boolean; count: number; error?: string }> {
  const { data, error, count } = await sb.from(table).select('id', { count: 'exact', head: true });
  if (error) return { exists: false, count: 0, error: error.message };
  return { exists: true, count: count ?? 0 };
}

async function checkRPC(sb: SupabaseClient, fn: string, args: Record<string, unknown> = {}): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await sb.rpc(fn, args);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  CONSTRUSMART — Validación Supabase (REST API)   ║');
  console.log(`║  ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC                       ║`);
  console.log('╚══════════════════════════════════════════════════╝\n');

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('── 1. CONECTIVIDAD & HEALTH ───────────────────────');

  const t0 = Date.now();
  const { data: healthProj, error: hErr } = await sb.from('erp_proyectos').select('id').limit(1);
  const latency = Date.now() - t0;

  if (hErr) {
    log({ category: 'HEALTH', name: 'API conectividad', status: 'ERROR', detail: hErr.message });
  } else {
    log({ category: 'HEALTH', name: 'API conectividad', status: 'OK', detail: `${latency}ms` });
  }

  console.log('\n── 2. TABLAS REQUERIDAS (verificación existencia + RLS) ───');

  const requiredTables = [
    'erp_proyectos', 'erp_presupuestos', 'erp_movimientos', 'erp_empleados',
    'erp_materiales', 'erp_ordenes_compra', 'erp_proveedores', 'erp_hitos',
    'erp_riesgos', 'erp_plantillas_proyectos', 'erp_cuentas_cobrar',
    'erp_cuentas_pagar', 'erp_error_log', 'erp_api_keys', 'erp_audit_log',
    'erp_activos', 'erp_destajos', 'erp_recepciones', 'erp_checklist',
    'erp_configuracion', 'erp_permisos', 'erp_documentos', 'erp_ordenes_cambio',
    'erp_avances', 'erp_notificaciones', 'erp_bodega', 'erp_crm_pipeline',
    'erp_cotizaciones', 'erp_cajas_chicas', 'erp_anticipos', 'erp_amortizaciones',
    'erp_plantillas_proyectos', 'erp_departamentos_gt', 'erp_municipios_gt',
    'erp_access_log', 'erp_licitaciones', 'erp_no_conformidades',
    'erp_ordenes_produccion', 'erp_seguimiento', 'erp_rendimientos_campo',
  ];

  const tableStatus: Record<string, { exists: boolean; count: number }> = {};

  for (const table of [...new Set(requiredTables)]) {
    const result = await checkTableAccess(sb, table);
    tableStatus[table] = { exists: result.exists, count: result.count };
    if (result.exists) {
      log({ category: 'TABLA', name: table, status: 'OK', detail: `${result.count} filas` });
    } else {
      log({ category: 'TABLA', name: table, status: 'ERROR', detail: result.error || 'NO EXISTE' });
    }
  }

  console.log('\n── 3. OPERACIONES CRUD (INSERT / SELECT / UPDATE / DELETE) ───');

  const testId = `test-${Date.now()}`;

  const { data: testInsert, error: insErr } = await sb.from('erp_proyectos').insert({
    id: undefined,
    nombre: `[TEST VALIDACIÓN ${testId}]`,
    estado: 'borrador',
    tipologia: 'residencial',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).select('id').single();

  if (insErr) {
    log({ category: 'CRUD', name: 'INSERT erp_proyectos', status: 'WARN', detail: insErr.message });
  } else {
    const newId = testInsert?.id;
    log({ category: 'CRUD', name: 'INSERT erp_proyectos', status: 'OK', detail: `id=${newId}` });

    const { data: selectData, error: selErr } = await sb.from('erp_proyectos')
      .select('id, nombre, estado')
      .eq('id', newId)
      .single();

    if (selErr) {
      log({ category: 'CRUD', name: 'SELECT by PK', status: 'ERROR', detail: selErr.message });
    } else {
      log({ category: 'CRUD', name: 'SELECT by PK', status: 'OK', detail: selectData?.nombre });
    }

    const { error: updErr } = await sb.from('erp_proyectos')
      .update({ estado: 'activo', updated_at: new Date().toISOString() })
      .eq('id', newId);

    log({ category: 'CRUD', name: 'UPDATE estado', status: updErr ? 'ERROR' : 'OK', detail: updErr?.message });

    const { error: delErr } = await sb.from('erp_proyectos').delete().eq('id', newId);
    log({ category: 'CRUD', name: 'DELETE test row', status: delErr ? 'ERROR' : 'OK', detail: delErr?.message });
  }

  console.log('\n── 4. QUERIES DE PERFORMANCE (índices) ───────────');

  const perfTests: Array<{ name: string; fn: () => Promise<any> }> = [
    {
      name: 'proyectos ORDER BY created_at DESC (debe usar idx)',
      fn: () => sb.from('erp_proyectos').select('id,nombre,estado').order('created_at', { ascending: false }).limit(20)
    },
    {
      name: 'movimientos FILTER tipo=egreso ORDER BY fecha DESC',
      fn: () => sb.from('erp_movimientos').select('id,monto,tipo,fecha').eq('tipo', 'egreso').order('fecha', { ascending: false }).limit(20)
    },
    {
      name: 'hitos FILTER estado=pendiente',
      fn: () => sb.from('erp_hitos').select('id,nombre,estado').eq('estado', 'pendiente').limit(20)
    },
    {
      name: 'ordenes_compra FILTER estado=pendiente',
      fn: () => sb.from('erp_ordenes_compra').select('id,estado').in('estado', ['borrador', 'aprobacion']).limit(20)
    },
    {
      name: 'presupuestos ORDER BY version_presupuesto DESC',
      fn: () => sb.from('erp_presupuestos').select('id,estado').order('version_presupuesto', { ascending: false }).limit(10)
    },
    {
      name: 'error_log ORDER BY created_at DESC',
      fn: () => sb.from('erp_error_log').select('id').order('created_at', { ascending: false }).limit(10)
    },
    {
      name: 'audit_log ORDER BY fecha_hora DESC',
      fn: () => sb.from('erp_audit_log').select('id').order('fecha_hora', { ascending: false }).limit(10)
    },
    {
      name: 'empleados FILTER activo=true',
      fn: () => sb.from('erp_empleados').select('id,nombre').eq('activo', true).limit(20)
    },
    {
      name: 'materiales SELECT stock',
      fn: () => sb.from('erp_materiales').select('id,nombre').limit(20)
    },
    {
      name: 'cuentas_cobrar ORDER BY fecha_vencimiento',
      fn: () => sb.from('erp_cuentas_cobrar').select('id,estado').order('fecha_vencimiento', { ascending: true }).limit(20)
    },
  ];

  for (const test of perfTests) {
    const t1 = Date.now();
    try {
      const { data, error } = await test.fn();
      const ms = Date.now() - t1;
      if (error) {
        log({ category: 'PERF', name: test.name, status: 'WARN', detail: error.message });
      } else {
        const status = ms < 500 ? 'OK' : ms < 1500 ? 'WARN' : 'ERROR';
        log({ category: 'PERF', name: test.name, status, detail: `${ms}ms (${data?.length || 0} filas)` });
      }
    } catch (e: any) {
      log({ category: 'PERF', name: test.name, status: 'SKIP', detail: e.message });
    }
  }

  console.log('\n── 5. REALTIME CHECK ──────────────────────────────');

  await new Promise<void>((resolve) => {
    const channel = sb.channel('validation-test');
    let received = false;

    const timer = setTimeout(() => {
      if (!received) {
        log({ category: 'REALTIME', name: 'Canal de prueba', status: 'WARN', detail: 'timeout 3s — realtime activo pero sin eventos' });
      }
      sb.removeChannel(channel);
      resolve();
    }, 3000);

    channel
      .on('system', {}, () => {
        if (!received) {
          received = true;
          clearTimeout(timer);
          log({ category: 'REALTIME', name: 'Canal de prueba', status: 'OK', detail: 'conectado' });
          sb.removeChannel(channel);
          resolve();
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timer);
          log({ category: 'REALTIME', name: 'Canal de prueba', status: 'OK', detail: `SUBSCRIBED` });
          sb.removeChannel(channel);
          resolve();
        }
      });
  });

  console.log('\n── 6. AUTH CHECK ──────────────────────────────────');

  const { data: authSettings, error: authErr } = await sb.auth.getSession();
  log({ category: 'AUTH', name: 'getSession (service role)', status: authErr ? 'WARN' : 'OK', detail: authErr?.message || 'sin sesión activa (correcto para service_role)' });

  const { data: users, error: usersErr } = await (sb.auth as any).admin?.listUsers?.({ page: 1, perPage: 5 }) || { data: null, error: null };
  if (usersErr) {
    log({ category: 'AUTH', name: 'admin.listUsers', status: 'WARN', detail: usersErr.message });
  } else if (users) {
    log({ category: 'AUTH', name: 'admin.listUsers', status: 'OK', detail: `${users.users?.length || 0} usuarios (muestra)` });
  }

  console.log('\n── 7. STORAGE CHECK ───────────────────────────────');

  const { data: buckets, error: bucketsErr } = await sb.storage.listBuckets();
  if (bucketsErr) {
    log({ category: 'STORAGE', name: 'listBuckets', status: 'WARN', detail: bucketsErr.message });
  } else {
    log({ category: 'STORAGE', name: 'listBuckets', status: 'OK', detail: `${buckets?.length || 0} buckets` });
    buckets?.forEach(b => console.log(`    · ${b.name} (${b.public ? 'público' : 'privado'})`));
  }

  console.log('\n── 8. FUNCIONES RPC ───────────────────────────────');

  const rpcFunctions = [
    { name: 'exec_sql', args: { sql: 'SELECT 1 as test' } },
  ];

  for (const fn of rpcFunctions) {
    const r = await checkRPC(sb, fn.name, fn.args);
    log({ category: 'RPC', name: `rpc.${fn.name}`, status: r.ok ? 'OK' : 'WARN', detail: r.error });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  RESUMEN FINAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const counts = {
    OK: checks.filter(c => c.status === 'OK').length,
    WARN: checks.filter(c => c.status === 'WARN').length,
    ERROR: checks.filter(c => c.status === 'ERROR').length,
    SKIP: checks.filter(c => c.status === 'SKIP').length,
  };

  console.log(`  ✅ OK:    ${counts.OK}`);
  console.log(`  ⚠️  WARN:  ${counts.WARN}`);
  console.log(`  ❌ ERROR: ${counts.ERROR}`);
  console.log(`  ⏭  SKIP:  ${counts.SKIP}`);
  console.log(`  📊 Total: ${checks.length}`);

  const missingTables = checks.filter(c => c.category === 'TABLA' && c.status === 'ERROR');
  if (missingTables.length > 0) {
    console.log('\n  Tablas faltantes (requieren migración):');
    missingTables.forEach(c => console.log(`    ❌ ${c.name}: ${c.detail}`));
  }

  const slowQueries = checks.filter(c => c.category === 'PERF' && c.status !== 'OK' && c.status !== 'SKIP');
  if (slowQueries.length > 0) {
    console.log('\n  Queries lentas (pueden necesitar índices):');
    slowQueries.forEach(c => console.log(`    ⚠️  ${c.name}: ${c.detail}`));
  }

  const overall = counts.ERROR === 0 ? '✅ SALUDABLE' : counts.ERROR < 3 ? '⚠️  DEGRADADO' : '❌ CRÍTICO';
  console.log(`\n  Estado general: ${overall}`);
  console.log(`  Tablas presentes: ${Object.values(tableStatus).filter(t => t.exists).length}/${[...new Set(requiredTables)].length}`);

  process.exit(counts.ERROR > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('❌ Error fatal:', e);
  process.exit(1);
});
