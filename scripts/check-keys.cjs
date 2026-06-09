const https = require('https');
const { URL } = require('url');
const fs = require('fs');

const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);
const env = {};
for (const raw of lines) {
  const line = raw.trim();
  if (!line || line.startsWith('#')) continue;
  const idx = line.indexOf('=');
  if (idx === -1) continue;
  env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}

const URL_BASE = env.VITE_SUPABASE_URL;
const SVC = env.TOKEN_SUPABASE;
const ANON = env.VITE_SUPABASE_KEY;
const project = URL_BASE.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown';

function req(path, token) {
  return new Promise((resolve) => {
    const u = new URL(path, URL_BASE);
    const options = {
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'GET',
      headers: { 'apikey': token, 'Authorization': 'Bearer ' + token, 'Prefer': 'count=exact' },
    };
    const r = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        const count = res.headers['content-range']?.split('/')[1] || null;
        resolve({ status: res.statusCode, count, body: body.slice(0, 200) });
      });
    });
    r.on('error', (e) => resolve({ status: 0, error: e.message }));
    r.end();
  });
}

(async () => {
  console.log('Proyecto:', project);
  console.log('\n--- Anon key (VITE_SUPABASE_KEY) ---');
  const a1 = await req('/rest/v1/erp_proyectos?limit=1', ANON);
  console.log('status:', a1.status, 'count:', a1.count, 'body:', a1.body.slice(0, 100));

  console.log('\n--- Service role (TOKEN_SUPABASE) ---');
  const s1 = await req('/rest/v1/erp_proyectos?limit=1', SVC);
  console.log('status:', s1.status, 'count:', s1.count, 'body:', s1.body.slice(0, 100));
})();
