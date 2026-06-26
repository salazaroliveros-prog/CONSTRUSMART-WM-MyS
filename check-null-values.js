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

console.log('🔍 Checking for NULL values in critical columns...\n');

async function checkNullValues() {
  try {
    // Check NULL values in id columns
    console.log('📊 1. Checking NULL values in id columns...');
    const sql1 = `
      SELECT 
        'erp_activos_herramienta' as tablename,
        COUNT(*) as null_count
      FROM erp_activos_herramienta
      WHERE id IS NULL
      
      UNION ALL
      
      SELECT 
        'erp_cuadros_comparativos' as tablename,
        COUNT(*) as null_count
      FROM erp_cuadros_comparativos
      WHERE id IS NULL
      
      UNION ALL
      
      SELECT 
        'erp_incidentes_sso' as tablename,
        COUNT(*) as null_count
      FROM erp_incidentes_sso
      WHERE id IS NULL
      
      UNION ALL
      
      SELECT 
        'erp_publicaciones_muro' as tablename,
        COUNT(*) as null_count
      FROM erp_publicaciones_muro
      WHERE id IS NULL
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
      console.log('✅ NULL values in id columns:');
      data1.forEach(t => {
        if (t.null_count > 0) {
          console.log(`   ⚠️  ${t.tablename}: ${t.null_count} NULL values`);
        } else {
          console.log(`   ✅ ${t.tablename}: 0 NULL values`);
        }
      });
    } else {
      console.log('⚠️  Error:', await response1.text());
    }

    // Check NULL values in proyecto_id columns
    console.log('\n📊 2. Checking NULL values in proyecto_id columns...');
    const sql2 = `
      SELECT 
        'erp_activos' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) as null_count
      FROM erp_activos
      
      UNION ALL
      
      SELECT 
        'erp_activos_herramienta' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_activos_herramienta
      
      UNION ALL
      
      SELECT 
        'erp_cuadros' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_cuadros
      
      UNION ALL
      
      SELECT 
        'erp_cuadros_comparativos' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_cuadros_comparativos
      
      UNION ALL
      
      SELECT 
        'erp_empleados' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_empleados
      
      UNION ALL
      
      SELECT 
        'erp_eventos_calendario' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_eventos_calendario
      
      UNION ALL
      
      SELECT 
        'erp_historial_aplicacion_reglas' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_historial_aplicacion_reglas
      
      UNION ALL
      
      SELECT 
        'erp_incidentes_sso' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_incidentes_sso
      
      UNION ALL
      
      SELECT 
        'erp_licitaciones' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_licitaciones
      
      UNION ALL
      
      SELECT 
        'erp_movimientos' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_movimientos
      
      UNION ALL
      
      SELECT 
        'erp_notificaciones' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_notificaciones
      
      UNION ALL
      
      SELECT 
        'erp_ordenes_compra' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_ordenes_compra
      
      UNION ALL
      
      SELECT 
        'erp_publicaciones_muro' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_publicaciones_muro
      
      UNION ALL
      
      SELECT 
        'erp_renglones' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_renglones
      
      UNION ALL
      
      SELECT 
        'erp_vales_salida' as tablename,
        COUNT(*) FILTER (WHERE proyecto_id IS NULL) FROM erp_vales_salida
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
      console.log('✅ NULL values in proyecto_id columns:');
      data2.forEach(t => {
        if (t.null_count > 0) {
          console.log(`   ⚠️  ${t.tablename}: ${t.null_count} NULL values`);
        } else {
          console.log(`   ✅ ${t.tablename}: 0 NULL values`);
        }
      });
    } else {
      console.log('⚠️  Error:', await response2.text());
    }

    // Check NULL values in created_at/updated_at columns
    console.log('\n📊 3. Checking NULL values in created_at/updated_at columns...');
    const sql3 = `
      SELECT 
        'erp_activos' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) as null_count
      FROM erp_activos
      
      UNION ALL
      
      SELECT 
        'erp_activos' as tablename,
        'updated_at' as column_name,
        COUNT(*) FILTER (WHERE updated_at IS NULL) FROM erp_activos
      
      UNION ALL
      
      SELECT 
        'erp_activos_herramienta' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_activos_herramienta
      
      UNION ALL
      
      SELECT 
        'erp_cuadros' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_cuadros
      
      UNION ALL
      
      SELECT 
        'erp_cuadros' as tablename,
        'updated_at' as column_name,
        COUNT(*) FILTER (WHERE updated_at IS NULL) FROM erp_cuadros
      
      UNION ALL
      
      SELECT 
        'erp_cuadros_comparativos' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_cuadros_comparativos
      
      UNION ALL
      
      SELECT 
        'erp_empresas' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_empresas
      
      UNION ALL
      
      SELECT 
        'erp_incidentes_sso' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_incidentes_sso
      
      UNION ALL
      
      SELECT 
        'erp_incidentes_sso' as tablename,
        'updated_at' as column_name,
        COUNT(*) FILTER (WHERE updated_at IS NULL) FROM erp_incidentes_sso
      
      UNION ALL
      
      SELECT 
        'erp_muro_likes' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_muro_likes
      
      UNION ALL
      
      SELECT 
        'erp_planos' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_planos
      
      UNION ALL
      
      SELECT 
        'erp_planos' as tablename,
        'updated_at' as column_name,
        COUNT(*) FILTER (WHERE updated_at IS NULL) FROM erp_planos
      
      UNION ALL
      
      SELECT 
        'erp_publicaciones_muro' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_publicaciones_muro
      
      UNION ALL
      
      SELECT 
        'erp_publicaciones_muro' as tablename,
        'updated_at' as column_name,
        COUNT(*) FILTER (WHERE updated_at IS NULL) FROM erp_publicaciones_muro
      
      UNION ALL
      
      SELECT 
        'erp_rendimientos_cuadrilla' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_rendimientos_cuadrilla
      
      UNION ALL
      
      SELECT 
        'erp_rendimientos_cuadrilla' as tablename,
        'updated_at' as column_name,
        COUNT(*) FILTER (WHERE updated_at IS NULL) FROM erp_rendimientos_cuadrilla
      
      UNION ALL
      
      SELECT 
        'erp_rfis' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_rfis
      
      UNION ALL
      
      SELECT 
        'erp_rfis' as tablename,
        'updated_at' as column_name,
        COUNT(*) FILTER (WHERE updated_at IS NULL) FROM erp_rfis
      
      UNION ALL
      
      SELECT 
        'erp_submittals' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_submittals
      
      UNION ALL
      
      SELECT 
        'erp_submittals' as tablename,
        'updated_at' as column_name,
        COUNT(*) FILTER (WHERE updated_at IS NULL) FROM erp_submittals
      
      UNION ALL
      
      SELECT 
        'erp_vales_salida' as tablename,
        'created_at' as column_name,
        COUNT(*) FILTER (WHERE created_at IS NULL) FROM erp_vales_salida
      
      UNION ALL
      
      SELECT 
        'erp_vales_salida' as tablename,
        'updated_at' as column_name,
        COUNT(*) FILTER (WHERE updated_at IS NULL) FROM erp_vales_salida
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
      console.log('✅ NULL values in created_at/updated_at columns:');
      data3.forEach(c => {
        if (c.null_count > 0) {
          console.log(`   ⚠️  ${c.tablename}.${c.column_name}: ${c.null_count} NULL values`);
        } else {
          console.log(`   ✅ ${c.tablename}.${c.column_name}: 0 NULL values`);
        }
      });
    } else {
      console.log('⚠️  Error:', await response3.text());
    }

    console.log('\n✅ NULL value check completed');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkNullValues();
