import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres:127.0.0.1:54322/postgres';

async function fixMissingAuditColumns() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('=== IDENTIFICANDO TABLAS SIN AUDITORÍA COMPLETA ===\n');

    // Obtener todas las tablas ERP
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'erp_%'
      ORDER BY table_name
    `);

    const tablesNeedingAudit = [];

    for (const row of tables.rows) {
      const tableName = row.table_name;

      // Verificar si tiene created_at
      const hasCreatedAt = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = 'created_at'
        );
      `, [tableName]);

      // Verificar si tiene updated_at
      const hasUpdatedAt = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
            AND column_name = 'updated_at'
        );
      `, [tableName]);

      if (!hasCreatedAt.rows[0].exists || !hasUpdatedAt.rows[0].exists) {
        tablesNeedingAudit.push({
          table: tableName,
          hasCreatedAt: hasCreatedAt.rows[0].exists,
          hasUpdatedAt: hasUpdatedAt.rows[0].exists
        });
      }
    }

    console.log(`Tablas que necesitan columnas de auditoría: ${tablesNeedingAudit.length}\n`);

    if (tablesNeedingAudit.length === 0) {
      console.log('✅ Todas las tablas tienen auditoría completa');
      await client.end();
      process.exit(0);
    }

    // Añadir columnas faltantes
    console.log('=== AÑADIENDO COLUMNAS DE AUDITORÍA ===\n');

    for (const { table, hasCreatedAt, hasUpdatedAt } of tablesNeedingAudit) {
      try {
        if (!hasCreatedAt) {
          await client.query(`
            ALTER TABLE ${table}
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          `);
          console.log(`✅ ${table}: created_at añadida`);
        }

        if (!hasUpdatedAt) {
          await client.query(`
            ALTER TABLE ${table}
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          `);
          console.log(`✅ ${table}: updated_at añadida`);
        }

        // Crear trigger para updated_at si no existe
        const triggerExists = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.triggers
            WHERE trigger_schema = 'public'
              AND event_object_table = $1
              AND trigger_name = 'trg_' || $1 || '_updated_at'
          );
        `, [table]);

        if (!triggerExists.rows[0].exists && hasUpdatedAt === false) {
          await client.query(`
            CREATE OR REPLACE FUNCTION trg_update_timestamp()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
          `);

          await client.query(`
            CREATE TRIGGER trg_${table}_updated_at
            BEFORE UPDATE ON ${table}
            FOR EACH ROW
            EXECUTE FUNCTION trg_update_timestamp()
          `);
          console.log(`✅ ${table}: trigger updated_at creado`);
        }

      } catch (err) {
        console.log(`❌ ${table}: error - ${err.message}`);
      }
    }

    console.log('\n=== VERIFICACIÓN FINAL ===\n');

    const finalTablesWithAudit = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_name LIKE 'erp_%'
        AND EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema = 'public'
            AND c.table_name = t.table_name
            AND c.column_name = 'created_at'
        )
        AND EXISTS (
          SELECT 1 FROM information_schema.columns c
          WHERE c.table_schema = 'public'
            AND c.table_name = t.table_name
            AND c.column_name = 'updated_at'
        )
    `);

    console.log(`Tablas con auditoría completa: ${finalTablesWithAudit.rows[0].count}/${tables.rows.length}`);

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

fixMissingAuditColumns();