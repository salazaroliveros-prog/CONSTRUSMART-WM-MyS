import { createClient } from '@supabase/supabase-js';

async function checkViews() {
  const supabase = createClient('https://neygzluxugodiwcuctbj.supabase.co', 'JWT_ANON_KEY_PLACEHOLDER');
  const { data, error } = await supabase.rpc('sql', { query: `SELECT schemaname, viewname, security_definer FROM pg_catalog.pg_views WHERE schemaname = 'public' AND viewname IN ('erp_publicaciones_muro','erp_cuadros_comparativos','erp_incidentes_sso','erp_activos_herramienta');` });
  if (error) console.log('Error:', error);
  else console.log(data);
}
checkViews();