const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema(tableName) {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: tableName });
  if (error) {
    console.error(`Error checking ${tableName}:`, error);
    return null;
  }
  return data;
}

async function main() {
  const tables = [
    'erp_ordenes_compra',
    'erp_vales_salida',
    'erp_cuentas_cobrar',
    'erp_cuentas_pagar',
    'erp_presupuestos'
  ];

  for (const table of tables) {
    console.log(`\n=== ${table} ===`);
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`Error:`, error.message);
    } else if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('No data in table');
    }
  }
}

main();
