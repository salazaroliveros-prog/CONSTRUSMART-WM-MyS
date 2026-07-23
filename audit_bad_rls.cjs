const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const client = new Client('postgresql://postgres.neygzluxugodiwcuctbj:AngelDario2027@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable');

(async () => {
  await client.connect();

  const policies = await client.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, cmd, policyname;
  `);

  const reasons = new Set();
  const out = [];
  for (const p of policies.rows) {
    const q = (p.qual || '').toLowerCase();
    const w = (p.with_check || '').toLowerCase();
    const badUsing = q === 'true';
    const badCheck = w === 'true';
    const deprecatedJwtRole = /auth\.jwt\(\)\s*-+>\s*'role'/.test(q) || /auth\.jwt\(\)\s*-+>\s*'role'/.test(w);
    if (badUsing || badCheck || deprecatedJwtRole) {
      const reason = [
        badUsing ? 'using_true' : '',
        badCheck ? 'check_true' : '',
        deprecatedJwtRole ? 'deprecated_jwt_role' : ''
      ].filter(Boolean).join(',');
      reasons.add(reason);
      out.push({
        tablename: p.tablename,
        policyname: p.policyname,
        cmd: p.cmd,
        roles: p.roles,
        qual: p.qual,
        with_check: p.with_check,
        reason
      });
    }
  }

  fs.writeFileSync(path.join('tmp', 'rls_bad_policies.json'), JSON.stringify(out, null, 2));
  console.log('Bad policies:', out.length);
  console.log('Reasons:', [...reasons].join(', '));
  console.log(JSON.stringify(out, null, 2));

  await client.end();
  console.log('Done');
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
