const fs = require('fs');
const path = require('path');

const migrationDir = 'supabase/migrations';
const files = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql')).sort();

const migrationTables = new Set();
const dropTables = new Set();

files.forEach(f => {
  const text = fs.readFileSync(path.join(migrationDir, f), 'utf8');
  const createMatches = text.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/gi);
  for (const m of createMatches) {
    const name = m[1].toLowerCase();
    if (name && !['OR', 'REPLACE', 'UNLOGGED', 'TEMPORARY'].includes(name)) {
      migrationTables.add(name);
    }
  }
  const dropMatches = text.matchAll(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([A-Za-z_][A-Za-z0-9_]*)/gi);
  for (const m of dropMatches) {
    dropTables.add(m[1].toLowerCase());
  }
});

const sourceTables = [
  'erp_access_log','erp_activos','erp_ajustes_estacionales_actividad','erp_amortizaciones','erp_anticipos',
  'erp_api_keys','erp_aplicacion_escalas','erp_auditoria','erp_avances','erp_bodega',
  'erp_cajas_chicas','erp_calculos_proyecto','erp_centros_costo','erp_checklist','erp_comparaciones_calculos',
  'erp_cotizaciones_negocio','erp_cuadros','erp_cuentas_cobrar','erp_cuentas_pagar','erp_cumplimiento_normativo',
  'erp_departamentos_gt','erp_destajos','erp_documentos','erp_dosificaciones_concreto','erp_empleados',
  'erp_estacionalidad','erp_eventos_calendario','erp_historial_aplicacion_reglas','erp_hitos','erp_incidentes',
  'erp_insumos','erp_insumos_base','erp_liberaciones_partida','erp_licitaciones','erp_materiales',
  'erp_movimientos','erp_municipios_gt','erp_muro','erp_no_conformidades','erp_normativa_departamental',
  'erp_notificaciones','erp_ordenes_cambio','erp_ordenes_compra','erp_parametros_climaticos',
  'erp_parametros_movimiento_tierra','erp_parametros_muros_contencion','erp_parametros_pavimentos',
  'erp_parametros_redes_infraestructura','erp_pagos_proveedor','erp_permisos','erp_planos',
  'erp_plantillas_proyectos','erp_precios_acero','erp_proyecto_weather','erp_proyectos','erp_publicaciones_muro',
  'erp_recepciones','erp_referencias_acero','erp_reglas_factores','erp_rendimientos_campo',
  'erp_rendimientos_cuadrilla','erp_renglones','erp_rfis','erp_riesgos','erp_seguimiento',
  'erp_snapshots_estado_calculo','erp_sub_renglones','erp_submittals','erp_subtipologias',
  'erp_vales_salida','erp_ventas_paquetes','profiles'
].map(t => t.toLowerCase());

const sourceSet = new Set(sourceTables);

const orphanTables = [...migrationTables].filter(t => !sourceSet.has(t)).sort();
const droppedButReferenced = [...dropTables].filter(t => sourceSet.has(t)).sort();
const inDbPresumed = [...migrationTables].filter(t => !dropTables.has(t)).sort();
const dropsOnly = [...dropTables].filter(t => !migrationTables.has(t)).sort();

console.log('=== ORPHAN TABLES (in migrations but NOT in source code) ===');
console.log(JSON.stringify(orphanTables, null, 2));

console.log('\n=== DROPPED BUT STILL REFERENCED IN SOURCE (DANGEROUS) ===');
console.log(JSON.stringify(droppedButReferenced, null, 2));

console.log('\n=== TABLES PRESUMED ALIVE (created, not dropped in migrations) ===');
console.log(JSON.stringify(inDbPresumed, null, 2));

console.log('\n=== DROPS WITHOUT PRIOR CREATE (test_sync_schema etc) ===');
console.log(JSON.stringify(dropsOnly, null, 2));
