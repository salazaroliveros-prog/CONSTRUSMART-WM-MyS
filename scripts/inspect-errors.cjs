const { Client } = require('pg');
const fs = require('fs');

function loadEnv() {
  const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);
  const env = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
const connStr = env['CONEXION SPRIN'] || env.CONEXION_SPRIN || env['CONEXION_SPRIN'] || '';
if (!connStr) { console.error('No hay CONEXION SPRIN en .env'); process.exit(1); }

const client = new Client({ connectionString: connStr });

async function main() {
  await client.connect();
  console.log('Conectado\n');

  const tablas = ['erp_presupuestos','erp_movimientos','erp_empleados','erp_avances',
    'erp_hitos','erp_riesgos','erp_bitacora','erp_licitaciones','erp_cotizaciones_negocio',
    'erp_vales_salida','erp_notificaciones','erp_incidentes','erp_liberaciones_partida',
    'erp_pruebas_laboratorio','erp_no_conformidades','erp_ordenes_cambio'];

  for (const t of tablas) {
    console.log(`\n=== ${t} ===`);
    
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [t]);
    for (const c of cols.rows) {
      console.log(`  ${c.column_name} (${c.data_type}${c.is_nullable==='NO'?' NOT NULL':''}${c.column_default?' DEFAULT '+c.column_default:''})`);
    }

    const checks = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE conrelid = $1::regclass AND contype = 'c'
    `, [t]);
    for (const ch of checks.rows) {
      console.log(`  CHECK: ${ch.def}`);
    }

    const fks = await client.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      WHERE conrelid = $1::regclass AND contype = 'f'
    `, [t]);
    for (const fk of fks.rows) {
      console.log(`  FK: ${fk.def}`);
    }
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
