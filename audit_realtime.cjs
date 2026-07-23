const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const client = new Client('postgresql://postgres.neygzluxugodiwcuctbj:AngelDario2027@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable');
(async () => {
  await client.connect();
  const res = await client.query(`
    SELECT schemaname, tablename, pubname, attnames, rowfilter
    FROM pg_publication_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  fs.writeFileSync(path.join('tmp', 'realtime.json'), JSON.stringify(res.rows, null, 2));
  console.log('realtime:', res.rows.length, 'rows');
  await client.end();
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
