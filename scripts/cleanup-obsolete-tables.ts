import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54260/postgres';

// Tablas que se pueden eliminar seguras (no se usan en la aplicación)
const OBSOLETE_TABLES = [
  'erp_empresas', // No se usa, empresas están en cotizaciones
  'erp_empresas_secure', // Duplicado seguro
  'erp_usuarios', // Los usuarios están en auth.users
  'erp_licitaciones', // Se usa erp_cuadros
  'erp_auditoria', // Se usa erp_audit_log
  'erp_error_log_recent', // Vista temporal
  'erp_error_log_stats', // Vista temporal
  'erp_error_logs', // Duplicado de erp_error_log
  'erp_audit_log_summary', // Vista temporal
  'erp_muro_likes', // Likes están en erp_publicaciones_muro
  'erp_empleados_proyectos', // Se usa proyecto_ids array en erp_empleados
  'erp_materiales_proyectos', // No se usa
  'erp_licitaciones', // Duplicado
  'erp_recepciones', // Se usa erp_recepciones_almacen
  'erp_sub_renglones', // Subrenglones están en jsonb de presupuestos
  'erp_liberaciones_partida', // Parte de calidad, integrado en otros schemas
  'erp_no_conformidades', // Parte de calidad, integrado en otros schemas
  'erp_incidentes_sso', // Duplicado SSO
  'erp_solicitudes', // No se usa
  'erp_solicitudes_cambio_empresa', // Solicitudes internas
  'erp_backup_config', // Configuración externa
  'erp_monitoring_config', // Configuración externa
];

async function cleanupObsoleteTables() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log(`=== LIMPIEZA DE TABLAS OBSOLETAS ===\n`);
    console.log(`Tablas a eliminar: ${OBSOLETE_TABLES.length}\n`);

    for (const table of OBSOLETE_TABLES) {
      try {
        // Verificar si la tabla existe
        const exists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);

        if (!exists.rows[0].exists) {
          console.log(`⚠️ ${table}: no existe, salto`);
          continue;
        }

        // Verificar si tiene datos
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);

        if (count > 0) {
          console.log(`⚠️ ${table}: tiene ${count} registros, NO ELIMINO`);
          continue;
        }

        // Eliminar la tabla
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ ${table}: eliminada`);
      } catch (err) {
        console.log(`❌ ${table}: error - ${err.message}`);
      }
    }

    console.log('\n=== LIMPIEZA DE POLÍTICAS RLS HUÉRFANAS ===\n');

    // Eliminar políticas RLS de tablas que ya no existen
    const policies = await client.query(`
      SELECT schemaname, tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `);

    let policiesRemoved = 0;
    for (const policy of policies.rows) {
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [policy.tablename]);

      if (!tableExists.rows[0].exists) {
        try {
          await client.query(`
            DROP POLICY IF EXISTS "${policy.policyname}" ON "public"."${policy.tablename}"
          `);
          console.log(`✅ Política "${policy.policyname}" eliminada (tabla ${policy.tablename} no existe)`);
          policiesRemoved++;
        } catch (err) {
          console.log(`❌ Error eliminando política "${policy.policyname}": ${err.message}`);
        }
      }
    }

    if (policiesRemoved === 0) {
      console.log('✅ No hay políticas RLS huérfanas');
    }

    console.log('\n=== LIMPIEZA COMPLETADA ===\n');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

cleanupObsoleteTables();