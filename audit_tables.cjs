const { Client } = require('pg');

async function main() {
  const client = new Client('postgresql://postgres.neygzluxugodiwcuctbj:AngelDario2027@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable');
  await client.connect();
  console.log('Connected OK');

  const sql = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  const res = await client.query(sql);
  console.log(JSON.stringify(res.rows.map(r => r.table_name), null, 2));
  await client.end();
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
