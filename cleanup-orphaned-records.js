import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const supabaseKey = 'JWT_ANON_KEY_PLACEHOLDER';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupOrphanedRecords() {
  console.log('Checking for orphaned records in activos_herramientas...');

  const { data: herramientas, error } = await supabase
    .from('activos_herramientas')
    .select('id, proyecto_id');

  if (error) {
    console.error('Error fetching herramientas:', error);
    return;
  }

  console.log(`Total records in activos_herramientas: ${herramientas.length}`);

  const { data: proyectos } = await supabase
    .from('erp_proyectos')
    .select('id');

  const proyectoIds = new Set(proyectos?.map(p => p.id) || []);
  console.log(`Total proyectos: ${proyectoIds.size}`);

  const orphaned = herramientas.filter(h => h.proyecto_id && !proyectoIds.has(h.proyecto_id));
  console.log(`Orphaned records found: ${orphaned.length}`);

  if (orphaned.length > 0) {
    console.log('Deleting orphaned records...');
    const idsToDelete = orphaned.map(h => h.id);
    
    const { error: deleteError } = await supabase
      .from('activos_herramientas')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('Error deleting orphaned records:', deleteError);
    } else {
      console.log(`Successfully deleted ${orphaned.length} orphaned records`);
    }
  }

  console.log('Cleanup complete');
}

cleanupOrphanedRecords();
