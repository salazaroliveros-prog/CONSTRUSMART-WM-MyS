import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const { Client } = pg;

async function verifyWeatherTable() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set');
    console.error('Example: VITE_SUPABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"');
    process.exit(1);
  }

  const client = new Client({
    connectionString: supabaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');

    console.log('\n📋 VERIFICATION REPORT: erp_proyecto_weather table\n');

    // 1. Check if table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'erp_proyecto_weather'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ Table erp_proyecto_weather does NOT exist');
      console.log('⚠️  Run the migration first: npm run migrate:weather');
      return;
    }

    console.log('✅ Table erp_proyecto_weather exists');

    // 2. Check columns
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'erp_proyecto_weather'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    const expectedColumns = [
      'id', 'proyecto_id', 'weather_data', 'impact', 'construction_metrics',
      'scheduling_windows', 'historical_impact', 'last_updated', 'created_at', 'updated_at'
    ];

    const actualColumns = columns.rows.map(c => c.column_name);
    const missingColumns = expectedColumns.filter(c => !actualColumns.includes(c));

    if (missingColumns.length > 0) {
      console.log(`❌ Missing columns: ${missingColumns.join(', ')}`);
    } else {
      console.log('✅ All expected columns present');
    }

    // 3. Check constraints
    const constraints = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'erp_proyecto_weather'
    `);

    console.log('\n🔒 Constraints:');
    constraints.rows.forEach(constraint => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });

    // 4. Check indexes
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'erp_proyecto_weather'
    `);

    console.log('\n📇 Indexes:');
    indexes.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });

    // 5. Check RLS policies
    const policies = await client.query(`
      SELECT policyname, permissive, roles, cmd
      FROM pg_policies 
      WHERE tablename = 'erp_proyecto_weather'
    `);

    console.log('\n🛡️  RLS Policies:');
    if (policies.rows.length === 0) {
      console.log('❌ No RLS policies found - SECURITY RISK!');
    } else {
      policies.rows.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.roles})`);
      });
      console.log('✅ RLS policies configured');
    }

    // 6. Check triggers
    const triggers = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'erp_proyecto_weather'
    `);

    console.log('\n⚡ Triggers:');
    triggers.rows.forEach(trigger => {
      console.log(`  - ${trigger.trigger_name}: ${trigger.event_manipulation} (${trigger.action_timing})`);
    });

    // 7. Check realtime
    const realtime = await client.query(`
      SELECT * FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'erp_proyecto_weather'
    `);

    console.log('\n📡 Realtime:');
    if (realtime.rows.length === 0) {
      console.log('❌ Table not in supabase_realtime publication');
    } else {
      console.log('✅ Table in supabase_realtime publication');
    }

    // 8. Check foreign key to erp_proyectos
    const fkCheck = await client.query(`
      SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'erp_proyecto_weather'
    `);

    console.log('\n🔗 Foreign Keys:');
    if (fkCheck.rows.length === 0) {
      console.log('❌ No foreign key to erp_proyectos found');
    } else {
      fkCheck.rows.forEach(fk => {
        console.log(`  - ${fk.constraint_name}: ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
      console.log('✅ Foreign key to erp_proyectos configured');
    }

    // 9. Check row count
    const count = await client.query('SELECT COUNT(*) FROM erp_proyecto_weather');
    console.log(`\n📈 Row count: ${count.rows[0].count}`);

    console.log('\n✅ VERIFICATION COMPLETE\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await client.end();
  }
}

verifyWeatherTable().catch(console.error);
