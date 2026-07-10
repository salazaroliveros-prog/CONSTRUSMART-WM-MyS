import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 CHECKING ACTUAL SCHEMA OF CRITICAL TABLES\n');

  try {
    // Check erp_proyectos structure
    console.log('1. erp_proyectos structure:');
    const { data: proyectosSample, error: proyectosError } = await supabase
      .from('erp_proyectos')
      .select('*')
      .limit(1);

    if (!proyectosError && proyectosSample && proyectosSample.length > 0) {
      console.log('  ✅ Sample data retrieved');
      console.log('  📋 Columns:', Object.keys(proyectosSample[0]).join(', '));
      console.log('  📊 Sample record:', JSON.stringify(proyectosSample[0], null, 2));
    } else {
      console.log('  ❌ Error:', proyectosError?.message);
    }

    // Check erp_publicaciones_muro structure
    console.log('\n2. erp_publicaciones_muro structure:');
    const { data: muroSample, error: muroError } = await supabase
      .from('erp_publicaciones_muro')
      .select('*')
      .limit(1);

    if (!muroError) {
      if (muroSample && muroSample.length > 0) {
        console.log('  ✅ Sample data retrieved');
        console.log('  📋 Columns:', Object.keys(muroSample[0]).join(', '));
      } else {
        console.log('  ✅ Table exists but is empty');
        console.log('  📋 Cannot determine columns from empty table');
      }
    } else {
      console.log('  ❌ Error:', muroError?.message);
    }

    // Check all proyectos
    console.log('\n3. All proyectos summary:');
    const { data: allProyectos, error: allProyectosError } = await supabase
      .from('erp_proyectos')
      .select('id, nombre, estado');

    if (!allProyectosError && allProyectos) {
      console.log(`  ✅ Found ${allProyectos.length} proyectos`);
      allProyectos.forEach(p => {
        console.log(`    - ${p.nombre} (${p.estado})`);
      });
    } else {
      console.log('  ❌ Error:', allProyectosError?.message);
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkSchema().catch(console.error);