const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env');
const content = fs.readFileSync(envPath, 'utf8');
const env = {};
content.split(/\r?\n/).forEach((raw) => {
  const line = raw.trim();
  const idx = line.indexOf('=');
  if (idx > -1) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_KEY);

async function main() {
  const { error: perr, count } = await supabase.from('erp_proyectos').select('*', { count: 'exact', head: true });
  console.log('proyectos:', perr ? perr.message : count);

  const { error: eerr } = await supabase.from('erp_empleados').select('*').limit(1);
  console.log('empleados:', eerr ? JSON.stringify({ message: eerr.message, details: eerr.details, hint: eerr.hint, code: eerr.code }) : 'ok');
}

main().catch((e) => console.log('catch', e.message));
