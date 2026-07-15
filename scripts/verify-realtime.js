// Script para verificar Realtime automáticamente
import pg from 'pg';

// Usar variable de entorno o placeholder
const DB_URL = process.env.DATABASE_URL || 'postgresql://user:password@host:5432/database';

async function verifyRealtime() {
  const client = new pg.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
  });

  try {
    console.log('Conectando a PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado\n');
    
    console.log('=== VERIFICACIÓN DE REALTIME ===\n');
    
    // Verificar que la publicación existe
    const pubQuery = `
      SELECT pubname 
      FROM pg_publication 
      WHERE pubname = 'supabase_realtime'
    `;
    
    const pubResult = await client.query(pubQuery);
    
    if (pubResult.rows.length > 0) {
      console.log('✅ Publicación supabase_realtime existe');
    } else {
      console.log('❌ Publicación supabase_realtime NO existe');
    }
    
    // Verificar tablas en la publicación
    const tablesQuery = `
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
      ORDER BY tablename
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    console.log(`\nTablas en supabase_realtime: ${tablesResult.rows.length}\n`);
    
    for (const row of tablesResult.rows) {
      console.log(`✅ ${row.tablename}`);
    }
    
    // Verificar tablas geográficas específicas
    console.log('\n=== VERIFICACIÓN TABLAS GEOLÓFICAS ===\n');
    
    const geoTables = ['erp_departamentos_gt', 'erp_municipios_gt'];
    
    for (const tableName of geoTables) {
      const checkQuery = `
        SELECT tablename 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND tablename = $1
      `;
      
      const checkResult = await client.query(checkQuery, [tableName]);
      
      if (checkResult.rows.length > 0) {
        console.log(`✅ ${tableName}: Habilitada en Realtime`);
      } else {
        console.log(`❌ ${tableName}: NO habilitada en Realtime`);
      }
    }
    
    console.log('\n=== RESUMEN ===');
    console.log(`Total tablas en Realtime: ${tablesResult.rows.length}`);
    
    if (tablesResult.rows.length > 0) {
      console.log('✅ Realtime está configurado');
    } else {
      console.log('⚠️  No hay tablas en Realtime');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyRealtime();
