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

if (!connStr) {
  console.error('No hay CONEXION SPRIN en .env');
  process.exit(1);
}

const client = new Client({ connectionString: connStr });

async function main() {
  await client.connect();
  console.log('✅ Conectado a PostgreSQL\n');
  
  console.log('=== ESQUEMA REAL DE TABLAS ERP ===\n');
  
  const tables = [
    'erp_proyectos', 'erp_presupuestos', 'erp_movimientos', 'erp_empleados',
    'erp_materiales', 'erp_avances', 'erp_seguimiento', 'erp_hitos',
    'erp_riesgos', 'erp_proveedores', 'erp_ordenes_compra', 'erp_bitacora',
    'erp_eventos_calendario', 'erp_publicaciones_muro', 'erp_cuentas_cobrar',
    'erp_cuentas_pagar', 'erp_licitaciones', 'erp_cotizaciones_negocio',
    'erp_vales_salida', 'erp_notificaciones', 'erp_incidentes',
    'erp_liberaciones_partida', 'erp_planos', 'erp_rfis',
    'erp_submittals', 'erp_activos_herramientas', 'erp_cuadros_comparativos',
    'erp_pagos_proveedor', 'erp_muro', 'cuadro_comparativo_proveedores',
    'erp_ordenes_cambio', 'erp_pruebas_laboratorio', 'erp_no_conformidades'
  ];

  for (const t of tables) {
    try {
      const r = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `, [t]);
      if (r.rows.length === 0) {
        console.log(`❌ ${t}: TABLA NO EXISTE`);
      } else {
        console.log(`✅ ${t} (${r.rows.length} columnas):`);
        for (const col of r.rows.slice(0, 15)) {
          console.log(`     ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''})`);
        }
        if (r.rows.length > 15) console.log(`     ... y ${r.rows.length - 15} más`);
      }
    } catch (err) {
      console.log(`❌ ${t}: ${err.message.slice(0, 60)}`);
    }
    console.log('');
  }

  console.log('\n=== VERIFICANDO VISTAS Y POLICIES RLS ===\n');
  
  const { rows: views } = await client.query(`
    SELECT table_name, view_definition
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name IN ('erp_publicaciones_muro','erp_cuadros_comparativos','erp_incidentes_sso','erp_activos_herramienta')
  `);
  console.log('Vistas encontradas:', views.length);
  for (const v of views) {
    console.log(`  - ${v.table_name}`);
  }

  const { rows: policies } = await client.query(`
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE tablename = 'erp_empleados'
  `);
  console.log('\nPolicies en erp_empleados:', policies.length);
  for (const p of policies) {
    console.log(`  - ${p.policyname} (${p.cmd})`);
  }

  await client.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
