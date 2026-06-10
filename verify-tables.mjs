import https from 'https';

const SUPABASE_URL = 'https://neygzluxugodiwcuctbj.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjA4OTIsImV4cCI6MjA5NTgzNjg5Mn0.IfCMtFbZYL0GDgV_3zwqBmqjCNf3PZfYS-SvbRGXhY0';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const opts = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'apikey': ANON_KEY,
        'Authorization': 'Bearer ' + ANON_KEY,
        'Accept': 'application/json'
      }
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Prefer'] = 'params=single-object';
    }
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  console.log('VERIFICACIÓN DE TABLAS SUPABASE');
  console.log('===============================\n');

  // Probar tablas principales
  const tables = [
    'erp_proyectos', 'erp_presupuestos', 'erp_movimientos', 'erp_empleados',
    'erp_materiales', 'erp_ordenes_compra', 'erp_proveedores',
    'erp_cuentas_cobrar', 'erp_cuentas_pagar', 'erp_incidentes',
    'erp_riesgos', 'erp_hitos', 'erp_bitacora', 'erp_avances',
    'erp_licitaciones', 'erp_cotizaciones_negocio', 'erp_notificaciones',
    'profiles', 'erp_seguimiento', 'erp_seguimiento_evm',
    'erp_ordenes_cambio', 'erp_muro', 'erp_no_conformidades',
    'erp_liberaciones_partida', 'erp_planos', 'erp_rfis', 'erp_submittals',
    'erp_activos', 'erp_cuadros', 'erp_eventos_calendario',
    'erp_renglones', 'erp_insumos', 'erp_sub_renglones',
    'erp_vales_salida', 'erp_rendimientos_cuadrilla', 'erp_insumos_base'
  ];

  let ok = 0, notfound = 0, error = 0;
  for (const t of tables) {
    const r = await request('GET', '/rest/v1/' + t + '?select=id&limit=1');
    if (r.status === 200) {
      const rows = JSON.parse(r.data || '[]');
      console.log(`  ✅ ${t}: ${rows.length > 0 ? 'CON DATOS' : 'VACÍA'}`);
      ok++;
    } else if (r.status === 404 || r.status === 406) {
      console.log(`  ❌ ${t}: NO EXISTE (HTTP ${r.status})`);
      notfound++;
    } else {
      const msg = r.data ? r.data.substring(0, 80) : 'sin mensaje';
      console.log(`  ⚠️  ${t}: ERROR (HTTP ${r.status}): ${msg}`);
      error++;
    }
  }

  console.log(`\nRESUMEN:`);
  console.log(`  ✅ OK: ${ok}`);
  console.log(`  ❌ No existe: ${notfound}`);
  console.log(`  ⚠️  Error: ${error}`);
  console.log(`  Total: ${tables.length}`);
}

main().catch(e => console.error('FATAL:', e.message));