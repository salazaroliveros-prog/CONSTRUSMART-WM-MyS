const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client('postgresql://postgres.neygzluxugodiwcuctbj:AngelDario2027@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable');

async function dump(label, sql, params = []) {
  const res = await client.query(sql, params);
  fs.writeFileSync(path.join('tmp', label + '.json'), JSON.stringify(res.rows, null, 2));
  console.log(label + ':', res.rows.length, 'rows');
}

async function main() {
  if (!fs.existsSync('tmp')) fs.mkdirSync('tmp');
  await client.connect();
  console.log('Connected');

  await dump('tables', `
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  await dump('views', `
    SELECT table_name FROM information_schema.views
    WHERE table_schema = 'public' ORDER BY table_name;
  `);

  await dump('rls', `
    SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
    FROM pg_class c
    WHERE c.relkind = 'r' AND c.relnamespace = 'public'::regnamespace
    ORDER BY c.relname;
  `);

  await dump('policies', `
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, cmd, policyname;
  `);

  await dump('grants', `
    SELECT grantee, table_name, privilege_type, is_grantable
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
    ORDER BY table_name, grantee, privilege_type;
  `);

  await dump('functions', `
    SELECT p.proname, n.nspname, pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public', 'auth', 'realtime', 'storage', 'graphql_public')
    ORDER BY n.nspname, p.proname;
  `);

  await dump('enums', `
    SELECT t.typname, e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    ORDER BY t.typname, e.enumsortorder;
  `);

  await dump('indexes', `
    SELECT indexname, tablename, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);

  await dump('realtime', `
    SELECT schemaname, tablename, public.insert as insert, public.update as update, public.delete as delete
    FROM pg_publication_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  await dump('fk', `
    SELECT tc.constraint_name, tc.table_name, kcu.column_name,
           ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
  `);

  await client.end();
  console.log('Done');
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
