import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54260/postgres';

async function validateDBIntegrity() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('=== VALIDACIÓN DE INTEGRIDAD DE BASE DE DATOS ===\n');

    // 1. Verificar Foreign Keys
    console.log('--- FOREIGN KEYS ---\n');
    const foreignKeys = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name LIKE 'erp_%'
      ORDER BY tc.table_name, tc.constraint_name
    `);

    console.log(`Foreign keys encontradas: ${foreignKeys.rows.length}\n`);

    // Agrupar por tabla
    const fkByTable: Record<string, string[]> = {};
    for (const fk of foreignKeys.rows) {
      if (!fkByTable[fk.table_name]) {
        fkByTable[fk.table_name] = [];
      }
      fkByTable[fk.table_name].push(
        `${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`
      );
    }

    for (const [table, fks] of Object.entries(fkByTable)) {
      console.log(`${table}:`);
      for (const fk of fks) {
        console.log(`  - ${fk}`);
      }
    }

    // 2. Verificar Check Constraints
    console.log('\n--- CHECK CONSTRAINTS ---\n');
    const checkConstraints = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        cc.check_clause
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.check_constraints AS cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.constraint_type = 'CHECK'
        AND tc.table_schema = 'public'
        AND tc.table_name LIKE 'erp_%'
      ORDER BY tc.table_name, tc.constraint_name
    `);

    console.log(`Check constraints encontradas: ${checkConstraints.rows.length}\n`);

    for (const cc of checkConstraints.rows) {
      console.log(`${cc.table_name}.${cc.constraint_name}: ${cc.check_clause}`);
    }

    // 3. Verificar Índices
    console.log('\n--- ÍNDICES ---\n');
    const indexes = await client.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename LIKE 'erp_%'
      ORDER BY tablename, indexname
    `);

    console.log(`Índices encontrados: ${indexes.rows.length}\n`);

    // 4. Verificar RLS Policies
    console.log('\n--- RLS POLICIES ---\n');
    const rlsPolicies = await client.query(`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename LIKE 'erp_%'
      ORDER BY tablename, policyname
    `);

    console.log(`Políticas RLS encontradas: ${rlsPolicies.rows.length}\n`);

    // Agrupar por tabla
    const policiesByTable: Record<string, string[]> = {};
    for (const policy of rlsPolicies.rows) {
      if (!policiesByTable[policy.tablename]) {
        policiesByTable[policy.tablename] = [];
      }
      policiesByTable[policy.tablename].push(
        `${policy.policyname} (${policy.cmd})`
      );
    }

    for (const [table, policies] of Object.entries(policiesByTable)) {
      console.log(`${table}: ${policies.length} políticas`);
      for (const policy of policies) {
        console.log(`  - ${policy}`);
      }
    }

    // 5. Verificar tablas sin RLS
    console.log('\n--- TABLAS SIN RLS ---\n');
    const tablesWithoutRLS = await client.query(`
      SELECT
        t.table_name
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE t.table_schema = 'public'
        AND t.table_name LIKE 'erp_%'
        AND c.relkind = 'r'
        AND (c.relrowsecurity IS FALSE OR c.relrowsecurity IS NULL)
      ORDER BY t.table_name
    `);

    if (tablesWithoutRLS.rows.length > 0) {
      console.log(`⚠️ Tablas sin RLS habilitado: ${tablesWithoutRLS.rows.length}\n`);
      for (const table of tablesWithoutRLS.rows) {
        console.log(`  - ${table.table_name}`);
      }
    } else {
      console.log('✅ Todas las tablas ERP tienen RLS habilitado');
    }

    // 6. Verificar Triggers
    console.log('\n--- TRIGGERS ---\n');
    const triggers = await client.query(`
      SELECT
        event_object_table AS table_name,
        trigger_name,
        action_statement,
        action_timing,
        event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND event_object_table LIKE 'erp_%'
      ORDER BY event_object_table, trigger_name
    `);

    console.log(`Triggers encontrados: ${triggers.rows.length}\n`);

    // Agrupar por tabla
    const triggersByTable: Record<string, string[]> = {};
    for (const trigger of triggers.rows) {
      if (!triggersByTable[trigger.table_name]) {
        triggersByTable[trigger.table_name] = [];
      }
      triggersByTable[trigger.table_name].push(
        `${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})`
      );
    }

    for (const [table, triggers] of Object.entries(triggersByTable)) {
      console.log(`${table}:`);
      for (const trigger of triggers) {
        console.log(`  - ${trigger}`);
      }
    }

    console.log('\n=== VALIDACIÓN COMPLETADA ===\n');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

validateDBIntegrity();