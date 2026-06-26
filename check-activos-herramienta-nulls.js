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

console.log('🔍 Checking NULL proyecto_id records in erp_activos_herramienta...\n');

async function checkNullRecords() {
  try {
    const sql = `
      SELECT 
        id,
        nombre,
        codigo_inventario,
        proyecto_id,
        created_at
      FROM erp_activos_herramienta
      WHERE proyecto_id IS NULL
    `;
    
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
      console.log('✅ Records with NULL proyecto_id:', data.length);
      if (data.length > 0) {
        data.forEach(r => {
          console.log(`   - ID: ${r.id}, herramienta_id: ${r.herramienta_id}, proyecto_id: ${r.proyecto_id}`);
        });
      }
    } else {
      console.log('⚠️  Error:', await response.text());
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkNullRecords();
