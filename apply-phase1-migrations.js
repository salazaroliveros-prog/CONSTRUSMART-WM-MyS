import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const SUPABASE_URL = envContent
  .split('\n')
  .find(line => line.startsWith('VITE_SUPABASE_URL='))
  ?.split('=')[1]
  .trim();

const SUPABASE_TOKEN = envContent
  .split('\n')
  .find(line => line.startsWith('SUPABASE_TOKEN='))
  ?.split('=')[1]
  .trim();

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

console.log('🚀 Applying Phase 1 Database Migrations...\n');

async function applyMigration(migrationName, sql) {
  try {
    console.log(`📝 Applying ${migrationName}...`);
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${migrationName} applied successfully`);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ ${migrationName} failed:`, error);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error applying ${migrationName}:`, error);
    return false;
  }
}

async function applyPhase1Migrations() {
  try {
    // Read migration files
    const migration047 = readFileSync('supabase/migrations/000000000047_fix_nullable_columns.sql', 'utf-8');
    const migration048 = readFileSync('supabase/migrations/000000000048_add_missing_indexes.sql', 'utf-8');

    // Apply Migration 047
    const success047 = await applyMigration('Migration 047 - Fix Nullable Columns', migration047);
    
    if (!success047) {
      console.log('\n⚠️  Migration 047 failed. Stopping. Check rollback script.');
      return;
    }

    // Apply Migration 048
    const success048 = await applyMigration('Migration 048 - Add Missing Indexes', migration048);
    
    if (!success048) {
      console.log('\n⚠️  Migration 048 failed. Migration 047 was applied successfully.');
      console.log('You may need to rollback Migration 048 only.');
      return;
    }

    console.log('\n✅ Phase 1 migrations completed successfully!');
    console.log('\n📊 Next steps:');
    console.log('   1. Test the application to ensure compatibility');
    console.log('   2. Monitor query performance improvements');
    console.log('   3. Proceed to Phase 2 (Foreign Keys) when ready');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

applyPhase1Migrations();
