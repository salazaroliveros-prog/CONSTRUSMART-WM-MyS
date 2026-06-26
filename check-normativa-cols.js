import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const supabaseKey = 'JWT_ANON_KEY_PLACEHOLDER';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCumplimientoColumns() {
  const { data, error } = await supabase
    .from('erp_cumplimiento_normativo')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in erp_cumplimiento_normativo:');
    Object.keys(data[0]).forEach(col => console.log(`  - ${col}`));
  } else {
    console.log('No data in table');
  }
}

checkCumplimientoColumns();
