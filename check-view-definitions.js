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

console.log('🔍 Checking view definitions...\n');

async function checkViewDefinitions() {
  try {
    const views = ['erp_activos_herramienta', 'erp_cuadros_comparativos', 'erp_incidentes_sso', 'erp_publicaciones_muro'];
    
    for (const view of views) {
      const sql = `
        SELECT 
          view_definition
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND table_name = '${view}'
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
        if (data.length > 0) {
          console.log(`👁️  ${view}:`);
          console.log(`   ${data[0].view_definition.substring(0, 200)}...`);
        }
      } else {
        console.log(`⚠️  Error for ${view}:`, await response.text());
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkViewDefinitions();
