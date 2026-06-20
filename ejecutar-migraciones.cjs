// Script para ejecutar migraciones SQL directamente en Supabase usando node-postgres
const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:AngelDario.2026@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function ejecutarMigraciones() {
  const pool = new Pool({
    connectionString,
    ssl: true
  });

  try {
    console.log('Conectando a Supabase...');
    const client = await pool.connect();
    console.log('✅ Conectado exitosamente a Supabase\n');

    // Leer el archivo SQL
    const fs = require('fs');
    const sql = fs.readFileSync('./supabase-migrations-pendientes.sql', 'utf8');

    // Dividir el SQL en bloques separados por punto y coma
    const bloques = sql
      .split(';')
      .map(bloque => bloque.trim())
      .filter(bloque => bloque.length > 0 && !bloque.startsWith('--'))
      .map(bloque => bloque + ';');

    console.log(`Ejecutando ${bloques.length} bloques SQL...\n`);

    for (let i = 0; i < bloques.length; i++) {
      const bloque = bloques[i];
      try {
        if (bloque.trim().length > 10) {
          await client.query(bloque);
          console.log(`✅ Bloque ${i + 1}/${bloques.length}: Ejecutado correctamente`);
        }
      } catch (error) {
        console.log(`⚠️  Bloque ${i + 1}/${bloques.length}: ${error.message}`);
        // Continuar con el siguiente bloque
      }
    }

    console.log('\n=== Verificando tablas creadas ===');
    
    const tablas = [
      'erp_reglas_factores',
      'erp_historial_aplicacion_reglas',
      'erp_snapshots_estado_calculo',
      'erp_cumplimiento_normativo',
      'erp_aplicacion_escalas',
      'erp_ajustes_estacionales_actividad'
    ];

    for (const tabla of tablas) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tabla}`);
        console.log(`✅ Tabla ${tabla}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.log(`❌ Tabla ${tabla}: ${error.message}`);
      }
    }

    await client.release();
    await pool.end();
    
    console.log('\n✅ Migraciones completadas');
    process.exit(0);
  } catch (error) {
    console.error('Error ejecutando migraciones:', error);
    await pool.end();
    process.exit(1);
  }
}

ejecutarMigraciones();