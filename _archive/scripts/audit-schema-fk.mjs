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

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    return { exists: false, error: error.message };
  }

  return { exists: true };
}

async function checkColumnExists(tableName, columnName) {
  const { data, error } = await supabase
    .from(tableName)
    .select(columnName, { count: 'exact', head: true });

  if (error) {
    return { exists: false, error: error.message };
  }

  return { exists: true };
}

async function main() {
  console.log('=== Schema Audit for Foreign Keys ===\n');

  const tablesToCheck = [
    'erp_empresas',
    'erp_insumos_base',
    'erp_subtipologias',
    'erp_cotizaciones_negocio',
    'erp_plantillas_proyectos',
    'erp_proyectos',
    'erp_usuarios',
    'erp_tipologias',
    'erp_categorias_materiales',
  ];

  for (const table of tablesToCheck) {
    const result = await checkTableExists(table);
    console.log(`${table}: ${result.exists ? '✅ EXISTS' : '❌ MISSING'}`);
    if (!result.exists) {
      console.log(`  Error: ${result.error}`);
    }
  }

  console.log('\n=== Column Checks ===\n');

  const columnChecks = [
    { table: 'erp_empresas', column: 'usuario_id' },
    { table: 'erp_insumos_base', column: 'categoria_id' },
    { table: 'erp_subtipologias', column: 'tipologia_id' },
    { table: 'erp_cotizaciones_negocio', column: 'empresa_id' },
    { table: 'erp_cotizaciones_negocio', column: 'proyecto_id' },
    { table: 'erp_plantillas_proyectos', column: 'created_by' },
  ];

  for (const { table, column } of columnChecks) {
    const result = await checkColumnExists(table, column);
    console.log(`${table}.${column}: ${result.exists ? '✅ EXISTS' : '❌ MISSING'}`);
    if (!result.exists) {
      console.log(`  Error: ${result.error}`);
    }
  }

  console.log('\n✅ Audit complete\n');
}

main().catch(console.error);
