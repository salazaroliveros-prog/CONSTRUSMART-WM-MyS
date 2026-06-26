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

console.log('🔍 Checking for base tables that might correspond to views...\n');

async function checkBaseTables() {
  try {
    const sql = `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (table_name LIKE '%herramienta%' 
           OR table_name LIKE '%cuadro%'
           OR table_name LIKE '%incidente%'
           OR table_name LIKE '%muro%')
      ORDER BY table_name
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
      console.log('✅ Related tables:');
      data.forEach(t => {
        console.log(`   ${t.table_type}: ${t.table_name}`);
      });
    } else {
      console.log('⚠️  Error:', await response.text());
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkBaseTables();
