const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function loadEnv() {
  const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);
  const env = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key && val) env[key] = val;
  }
  return env;
}

const env = loadEnv();
const ANON = env.VITE_SUPABASE_KEY;
const SVC = env.TOKEN_SUPABASE;
const URL = env.VITE_SUPABASE_URL;

async function run() {
  const admin = createClient(URL, SVC, { auth: { persistSession: false } });
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });

  console.log('=== Seeding con service_role ===');
  const result = await admin.rpc('sql', {
    query: `
INSERT INTO erp_proyectos (id, nombre, cliente, ubicacion, tipologia, estado,
  presupuesto_total, monto_contrato, avance_fisico, avance_financiero,
  lat, lng, fecha_inicio, fecha_fin, etapa, created_at, updated_at)
VALUES ('p-vista-hermosa','Edificio Residencial Vista Hermosa',
  'Inmobiliaria Vista Hermosa S.A.','Zona 15, Guatemala','residencial','ejecucion',
  45000000,52000000,35,28,
  14.6032,-90.5153,'2026-04-10','2026-08-25','construccion',now(),now())
ON CONFLICT (id) DO NOTHING
RETURNING id;
`
  }).catch(async () => {
    // Fallback: REST insert
    return await admin.from('erp_proyectos').upsert({
      id: 'p-vista-hermosa',
      nombre: 'Edificio Residencial Vista Hermosa',
      cliente: 'Inmobiliaria Vista Hermosa S.A.',
      ubicacion: 'Zona 15, Guatemala',
      tipologia: 'residencial',
      estado: 'ejecucion',
      presupuesto_total: 45000000,
      monto_contrato: 52000000,
      avance_fisico: 35,
      avance_financiero: 28,
      lat: 14.6032,
      lng: -90.5153,
      fecha_inicio: '2026-04-10',
      fecha_fin: '2026-08-25',
      etapa: 'construccion',
    }).select();
  });

  console.log('Insert resultado:', JSON.stringify(result, null, 2));

  console.log('\n=== Verificando anon key ===');
  const { data, error } = await anon.from('erp_proyectos').select('*').limit(3);
  if (error) {
    console.log('ERROR anon:', error.message, '|', error.code);
  } else {
    console.log('OK anon:', data.length, 'proyectos', data[0]?.nombre);
  }
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
