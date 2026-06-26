import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const SUPABASE_URL = envContent
  .split('\n')
  .find(line => line.startsWith('VITE_SUPABASE_URL='))
  ?.split('=')[1]
  .trim();

const SUPABASE_TOKEN = envContent
  .split('\n')
  .find(line => line.startsWith('SUPABASE_TOKEN='))
  ?.split('=')[1]
  .trim();

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

console.log('🔍 Análisis exhaustivo de la base de datos para mejoras...\n');

async function analyzeDatabase() {
  try {
    // 1. Tablas sin índices apropiados (escalabilidad/performance)
    console.log('📊 1. Análisis de índices en tablas grandes...');
    const sql1 = `
      SELECT 
        schemaname,
        relname as tablename,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as table_size
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      AND relname LIKE 'erp_%'
      AND n_live_tup > 1000
      ORDER BY n_live_tup DESC
      LIMIT 20
    `;
    
    const response1 = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql1 })
    });

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Tablas con más de 1000 registros:', data1.length);
      data1.forEach(t => {
        console.log(`   - ${t.tablename}: ${t.row_count} filas, ${t.table_size}`);
      });
    } else {
      console.log('⚠️  Error:', await response1.text());
    }

    // 2. Índices faltantes en columnas frecuentemente usadas en WHERE/JOIN
    console.log('\n📊 2. Tablas sin índices en columnas comunes (proyecto_id, created_by)...');
    const sql2 = `
      SELECT 
        t.table_name as tablename,
        c.column_name
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public'
      AND t.table_name LIKE 'erp_%'
      AND c.column_name IN ('proyecto_id', 'created_by', 'user_id', 'material_id')
      AND NOT EXISTS (
        SELECT 1 FROM pg_indexes i
        WHERE i.tablename = t.table_name
        AND i.schemaname = t.table_schema
        AND i.indexdef LIKE '%' || c.column_name || '%'
      )
      ORDER BY t.table_name, c.column_name
    `;
    
    const response2 = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql2 })
    });

    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Columnas sin índice:', data2.length);
      if (data2.length > 0) {
        data2.forEach(i => {
          console.log(`   - ${i.tablename}.${i.column_name}`);
        });
      }
    } else {
      console.log('⚠️  Error:', await response2.text());
    }

    // 3. Tablas sin restricciones de integridad (FK, CHECK)
    console.log('\n📊 3. Tablas sin foreign keys...');
    const sql3 = `
      SELECT 
        t.table_name as tablename,
        COUNT(c.constraint_name) as fk_count
      FROM information_schema.tables t
      LEFT JOIN information_schema.key_column_usage kcu
        ON t.table_name = kcu.table_name
      LEFT JOIN information_schema.table_constraints c
        ON kcu.constraint_name = c.constraint_name
        AND c.constraint_type = 'FOREIGN KEY'
      WHERE t.table_schema = 'public'
      AND t.table_name LIKE 'erp_%'
      AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name
      HAVING COUNT(c.constraint_name) = 0
      ORDER BY t.table_name
    `;
    
    const response3 = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql3 })
    });

    if (response3.ok) {
      const data3 = await response3.json();
      console.log('✅ Tablas sin foreign keys:', data3.length);
      if (data3.length > 0) {
        data3.forEach(t => {
          console.log(`   - ${t.tablename}`);
        });
      }
    } else {
      console.log('⚠️  Error:', await response3.text());
    }

    // 4. Tablas sin triggers de auditoría (persistencia de errores)
    console.log('\n📊 4. Tablas sin triggers de auditoría...');
    const sql4 = `
      SELECT 
        t.table_name as tablename
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      AND t.table_name LIKE 'erp_%'
      AND t.table_type = 'BASE TABLE'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.triggers tr
        WHERE tr.event_object_table = t.table_name
        AND tr.event_object_schema = t.table_schema
      )
      ORDER BY t.table_name
    `;
    
    const response4 = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql4 })
    });

    if (response4.ok) {
      const data4 = await response4.json();
      console.log('✅ Tablas sin triggers:', data4.length);
      if (data4.length > 0 && data4.length < 20) {
        data4.forEach(t => {
          console.log(`   - ${t.tablename}`);
        });
      } else if (data4.length >= 20) {
        console.log(`   (muestra: ${data4.slice(0, 10).map(t => t.tablename).join(', ')}...)`);
      }
    } else {
      console.log('⚠️  Error:', await response4.text());
    }

    // 5. Tablas sin restricciones CHECK (validación de datos)
    console.log('\n📊 5. Tablas sin restricciones CHECK...');
    const sql5 = `
      SELECT 
        t.table_name as tablename
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      AND t.table_name LIKE 'erp_%'
      AND t.table_type = 'BASE TABLE'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu
          ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = t.table_name
      )
      ORDER BY t.table_name
    `;
    
    const response5 = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql5 })
    });

    if (response5.ok) {
      const data5 = await response5.json();
      console.log('✅ Tablas sin CHECK constraints:', data5.length);
      if (data5.length > 0 && data5.length < 20) {
        data5.forEach(t => {
          console.log(`   - ${t.tablename}`);
        });
      } else if (data5.length >= 20) {
        console.log(`   (muestra: ${data5.slice(0, 10).map(t => t.tablename).join(', ')}...)`);
      }
    } else {
      console.log('⚠️  Error:', await response5.text());
    }

    // 6. Tablas sin columnas de auditoría (created_at, updated_at)
    console.log('\n📊 6. Tablas sin columnas de auditoría...');
    const sql6 = `
      SELECT 
        t.table_name as tablename
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      AND t.table_name LIKE 'erp_%'
      AND t.table_type = 'BASE TABLE'
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_name = t.table_name
        AND c.column_name IN ('created_at', 'updated_at')
      )
      ORDER BY t.table_name
    `;
    
    const response6 = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql6 })
    });

    if (response6.ok) {
      const data6 = await response6.json();
      console.log('✅ Tablas sin columnas de auditoría:', data6.length);
      if (data6.length > 0 && data6.length < 20) {
        data6.forEach(t => {
          console.log(`   - ${t.tablename}`);
        });
      } else if (data6.length >= 20) {
        console.log(`   (muestra: ${data6.slice(0, 10).map(t => t.tablename).join(', ')}...)`);
      }
    } else {
      console.log('⚠️  Error:', await response6.text());
    }

    // 7. Tablas con columnas nullable que deberían ser NOT NULL
    console.log('\n📊 7. Columnas críticas nullable (deberían ser NOT NULL)...');
    const sql7 = `
      SELECT 
        t.table_name as tablename,
        c.column_name,
        c.is_nullable
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public'
      AND t.table_name LIKE 'erp_%'
      AND c.column_name IN ('id', 'created_at', 'updated_at', 'proyecto_id', 'user_id')
      AND c.is_nullable = 'YES'
      ORDER BY t.table_name, c.column_name
    `;
    
    const response7 = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql7 })
    });

    if (response7.ok) {
      const data7 = await response7.json();
      console.log('✅ Columnas críticas nullable:', data7.length);
      if (data7.length > 0) {
        data7.forEach(c => {
          console.log(`   - ${c.tablename}.${c.column_name} (nullable: ${c.is_nullable})`);
        });
      }
    } else {
      console.log('⚠️  Error:', await response7.text());
    }

    // 8. Tablas sin particionamiento (para tablas muy grandes)
    console.log('\n📊 8. Tablas que podrían beneficiarse de particionamiento...');
    const sql8 = `
      SELECT 
        schemaname,
        relname as tablename,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as table_size
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      AND relname LIKE 'erp_%'
      AND n_live_tup > 10000
      ORDER BY n_live_tup DESC
    `;
    
    const response8 = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql8 })
    });

    if (response8.ok) {
      const data8 = await response8.json();
      console.log('✅ Tablas con >10,000 filas (candidatas a particionamiento):', data8.length);
      data8.forEach(t => {
        console.log(`   - ${t.tablename}: ${t.row_count} filas, ${t.table_size}`);
      });
    } else {
      console.log('⚠️  Error:', await response8.text());
    }

    console.log('\n✅ Análisis completado');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

analyzeDatabase();
