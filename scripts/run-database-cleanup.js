// Script para ejecutar SIMPLE_DATABASE_CLEANUP.sql automáticamente
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connection string PostgreSQL Shared Pooler (formato correcto de Supabase)
const DB_URL = 'postgresql://postgres.neygzluxugodiwcuctbj:AngelDario2027@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function executeSQLScript() {
  const client = new pg.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    // Forzar IPv4 para evitar problemas de resolución IPv6
    family: 4
  });

  try {
    console.log('Conectando a PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado');
    
    console.log('Leyendo script SQL...');
    const scriptPath = path.join(__dirname, '../supabase/migrations/SIMPLE_DATABASE_CLEANUP.sql');
    const sqlScript = fs.readFileSync(scriptPath, 'utf8');
    
    console.log('Dividiendo script en statements...');
    // Dividir el script en bloques separados por ; y ejecutar cada uno
    const statements = sqlScript
      .split(/;(?=\s*(?:DO|ALTER|CREATE|DROP|INSERT|SELECT|UPDATE|DELETE))/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Ejecutando ${statements.length} statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n[Statement ${i + 1}/${statements.length}]`);
      console.log(statement.substring(0, 80) + '...');
      
      try {
        await client.query(statement);
        console.log('✅ Ejecutado correctamente');
      } catch (err) {
        console.error('Error en statement:', err.message);
        // Continuar con el siguiente statement
      }
    }
    
    console.log('\n✅ Script completado');
  } catch (error) {
    console.error('Error fatal:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeSQLScript();
