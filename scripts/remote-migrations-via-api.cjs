require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

async function listRemoteMigrations() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_SERVICE_ROLE_KEY en el ambiente.');
    process.exit(1);
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/migrations`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    console.error('Error consultando migraciones remotas:', res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  console.log('Remote migrations:', data.length || 0);
  if (Array.isArray(data)) {
    for (const row of data) {
      console.log(row.version, '|', row.name);
    }
  } else {
    console.log(data);
  }
}

listRemoteMigrations().catch(e => {
  console.error('Error inesperado:', e);
  process.exit(1);
});