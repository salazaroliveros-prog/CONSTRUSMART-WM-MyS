import { createClient } from '@supabase/supabase-js';

async function checkViews() {
  const supabase = createClient('https://neygzluxugodiwcuctbj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjA4OTIsImV4cCI6MjA5NTgzNjg5Mn0.IfCMtFbZYL0GDgV_3zwqBmqjCNf3PZfYS-SvbRGXhY0');
  const { data, error } = await supabase.rpc('sql', { query: `SELECT schemaname, viewname, security_definer FROM pg_catalog.pg_views WHERE schemaname = 'public' AND viewname IN ('erp_publicaciones_muro','erp_cuadros_comparativos','erp_incidentes_sso','erp_activos_herramienta');` });
  if (error) console.log('Error:', error);
  else console.log(data);
}
checkViews();