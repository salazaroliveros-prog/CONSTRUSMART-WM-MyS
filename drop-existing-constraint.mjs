import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🔧 Eliminando constraint existente erp_proyectos_estado_check...');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE erp_proyectos DROP CONSTRAINT IF EXISTS erp_proyectos_estado_check;'
  });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('✅ Constraint eliminado:', data);
}

main().catch(console.error);
