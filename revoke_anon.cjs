const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const client = new Client('postgresql://postgres.neygzluxugodiwcuctbj:AngelDario2027@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable');

(async () => {
  await client.connect();

  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;`
  );

  const logs = [];
  for (const { table_name } of tables.rows) {
    try {
      await client.query(`REVOKE ALL ON public."${table_name}" FROM anon;`);
      logs.push(`[OK] REVOKE ALL ON public."${table_name}" FROM anon`);
    } catch (e) {
      logs.push(`[ERR] public."${table_name}": ${e.message}`);
    }
  }

  fs.writeFileSync(path.join('tmp', 'revoke_anon.log'), logs.join('\n'));
  console.log(logs.join('\n'));
  console.log('Total tables:', tables.rows.length);

  await client.end();
  console.log('Done');
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
