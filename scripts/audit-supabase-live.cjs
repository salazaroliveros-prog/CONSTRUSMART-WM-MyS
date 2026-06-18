const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
  const env = {};
  fs.readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .forEach(line => {
      const m = line.match(/^\s*([^=]+?)\s*=\s*(.*?)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    });
  return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_KEY);

async function main() {
  const tables = [
    'erp_proyectos',
    'erp_materiales',
    'erp_movimientos',
    'erp_empleados',
    'erp_ordenes_compra',
    'erp_proveedores',
    'erp_eventos_calendario',
    'erp_bitacora',
    'erp_seguimiento',
    'erp_renglones',
    'erp_insumos',
    'erp_sub_renglones',
    'erp_presupuestos',
    'erp_vales_salida',
    'erp_avances',
    'erp_hitos',
    'erp_riesgos',
    'erp_no_conformidades',
    'erp_incidentes',
    'erp_activos',
    'erp_planos',
    'erp_rfis',
    'erp_submittals',
    'erp_ordenes_cambio',
    'erp_cuentas_cobrar',
    'erp_cuentas_pagar',
    'erp_pagos_proveedor',
    'erp_notificaciones',
    'erp_publicaciones_muro',
    'erp_licitaciones',
    'erp_cotizaciones_negocio',
    'erp_pruebas_laboratorio',
    'erp_liberaciones_partida',
    'recepciones_almacen',
    'destajos',
    'ventas_paquetes',
    'centros_costo',
    'anticipos',
    'amortizaciones',
    'cajas_chicas',
    'activos_herramientas',
    'cuadro_comparativo_proveedores',
    'cotizaciones',
    'pagos_proveedores',
    'erp_usuarios',
    'erp_proyecto_miembros',
  ];

  const out = [];
  out.push(`Supabase URL: ${env.VITE_SUPABASE_URL}`);
  out.push(`Now: ${new Date().toISOString()}`);
  out.push('');

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error && error.code === '42P01') {
      out.push(`MISSING table: ${table}`);
      continue;
    }

    out.push(`TABLE ${table}: accessible=${!error && count !== null} error=${error ? error.message : 'none'} count=${count ?? 'unknown'}`);
    if (error) out.push(`  ERROR DETAIL: ${JSON.stringify(error)}`);
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('obtener_kpis_dashboard');
  out.push('');
  out.push('RPC obtener_kpis_dashboard:');
  if (rpcError) out.push(`ERROR: ${rpcError.message}`);
  else out.push(`RESULT: ${JSON.stringify(rpcData)}`);

  fs.writeFileSync('supabase-live-audit.txt', out.join('\n'));
  console.log('Write supabase-live-audit.txt');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
