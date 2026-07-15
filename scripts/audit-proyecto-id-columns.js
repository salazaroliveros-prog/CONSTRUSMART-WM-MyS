// Script de auditoría: Verificar qué tablas tienen proyecto_id
import pg from 'pg';

// Usar variable de entorno o placeholder
const DB_URL = process.env.DATABASE_URL || 'postgresql://user:password@host:5432/database';

async function auditColumns() {
  const client = new pg.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
  });

  try {
    console.log('Conectando a PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado\n');
    
    // Obtener todas las tablas erp_*
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'erp_%'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const tables = tablesResult.rows;
    
    console.log(`=== AUDITORÍA DE COLUMNAS proyecto_id ===`);
    console.log(`Total tablas erp_*: ${tables.length}\n`);
    
    let countWithProyectoId = 0;
    
    for (const table of tables) {
      const columnQuery = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = 'proyecto_id'
      `;
      
      const columnResult = await client.query(columnQuery, [table.table_name]);
      
      if (columnResult.rows.length > 0) {
        countWithProyectoId++;
        const colInfo = columnResult.rows[0];
        console.log(`✅ ${table.table_name} - tiene proyecto_id (${colInfo.data_type})`);
      } else {
        console.log(`❌ ${table.table_name} - NO tiene proyecto_id`);
      }
    }
    
    console.log(`\n=== RESUMEN ===`);
    console.log(`Tablas con proyecto_id: ${countWithProyectoId}`);
    console.log(`Tablas sin proyecto_id: ${tables.length - countWithProyectoId}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

auditColumns();
