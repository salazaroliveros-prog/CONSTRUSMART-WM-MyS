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

console.log('🔍 Checking which tables have proyecto_id column...\n');

async function checkProyectoIdColumns() {
  try {
    const sql = `
      SELECT 
        t.table_name
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      AND t.table_name LIKE 'erp_%'
      AND t.table_type = 'BASE TABLE'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = t.table_name
        AND c.column_name = 'proyecto_id'
      )
      ORDER BY t.table_name
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
      console.log('✅ Tables with proyecto_id column:');
      data.forEach(t => {
        console.log(`   - ${t.table_name}`);
      });
    } else {
      console.log('⚠️  Error:', await response.text());
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkProyectoIdColumns();
