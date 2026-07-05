import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env.local');
let supabaseUrl = '';
let supabaseKey = '';
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (t.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = t.slice('VITE_SUPABASE_URL='.length).trim();
    else if (t.startsWith('VITE_SUPABASE_KEY=')) supabaseKey = t.slice('VITE_SUPABASE_KEY='.length).trim();
  }
}
if (!supabaseKey) throw new Error('VITE_SUPABASE_KEY not found in .env.local');
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
