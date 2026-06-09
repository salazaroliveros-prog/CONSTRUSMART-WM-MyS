const { createClient } = require('@supabase/supabase-js');

async function listTables() {
  const supabase = createClient('https://neygzluxugodiwcuctbj.supabase.co', 'JWT_ANON_KEY_PLACEHOLDER');
  
  // Obtener todas las tablas public.erp_*
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');
  
  if (error) {
    console.log('Error querying tables:', error.message);
    return;
  }
  
  console.log('Tablas existentes:');
  data.forEach(t => console.log(' -', t.table_name));
}
listTables();