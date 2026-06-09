const { createClient } = require('@supabase/supabase-js');

async function listTables() {
  const supabase = createClient('https://neygzluxugodiwcuctbj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjA4OTIsImV4cCI6MjA5NTgzNjg5Mn0.IfCMtFbZYL0GDgV_3zwqBmqjCNf3PZfYS-SvbRGXhY0');
  
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