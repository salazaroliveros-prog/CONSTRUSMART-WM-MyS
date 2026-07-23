const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const client = new Client('postgresql://postgres.neygzluxugodiwcuctbj:AngelDario2027@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable');

(async () => {
  await client.connect();

  const policies = await client.query(`
    SELECT schemaname, tablename, policyname, cmd, qual, with_check, roles
    FROM pg_policies
    WHERE schemaname = 'public';
  `);

  const bad = [];
  for (const p of policies.rows) {
    const q = (p.qual || '').toLowerCase();
    const w = (p.with_check || '').toLowerCase();
    const hasPublic = (p.roles || '').includes('public') || (p.roles || '').includes('anon');
    if (q === 'true' || w === 'true' || hasPublic) {
      bad.push(p);
    }
  }

  const logs = [];
  for (const p of bad) {
    try {
      await client.query(`DROP POLICY IF EXISTS "${p.policyname}" ON public."${p.tablename}";`);
      logs.push(`[OK] DROP POLICY "${p.policyname}" ON public."${p.tablename}"`);
    } catch (e) {
      logs.push(`[ERR] "${p.policyname}" ON public."${p.tablename}": ${e.message}`);
    }
  }

  fs.writeFileSync(path.join('tmp', 'drop_bad_rls.log'), logs.join('\n'));
  console.log('Dropped:', bad.length);
  console.log(logs.join('\n'));

  await client.end();
  console.log('Done');
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
