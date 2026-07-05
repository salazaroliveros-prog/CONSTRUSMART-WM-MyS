import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const { Client } = pg;

async function migrateWeatherTable() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set');
    console.error('Example: VITE_SUPABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"');
    console.error('         VITE_SUPABASE_SERVICE_ROLE_KEY="[service-role-key]"');
    process.exit(1);
  }

  const client = new Client({
    connectionString: supabaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');

    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '000000000072_create_erp_proyecto_weather.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📋 Reading migration file...');
    console.log(`   Path: ${migrationPath}`);

    // Execute the migration
    console.log('\n🚀 Executing migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration executed successfully\n');

    // Verify the table was created
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'erp_proyecto_weather'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Table erp_proyecto_weather created successfully');
    } else {
      console.log('⚠️  Table verification failed - may already exist');
    }

    console.log('\n📋 Next steps:');
    console.log('   1. Run verification: npm run verify:weather');
    console.log('   2. Test the Weather screen in the application');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      if (error.message.includes('already exists')) {
        console.log('\n💡 The table already exists. This is normal if the migration was run before.');
        console.log('   You can skip this error or run npm run verify:weather to check the current state.');
      }
    }
    throw error;
  } finally {
    await client.end();
  }
}

migrateWeatherTable().catch(console.error);
