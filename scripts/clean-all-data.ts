import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function cleanAllData() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('=== ELIMINANDO TODOS LOS DATOS DE PRUEBA ===\n');

    // Primero identificar todas las tablas ERP existentes
    const allTablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'erp_%'
      ORDER BY table_name
    `);

    const allTables = allTablesResult.rows.map(row => row.table_name);
    console.log(`📊 Encontradas ${allTables.length} tablas ERP\n`);

    // Tablas principales a truncar con CASCADE (esto elimina también los datos en tablas hijas)
    const mainTables = [
      'erp_proyectos',
      'erp_presupuestos',
      'erp_empleados',
      'erp_materiales',
      'erp_proveedores',
      'erp_movimientos',
      'erp_ordenes_compra',
      'erp_departamentos_gt',
    ];

    let totalDeleted = 0;

    // Primero truncar las tablas principales con CASCADE
    for (const tableName of mainTables) {
      if (!allTables.includes(tableName)) {
        console.log(`⏭️  ${tableName}: no existe, saltando`);
        continue;
      }

      try {
        // Contar registros antes de truncar
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = parseInt(countResult.rows[0].count);

        if (count === 0) {
          console.log(`✅ ${tableName}: ya está vacía (${count} registros)`);
          continue;
        }

        // TRUNCATE con CASCADE elimina datos de esta tabla y todas las que dependen de ella
        await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);

        totalDeleted += count;
        console.log(`🗑️  ${tableName}: ${count} registros eliminados (con CASCADE)`);
      } catch (err) {
        console.log(`⚠️  ${tableName}: error - ${err.message}`);
      }
    }

    // Luego limpiar las tablas restantes que no fueron afectadas por CASCADE
    const remainingTables = allTables.filter(t => !mainTables.includes(t));

    for (const tableName of remainingTables) {
      try {
        // Contar registros
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = parseInt(countResult.rows[0].count);

        if (count === 0) {
          console.log(`✅ ${tableName}: ya está vacía (${count} registros)`);
          continue;
        }

        // Usar DELETE para tablas sin datos importantes
        await client.query(`DELETE FROM ${tableName}`);

        totalDeleted += count;
        console.log(`🗑️  ${tableName}: ${count} registros eliminados`);
      } catch (err) {
        console.log(`⚠️  ${tableName}: error - ${err.message}`);
      }
    }

    console.log(`\n📊 Total de registros eliminados: ${totalDeleted}`);

    // Resetear secuencias de auto-incremento
    console.log('\n=== RESET DE SECUENCIAS ===\n');

    for (const tableName of allTables) {
      try {
        // Obtener el nombre de la secuencia
        const seqResult = await client.query(`
          SELECT pg_get_serial_sequence($1, 'id') as seq
        `, [tableName]);

        if (seqResult.rows[0].seq) {
          const seqName = seqResult.rows[0].seq;
          await client.query(`ALTER SEQUENCE ${seqName} RESTART WITH 1`);
          console.log(`🔄 ${tableName}: secuencia reseteada`);
        }
      } catch (err) {
        // Ignorar errores de secuencias (algunas tablas pueden no tener serial)
      }
    }

    // Resetear la tabla de migraciones (no eliminar, solo para info)
    const migrations = await client.query(`
      SELECT COUNT(*) as count
      FROM supabase_migrations.schema_migrations
    `);
    console.log(`\n📋 Migraciones aplicadas: ${migrations.rows[0].count} (mantenidas)`);

    console.log('\n✅ LIMPIEZA COMPLETADA');
    console.log('✅ Todas las tablas ERP están vacías');
    console.log('✅ Secuencias reseteadas a 1');
    console.log('✅ Los KPIs y gráficas mostrarán 0 hasta crear datos reales');

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

cleanAllData();
