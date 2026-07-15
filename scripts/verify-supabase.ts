import pg from 'pg';

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54260/postgres';

async function checkSupabase() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Connected to local Supabase PostgreSQL');

    const version = await client.query('SELECT version()');
    console.log('PostgreSQL:', version.rows[0].version.split(',')[0]);

    const dbName = await client.query('SELECT current_database()');
    console.log('Database:', dbName.rows[0].current_database);

    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('\nPublic tables:', tables.rows.length);
    tables.rows.forEach(r => console.log(' -', r.table_name));

    const destajosCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'erp_destajos'
      ORDER BY ordinal_position
    `);

    console.log('\nerp_destajos columns:');
    if (destajosCheck.rows.length === 0) {
      console.log(' - TABLE NOT FOUND');
    } else {
      destajosCheck.rows.forEach(r => {
        console.log(` - ${r.column_name} (${r.data_type}, nullable: ${r.is_nullable})`);
      });
    }

    const renglonCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'erp_destajos'
        AND column_name = 'renglon_codigo'
    `);
    console.log('\nrenglon_codigo exists:', renglonCheck.rows.length > 0 ? 'YES' : 'NO');

    const idxCheck = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'erp_destajos'
    `);
    console.log('\nIndexes on erp_destajos:');
    idxCheck.rows.forEach(r => console.log(' -', r.indexname, ':', r.indexdef));

    const rowCount = await client.query('SELECT count(*) FROM public.erp_destajos');
    console.log('\nRow count in erp_destajos:', rowCount.rows[0].count);

    await client.end();
    console.log('\n✅ Verification complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

checkSupabase();
