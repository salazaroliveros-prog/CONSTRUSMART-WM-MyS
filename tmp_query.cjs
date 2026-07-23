const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:AngelDario2027@db.neygzluxugodiwcuctbj.supabase.co:5432/postgres?sslmode=require'
  });

  try {
    await client.connect();
    console.log('Connected successfully');
    
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
    console.log('Tables:', res.rows.map(r => r.table_name).join('\n'));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
