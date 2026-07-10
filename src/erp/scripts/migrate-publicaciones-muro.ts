import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migratePublicacionesMuro() {
  try {
    console.log('🚀 Creating erp_publicaciones_muro table...\n');

    // Leer el archivo de migración
    const migrationPath = './supabase/migrations/000000000090_create_erp_publicaciones_muro_table.sql';
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Ejecutar la migración usando RPC (si está disponible) o dividir en statements
    console.log('📝 Executing SQL migration...');
    
    // Dividir el SQL en statements individuales
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 50)}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Si RPC no está disponible, intentar con la API REST directa
        console.log('⚠️  RPC not available, skipping direct execution');
        console.log('📝 Please execute the migration manually in Supabase SQL Editor:');
        console.log(`\nFile: ${migrationPath}\n`);
        console.log('Or use: supabase db push');
        break;
      }
      
      console.log('✅ Statement executed successfully');
    }

    // Verificar si la tabla fue creada
    console.log('\n🔍 Verifying table creation...');
    const { data: testData, error: testError } = await supabase
      .from('erp_publicaciones_muro')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Table still not accessible:', testError.message);
      console.log('\n📋 MANUAL MIGRATION REQUIRED:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Copy the content of:', migrationPath);
      console.log('3. Execute the SQL script');
      console.log('4. Verify table creation in Table Editor');
    } else {
      console.log('✅ Table erp_publicaciones_muro created and accessible');
      console.log('🎉 Migration successful!');
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

migratePublicacionesMuro().catch(console.error);