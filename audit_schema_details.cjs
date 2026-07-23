const { Client } = require('pg');

async function main() {
  const client = new Client('postgresql://postgres.neygzluxugodiwcuctbj:AngelDario2027@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable');
  await client.connect();

  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;");
  const out = [];
  for (const { table_name } of tables.rows) {
    const cols = await client.query(
      `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
      [table_name]
    );
    const rls = await client.query(
      `SELECT relname, relrowsecurity FROM pg_class WHERE relname = $1 AND relkind = 'r'`,
      [table_name]
    );
    out.push({
      table: table_name,
      rls: rls.rows[0] ? rls.rows[0].relrowsecurity : null,
      columns: cols.rows.map(c => `${c.column_name} ${c.data_type}${c.is_nullable === 'YES' ? ' NULL' : ' NOT NULL'}`)
    });
  }

  console.log(JSON.stringify(out, null, 2));
  await client.end();
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
