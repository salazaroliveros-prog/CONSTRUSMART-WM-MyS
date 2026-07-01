import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../../.env.local');
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

async function verificarEsquema() {
  console.log('🔍 Verificando esquema de tablas...\n');

  const tablas = ['erp_departamentos_gt', 'erp_dosificaciones_concreto', 'erp_referencias_acero'];

  for (const tabla of tablas) {
    try {
      const { data, error } = await supabase
        .from(tabla as any)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`❌ ${tabla}: ${error.message}`);
      } else {
        console.log(`✅ ${tabla}: Esquema OK`);
        
        // Mostrar columnas
        if (data && data.length > 0) {
          const columnas = Object.keys(data[0]);
          console.log(`   Columnas: ${columnas.join(', ')}`);
        }
      }
    } catch (error: any) {
      console.log(`❌ ${tabla}: ${error.message}`);
    }
  }
}

verificarEsquema().catch(console.error);