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

console.log('🔍 Checking columns in base tables...\n');

async function checkColumns() {
  try {
    const tables = ['activos_herramientas', 'cuadro_comparativo_proveedores'];
    
    for (const table of tables) {
      const sql = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '${table}'
        ORDER BY ordinal_position
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
        console.log(`✅ ${table}:`);
        data.forEach(c => {
          console.log(`   - ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`);
        });
      } else {
        console.log(`⚠️  Error for ${table}:`, await response.text());
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkColumns();
