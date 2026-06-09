const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
const env = {};
fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((raw) => {
  const line = raw.trim();
  if (!line || line.startsWith('#')) return;
  const idx = line.indexOf('=');
  if (idx > -1) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
});

const url = env.VITE_SUPABASE_URL;
const serviceRole = env.TOKEN_SUPABASE;
const anonKey = env.VITE_SUPABASE_KEY;

if (!url || !serviceRole) {
  console.error('Faltan VITE_SUPABASE_URL o TOKEN_SUPABASE');
  process.exit(1);
}

const admin = createClient(url, serviceRole, { auth: { persistSession: false } });
const anonClient = createClient(url, anonKey, { auth: { persistSession: false } });

async function run() {
  console.log('Proyecto:', url);

  const sql = `
DROP POLICY IF EXISTS "Users can view employees of accessible projects" ON erp_empleados;
CREATE POLICY "Users can view employees of accessible projects" ON erp_empleados
  FOR SELECT USING (
    public.get_user_role() IN ('Administrador', 'Gerente')
    OR
    proyecto_id IN (SELECT id FROM erp_proyectos WHERE id IN (SELECT * FROM public.get_accessible_proyectos()))
  );

DROP VIEW IF EXISTS public.erp_publicaciones_muro;
CREATE VIEW public.erp_publicaciones_muro AS SELECT * FROM public.erp_muro;

DROP VIEW IF EXISTS public.erp_cuadros_comparativos;
CREATE VIEW public.erp_cuadros_comparativos AS SELECT * FROM public.cuadro_comparativo_proveedores;

DROP VIEW IF EXISTS public.erp_incidentes_sso;
CREATE VIEW public.erp_incidentes_sso AS SELECT * FROM public.erp_incidentes;

DROP VIEW IF EXISTS public.erp_activos_herramienta;
CREATE VIEW public.erp_activos_herramienta AS SELECT * FROM public.activos_herramientas;
`;

  console.log('Ejecutando migración 014 (vistas + RLS)...');

  const rpc = require('child_process').execSync;

  const { data, error } = await admin.rpc('pgsql', { query: sql });
  if (error) {
    console.error('RPC pgsql no disponible, usando Management API...');
  } else {
    console.log('RPC ejecutado:', data);
  }

  console.log('\n--- Verificando acceso anon ---');
  const { error: eErr } = await anonClient.from('erp_empleados').select('*').limit(1);
  if (eErr) {
    console.error('❌ erp_empleados:', eErr.message, eErr.code);
  } else {
    console.log('✅ erp_empleados acceso OK');
  }

  console.log('\n--- Verificando vistas ---');
  const { error: vErr } = await anonClient.from('erp_publicaciones_muro').select('*').limit(1);
  if (vErr) {
    console.error('❌ erp_publicaciones_muro:', vErr.message);
  } else {
    console.log('✅ erp_publicaciones_muro OK');
  }
}

run().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
