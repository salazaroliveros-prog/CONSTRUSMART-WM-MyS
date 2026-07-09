import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI2MDg5MiwiZXhwIjoyMDk1ODM2ODkyfQ.tExTkymdTg60mbD5wuikxnJMVryiT-9ld-6PhJhAFJM';
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  // 1. Tablas erp_* - usar service client directo a pg_catalog via exec_sql
  // exec_sql está restringido a postgres owner. Usamos la tabla directamente.
  // Service role puede leer cualquier tabla pública.
  console.log('=== 1. TABLAS erp_* (sample de 3 tablas principales) ===\n');
  
  // Intentar hacer SELECT 1 a las tablas más importantes para verificar existencia
  const tablesToCheck = [
    'erp_proyectos', 'erp_presupuestos', 'erp_movimientos',
    'erp_ordenes_compra', 'erp_materiales', 'erp_empleados',
    'erp_proveedores', 'erp_cuentas_cobrar', 'erp_cuentas_pagar',
    'erp_hitos', 'erp_riesgos', 'erp_seguimiento',
    'erp_muro', 'erp_notificaciones', 'erp_plantillas_proyectos',
    'erp_incidentes', 'erp_no_conformidades', 'erp_avances',
    'erp_bitacora', 'erp_eventos_calendario', 'erp_ordenes_cambio',
    'erp_vales_salida', 'erp_destajos', 'erp_recepciones',
    'erp_centros_costo', 'erp_activos', 'erp_cuadros',
    'erp_pagos_proveedor', 'erp_planos', 'erp_rfis',
    'erp_submittals', 'erp_pruebas_laboratorio', 'erp_liberaciones_partida',
    'erp_licitaciones', 'erp_cotizaciones_negocio', 'erp_ventas_paquetes',
    'erp_comentarios_muro', 'erp_proyecto_weather', 'erp_error_log'
  ];

  let existentes = 0;
  let faltantes: string[] = [];
  for (const tbl of tablesToCheck) {
    const { count, error } = await supabase
      .from(tbl as any)
      .select('*', { count: 'exact', head: true });
    if (!error) {
      existentes++;
    } else {
      faltantes.push(tbl);
    }
  }
  console.log(`Tablas existentes: ${existentes}/${tablesToCheck.length}`);
  if (faltantes.length > 0) {
    console.log(`\nFALTANTES (${faltantes.length}):`);
    faltantes.forEach(t => console.log(`  - ${t}`));
  }

  // 2. Muestreo de columnas de erp_proyectos (traer 1 fila para ver campos)
  console.log('\n=== 2. COLUMNAS DE erp_proyectos (muestreo 1 fila) ===\n');
  const { data: proyRow, error: proyErr } = await supabase
    .from('erp_proyectos')
    .select('*')
    .limit(1);
  if (proyErr) {
    console.log(`Error al leer erp_proyectos: ${proyErr.message}`);
  } else if (proyRow && proyRow.length > 0) {
    const cols = Object.keys(proyRow[0]);
    console.log(`${cols.length} columnas:\n`);
    cols.forEach(c => console.log(`  ${c}`));
  } else {
    console.log('erp_proyectos existe pero está vacía (0 filas)');
    // intentar con una columna que sabemos que existe
    const { data: proyEmpty } = await supabase
      .from('erp_proyectos')
      .select('id, nombre, estado, created_at')
      .limit(0);
    if (!proyEmpty) {
      const { data: cols } = await supabase
        .rpc('exec_sql' as any, { sql: `SELECT column_name FROM information_schema.columns WHERE table_name='erp_proyectos' ORDER BY ordinal_position` });
      if (cols) console.log('Columnas vía exec_sql:', (cols as any[]).map((c: any) => c.column_name));
      else console.log('No se pudieron leer columnas');
    }
  }

  // 3. Verificar erp_notificaciones específicamente
  console.log('\n=== 3. erp_notificaciones ===\n');
  const { data: notifRow, error: notifErr } = await supabase
    .from('erp_notificaciones')
    .select('*')
    .limit(1);
  if (notifErr) {
    console.log(`erp_notificaciones NO EXISTE: ${notifErr.message}`);
  } else {
    const cols = notifRow && notifRow.length > 0 ? Object.keys(notifRow[0]) : ['(existe pero vacía)'];
    console.log(`erp_notificaciones EXISTE con columnas:\n`);
    cols.forEach(c => console.log(`  ${c}`));
  }

  // 4. Verificar RLS - intentar INSERT con anon key a una tabla pública
  console.log('\n=== 4. VERIFICACIÓN RLS ===\n');
  const anonClient = createClient(supabaseUrl, 
    'JWT_ANON_KEY_PLACEHOLDER'
  );
  const { data: anonTest } = await anonClient.from('erp_proyectos').select('id').limit(1);
  if (anonTest) {
    console.log('RLS: anon key PUEDE leer erp_proyectos (SELECT permitido)');
  } else {
    console.log('RLS: anon key NO puede leer erp_proyectos (restringido correctamente)');
  }

  console.log('\n=== FIN DEL DIAGNÓSTICO SUPABASE ===');
}

main().catch(console.error);