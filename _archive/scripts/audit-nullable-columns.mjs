import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const criticalIdColumns = [
  'erp_activos_herramienta',
  'erp_cuadros_comparativos',
  'erp_incidentes_sso',
  'erp_publicaciones_muro',
];

const transactionalTables = [
  'erp_activos',
  'erp_activos_herramienta',
  'erp_cuadros',
  'erp_cuadros_comparativos',
  'erp_cuentas_cobrar',
  'erp_cuentas_pagar',
  'erp_eventos_calendario',
  'erp_hitos',
  'erp_incidentes',
  'erp_incidentes_sso',
  'erp_liberaciones_partida',
  'erp_licitaciones',
  'erp_muro',
  'erp_no_conformidades',
  'erp_notificaciones',
  'erp_ordenes_cambio',
  'erp_ordenes_compra',
  'erp_planos',
  'erp_presupuestos',
  'erp_pruebas_laboratorio',
  'erp_publicaciones_muro',
  'erp_rfis',
  'erp_riesgos',
  'erp_seguimiento',
  'erp_submittals',
  'erp_vales_salida',
];

async function checkNullCounts(table, column) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .is(column, null);

  if (error) {
    console.error(`Error checking ${table}.${column}:`, error.message);
    return null;
  }

  return count || 0;
}

async function auditIdColumns() {
  console.log('\n=== AUDIT: Critical ID Columns ===\n');

  for (const table of criticalIdColumns) {
    const nullCount = await checkNullCounts(table, 'id');
    console.log(`${table}.id: ${nullCount === null ? 'ERROR' : nullCount + ' NULL values'}`);
  }
}

async function auditProyectoIdColumns() {
  console.log('\n=== AUDIT: proyecto_id Columns ===\n');

  for (const table of transactionalTables) {
    const nullCount = await checkNullCounts(table, 'proyecto_id');
    console.log(`${table}.proyecto_id: ${nullCount === null ? 'ERROR' : nullCount + ' NULL values'}`);
  }
}

async function auditTimestampColumns() {
  console.log('\n=== AUDIT: created_at/updated_at Columns ===\n');

  const allTables = [
    ...transactionalTables,
    'erp_auditoria',
    'erp_categorias_materiales',
    'erp_configuracion_avance',
    'erp_contactos_proveedor',
    'erp_cuadros_comparativos',
    'erp_empresas',
    'erp_estados_orden',
    'erp_insumos_base',
    'erp_licitaciones',
    'erp_muro',
    'erp_parametros_sistema',
    'erp_partidas_cotizadas',
    'erp_plantillas_proyectos',
    'erp_porcentajes_avance',
    'erp_presupuestos',
    'erp_proveedores',
    'erp_rendimientos_cuadrilla',
    'erp_rol_usuario',
    'erp_seguimiento',
    'erp_subtipologias',
    'erp_tipologias',
    'erp_usuarios',
  ];

  for (const tableName of allTables) {
    const createdAtNulls = await checkNullCounts(tableName, 'created_at');
    const updatedAtNulls = await checkNullCounts(tableName, 'updated_at');

    if (createdAtNulls > 0 || updatedAtNulls > 0) {
      console.log(`${tableName}.created_at: ${createdAtNulls} NULL values`);
      console.log(`${tableName}.updated_at: ${updatedAtNulls} NULL values`);
    }
  }

  console.log('(No additional NULL values found)');
}

async function main() {
  console.log('Starting nullable columns audit...\n');

  await auditIdColumns();
  await auditProyectoIdColumns();
  await auditTimestampColumns();

  console.log('\n✅ Audit complete\n');
}

main().catch(console.error);
