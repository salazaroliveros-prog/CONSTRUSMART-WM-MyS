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
  console.log('🔧 Corrigiendo estado de proyecto (planeacion -> planificacion)...');

  const { data, error } = await supabase
    .from('erp_proyectos')
    .update({ estado: 'planificacion' })
    .eq('id', 'b66a3eb7-0439-4488-bf2b-f29bc46be12e')
    .select();

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('✅ Estado corregido:');
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
