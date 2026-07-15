// Script para verificar RLS automáticamente
import pg from 'pg';

// Usar variable de entorno o placeholder
const DB_URL = process.env.DATABASE_URL || 'postgresql://user:password@host:5432/database';

async function verifyRLS() {
  const client = new pg.Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    family: 4
  });

  try {
    console.log('Conectando a PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado\n');
    
    console.log('=== VERIFICACIÓN DE RLS ===\n');
    
    // Verificar RLS en todas las tablas erp_*
    const rlsQuery = `
      SELECT 
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename LIKE 'erp_%'
      ORDER BY tablename
    `;
    
    const rlsResult = await client.query(rlsQuery);
    
    let rlsEnabledCount = 0;
    let rlsDisabledCount = 0;
    
    for (const row of rlsResult.rows) {
      if (row.rls_enabled) {
        rlsEnabledCount++;
        console.log(`✅ ${row.tablename}: RLS enabled`);
      } else {
        rlsDisabledCount++;
        console.log(`❌ ${row.tablename}: RLS NOT enabled`);
      }
    }
    
    console.log(`\n=== RESUMEN RLS ===`);
    console.log(`Total tablas: ${rlsResult.rows.length}`);
    console.log(`RLS enabled: ${rlsEnabledCount}`);
    console.log(`RLS disabled: ${rlsDisabledCount}`);
    
    if (rlsDisabledCount === 0) {
      console.log('\n✅ TODAS LAS TABLAS TIENEN RLS HABILITADO');
    } else {
      console.log(`\n⚠️  ${rlsDisabledCount} tablas no tienen RLS habilitado`);
    }
    
    // Verificar políticas
    console.log('\n=== VERIFICACIÓN DE POLÍTICAS ===\n');
    
    const policiesQuery = `
      SELECT 
        tablename,
        policyname,
        permissive,
        cmd
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename LIKE 'erp_%'
      ORDER BY tablename, policyname
    `;
    
    const policiesResult = await client.query(policiesQuery);
    
    console.log(`Total políticas: ${policiesResult.rows.length}`);
    
    // Agrupar por tabla
    const policiesByTable = {};
    for (const row of policiesResult.rows) {
      if (!policiesByTable[row.tablename]) {
        policiesByTable[row.tablename] = [];
      }
      policiesByTable[row.tablename].push(row);
    }
    
    for (const [tableName, policies] of Object.entries(policiesByTable)) {
      console.log(`\n${tableName}:`);
      for (const policy of policies) {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyRLS();
