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
  console.log('🔍 Verificando constraints existentes en erp_proyectos...\n');

  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'erp_proyectos' });

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('Constraints:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
