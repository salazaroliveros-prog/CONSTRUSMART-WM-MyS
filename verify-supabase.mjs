import https from 'node:https';

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const anonKey = 'JWT_ANON_KEY_PLACEHOLDER';

function fetchSupabase(method, path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(supabaseUrl + path);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: method,
      headers: {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type': 'application/json'
      }
    };
    if (body) opts.headers['Prefer'] = 'params=single-object';
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: d }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== VERIFICACIÓN SUPABASE ===\n');
  
  // 1. Verificar funciones vía REST API
  console.log('--- FUNCIONES (RPC endpoints) ---');
  const funcs = [
    'enforce_single_admin',
    'fn_force_administrator_unique',
    'fn_log_audit',
    'fn_log_audit_trigger',
    'get_accessible_proyectos',
    'get_current_user_role',
    'get_user_rol',
    'get_user_role',
    'handle_new_user',
    'verificar_rol_usuario',
    'obtener_kpis_dashboard',
    'verificar_sesion_activa'
  ];
  
  for (const f of funcs) {
    const r = await fetchSupabase('POST', '/rest/v1/rpc/' + f, '{}');
    if (r.status === 200 || r.status === 204) {
      console.log(`  ${f}: ✅ OK (HTTP ${r.status})`);
    } else if (r.status === 404) {
      console.log(`  ${f}: ❌ NOT FOUND (HTTP 404)`);
    } else if (r.status === 429) {
      console.log(`  ${f}: ⏳ RATE LIMITED (HTTP 429)`);
    } else {
      console.log(`  ${f}: ❓ HTTP ${r.status} - ${r.data.substring(0, 100)}`);
    }
  }
  
  // 2. Verificar tablas
  console.log('\n--- TABLAS DISPONIBLES ---');
  const r = await fetchSupabase('GET', '/rest/v1/');
  const tables = JSON.parse(r.data);
  console.log(`  Total tablas: ${tables.length}`);
  tables.filter(t => t.schema === 'public').forEach(t => {
    console.log(`  - ${t.name} (${t.schema})`);
  });
  
  // 3. Probar consulta a erp_proyectos
  console.log('\n--- DATOS DE PRUEBA ---');
  const pd = await fetchSupabase('GET', '/rest/v1/erp_proyectos?select=id,nombre,estado&limit=5');
  if (pd.status === 200) {
    const data = JSON.parse(pd.data);
    console.log(`  erp_proyectos: ${data.length} registros`);
    data.forEach(p => console.log(`    - ${p.id.substring(0,8)}... | ${p.nombre} | ${p.estado}`));
  } else {
    console.log(`  erp_proyectos: HTTP ${pd.status} - ${pd.data.substring(0, 100)}`);
  }
  
  console.log('\n=== VERIFICACIÓN COMPLETADA ===');
}

main().catch(console.error);