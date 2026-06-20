const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:AngelDario.2026@aws-1-us-east-1.pooler.supabase.com:5432/postgres';

async function insertarSeedData() {
  const pool = new Pool({
    connectionString,
    ssl: true
  });

  try {
    console.log('Insertando seed data en erp_reglas_factores usando psql...\n');

    const client = await pool.connect();
    console.log('✅ Conectado exitosamente a Supabase\n');

    // Seed data SQL
    const seedSQL = `
      INSERT INTO erp_reglas_factores (nombre, descripcion, tipo_factor, prioridad, condicion, factor_aplicacion, operador, ambito)
      VALUES 
        ('Factor Zona Guatemala', 'Factor base para zona metropolitana Guatemala', 'zona', 10, '{"departamento": "Guatemala"}'::jsonb, 1.0, 'multiplicar', 'departamento'),
        ('Factor Zona Quetzaltenango', 'Factor para altitudes mayores de 2000msnm', 'zona', 10, '{"departamento": "Quetzaltenango", "altitud": {"operador": "mayor", "valor": "2000"}}'::jsonb, 1.12, 'multiplicar', 'departamento'),
        ('Factor Zona Escuintla', 'Factor para zona industrial y caliente', 'zona', 10, '{"departamento": "Escuintla"}'::jsonb, 1.08, 'multiplicar', 'departamento'),
        ('Factor Tipología Residencial', 'Factor base para proyectos residenciales', 'tipologia', 20, '{"tipologia": "residencial"}'::jsonb, 1.0, 'multiplicar', 'global'),
        ('Factor Tipología Comercial', 'Factor para proyectos comerciales', 'tipologia', 20, '{"tipologia": "comercial"}'::jsonb, 1.15, 'multiplicar', 'global'),
        ('Factor Tipología Industrial', 'Factor para proyectos industriales complejos', 'tipologia', 20, '{"tipologia": "industrial"}'::jsonb, 1.35, 'multiplicar', 'global'),
        ('Sobrecosto Estandar', 'Factor de sobrecosto estandar (32%)', 'sobrecosto', 30, '{}'::jsonb, 1.32, 'multiplicar', 'global'),
        ('Factor Clima Frío', 'Ajuste por clima frío (>2000msnm)', 'climatico', 15, '{"altitud": {"operador": "mayor", "valor": "2000"}}'::jsonb, 1.05, 'multiplicar', 'departamento'),
        ('Factor Clima Caliente', 'Ajuste por clima caliente (<500msnm)', 'climatico', 15, '{"altitud": {"operador": "menor", "valor": "500"}}'::jsonb, 1.03, 'multiplicar', 'departamento')
      ON CONFLICT DO NOTHING;
    `;

    await client.query(seedSQL);
    console.log('✅ Seed data insertado exitosamente\n');

    // Verificar cantidad total
    const result = await client.query('SELECT COUNT(*) FROM erp_reglas_factores');
    console.log(`Total de reglas en base de datos: ${result.rows[0].count}`);

    await client.release();
    await pool.end();

    console.log('\n✅ Seed data completado');
    process.exit(0);
  } catch (error) {
    console.error('Error ejecutando seed data:', error.message);
    await pool.end();
    process.exit(1);
  }
}

insertarSeedData();