import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5leWd6bHV4dWdvZGl3Y3VjdGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNjA4OTIsImV4cCI6MjA5NTgzNjg5Mn0.IfCMtFbZYL0GDgV_3zwqBmqjCNf3PZfYS-SvbRGXhY0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function validarTablas() {
  console.log('🔍 Validando migraciones en Supabase remoto...\n');

  const tablasEsperadas = [
    'erp_departamentos_gt',
    'erp_municipios_gt',
    'erp_dosificaciones_concreto',
    'erp_subtipologias',
    'erp_referencias_acero',
    'erp_precios_acero',
    'erp_parametros_movimiento_tierra',
    'erp_parametros_climaticos',
  ];

  for (const tabla of tablasEsperadas) {
    try {
      const { data, error } = await supabase
        .from(tabla as any)
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        console.log(`❌ ${tabla}: ERROR - ${error.message}`);
      } else {
        const { count } = await supabase
          .from(tabla as any)
          .select('*', { count: 'exact', head: true });
        
        console.log(`✅ ${tabla}: EXISTE (${count} registros)`);
      }
    } catch (error: any) {
      console.log(`❌ ${tabla}: ERROR - ${error.message}`);
    }
  }

  console.log('\n📊 Validación de datos de muestra:');
  
  // Verificar departamentos
  const { count: countDepts } = await supabase
    .from('erp_departamentos_gt')
    .select('*', { count: 'exact', head: true });
  console.log(`   📍 Departamentos: ${countDepts} (esperado: 22)`);

  // Verificar dosificaciones
  const { count: countDosif } = await supabase
    .from('erp_dosificaciones_concreto')
    .select('*', { count: 'exact', head: true });
  console.log(`   🧱 Dosificaciones: ${countDosif} (esperado: 35)`);

  // Verificar acero
  const { count: countAcero } = await supabase
    .from('erp_referencias_acero')
    .select('*', { count: 'exact', head: true });
  console.log(`   🔩 Referencias Acero: ${countAcero} (esperado: 15)`);

  // Verificar movimiento tierra
  const { count: countTierra } = await supabase
    .from('erp_parametros_movimiento_tierra')
    .select('*', { count: 'exact', head: true });
  console.log(`   🏔️ Movimientos Tierra: ${countTierra} (esperado: 40)`);

  // Verificar climáticos
  const { count: countClima } = await supabase
    .from('erp_parametros_climaticos')
    .select('*', { count: 'exact', head: true });
  console.log(`   🌡️ Parámetros Climáticos: ${countClima} (esperado: 22)`);

  console.log('\n✅ Validación completada');
}

validarTablas().catch(console.error);