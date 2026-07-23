import pg from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || process.env.VITE_SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function cleanupDuplicatePolicies() {
  const client = new pg.Client({ connectionString: DB_URL });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    console.log('=== LIMPIEZA DE POLÍTICAS DUPLICADAS ===\n');

    // Obtener todas las políticas
    const policies = await client.query(`
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

    console.log(`Políticas encontradas: ${policies.rows.length}\n`);

    // Agrupar políticas similares por tabla
    const policiesByTable: Record<string, any[]> = {};
    for (const policy of policies.rows) {
      if (!policiesByTable[policy.tablename]) {
        policiesByTable[policy.tablename] = [];
      }
      policiesByTable[policy.tablename].push(policy);
    }

    let duplicatesRemoved = 0;

    for (const [tableName, tablePolicies] of Object.entries(policiesByTable)) {
      // Buscar políticas con nombres similares
      const policyGroups: Record<string, any[]> = {};
      
      for (const policy of tablePolicies) {
        // Normalizar el nombre para encontrar duplicados
        const normalizedName = policy.policyname
          .toLowerCase()
          .replace(/erp_/g, '')
          .replace(/_/g, '')
          .replace(/delete/g, '')
          .replace(/insert/g, '')
          .replace(/update/g, '')
          .replace(/select/g, '')
          .replace(/all/g, '');
        
        if (!policyGroups[normalizedName]) {
          policyGroups[normalizedName] = [];
        }
        policyGroups[normalizedName].push(policy);
      }

      // Eliminar políticas duplicadas (mantener la más reciente)
      for (const [groupName, groupPolicies] of Object.entries(policyGroups)) {
        if (groupPolicies.length > 1) {
          console.log(`⚠️ ${tableName}: ${groupPolicies.length} políticas similares en grupo "${groupName}"`);
          
          // Mantener la primera, eliminar el resto
          const toKeep = groupPolicies[0];
          const toRemove = groupPolicies.slice(1);
          
          for (const policy of toRemove) {
            try {
              await client.query(`
                DROP POLICY IF EXISTS "${policy.policyname}" ON "public"."${tableName}"
              `);
              console.log(`  ✅ Eliminada: "${policy.policyname}"`);
              duplicatesRemoved++;
            } catch (err) {
              console.log(`  ❌ Error eliminando "${policy.policyname}": ${err.message}`);
            }
          }
        }
      }
    }

    // Eliminar políticas genéricas que puedan causar conflictos
    console.log('\n=== ELIMINACIÓN DE POLÍTICAS GENÉRICAS PROBLEMÁTICAS ===\n');
    
    const problematicPatterns = [
      { pattern: 'all', table: 'erp_proyectos' },
      { pattern: 'access', table: 'erp_materiales' },
      { pattern: 'access', table: 'erp_empleados' },
      { pattern: 'access', table: 'erp_ordenes_compra' },
    ];

    for (const { pattern, table } of problematicPatterns) {
      const matchingPolicies = policies.rows.filter(p => 
        p.tablename === table && 
        p.policyname.toLowerCase().includes(pattern)
      );

      if (matchingPolicies.length > 1) {
        console.log(`⚠️ ${table}: múltiples políticas con "${pattern}"`);
        // Mantener solo la más específica
        const toKeep = matchingPolicies.find(p => p.policyname.includes('erp_')) || matchingPolicies[0];
        const toRemove = matchingPolicies.filter(p => p !== toKeep);
        
        for (const policy of toRemove) {
          try {
            await client.query(`
              DROP POLICY IF EXISTS "${policy.policyname}" ON "public"."${table}"
            `);
            console.log(`  ✅ Eliminada: "${policy.policyname}"`);
            duplicatesRemoved++;
          } catch (err) {
            console.log(`  ❌ Error eliminando "${policy.policyname}": ${err.message}`);
          }
        }
      }
    }

    console.log(`\n✅ Políticas duplicadas eliminadas: ${duplicatesRemoved}\n`);

    // Verificar políticas después de limpieza
    const finalPolicies = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename LIKE 'erp_%'
    `);

    console.log(`Políticas finales: ${finalPolicies.rows[0].count}\n`);

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    try { await client.end(); } catch {}
    process.exit(1);
  }
}

cleanupDuplicatePolicies();