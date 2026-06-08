/**
 * Agrega TODAS las tablas ERP a la publicación Realtime
 * Ejecutar con: TOKEN=<tu-token> node scripts/apply-realtime-all-tables.js
 */
const API = 'https://api.supabase.com/v1/projects/neygzluxugodiwcuctbj/database/query';
const TOKEN = process.env.TOKEN || '';

if (!TOKEN) { console.error('Error: TOKEN env var is required'); process.exit(1); }

const ALL_TABLES = [
  'profiles','erp_proyectos','erp_movimientos','erp_empleados','erp_materiales',
  'erp_ordenes_compra','erp_proveedores','erp_eventos_calendario','erp_bitacora',
  'erp_seguimiento','erp_renglones','erp_insumos','erp_sub_renglones','erp_presupuestos',
  'erp_vales_salida','erp_avances','erp_insumos_base','erp_rendimientos_cuadrilla',
  'erp_auditoria','erp_licitaciones','erp_hitos','erp_riesgos','erp_cuentas_cobrar',
  'erp_cuentas_pagar','erp_ordenes_cambio','erp_muro','erp_incidentes',
  'erp_pruebas_laboratorio','erp_no_conformidades','erp_liberaciones_partida',
  'erp_planos','erp_rfis','erp_submittals','erp_notificaciones','erp_seguimiento_evm',
  'erp_activos','erp_cuadros','activos_herramientas','cuadro_comparativo_proveedores',
  'cotizaciones','anticipos','amortizaciones','pagos_proveedores','ventas_paquetes',
  'centros_costo','destajos','cajas_chicas','cotizaciones_negocio','logs_sistema'
];

async function run() {
  console.log('Agregando ' + ALL_TABLES.length + ' tablas a Realtime...\n');
  for (var i = 0; i < ALL_TABLES.length; i++) {
    var t = ALL_TABLES[i];
    try {
      var res = await fetch(API, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'ALTER PUBLICATION supabase_realtime ADD TABLE ' + t + ';' }),
      });
      var txt = await res.text();
      if (res.ok) console.log('✅ ' + t);
      else if (txt.indexOf('already') >= 0) console.log('⏭️  ' + t + ' (ya existía)');
      else if (txt.indexOf('does not exist') >= 0) console.log('⚠️  ' + t + ' (no existe)');
      else console.log('❌ ' + t + ' → ' + txt.substring(0, 80));
    } catch (e) { console.log('❌ ' + t + ' → ' + e.message); }
  }
  console.log('\n--- Verificación ---');
  var v = await fetch(API, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: "SELECT tablename::text FROM pg_publication_tables WHERE pubname='supabase_realtime' ORDER BY tablename" }),
  });
  var d = await v.json();
  console.log('Total Realtime: ' + d.length + ' tablas');
  d.forEach(function(r) { console.log('  📡 ' + r.tabname); });
}
run();