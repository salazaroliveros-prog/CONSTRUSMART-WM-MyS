// Script de verificación post-migración
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
const supabaseKey = 'JWT_ANON_KEY_PLACEHOLDER';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarPostMigracion() {
  console.log('=== Verificación Post-Migración ===\n');

  const tablasNuevas = [
    'erp_reglas_factores',
    'erp_historial_aplicacion_reglas',
    'erp_snapshots_estado_calculo',
    'erp_cumplimiento_normativo',
    'erp_aplicacion_escalas',
    'erp_ajustes_estacionales_actividad'
  ];

  let exito = 0;
  let fallo = 0;

  for (const tabla of tablasNuevas) {
    try {
      const { count, error } = await supabase
        .from(tabla)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ Tabla ${tabla}: ERROR - ${error.message}`);
        fallo++;
      } else {
        console.log(`✅ Tabla ${tabla}: Creada correctamente (${count} registros)`);
        exito++;
      }
    } catch (e) {
      console.error(`❌ Tabla ${tabla}: Excepción - ${e.message}`);
      fallo++;
    }
  }

  console.log('\n=== Resumen ===');
  console.log(`Tablas creadas exitosamente: ${exito}/${tablasNuevas.length}`);
  console.log(`Tablas con problemas: ${fallo}/${tablasNuevas.length}`);

  if (exito === tablasNuevas.length) {
    console.log('\n✅ Migración completada exitosamente!');
  } else {
    console.log('\n❌ Algunas tablas tienen problemas. Revisa los errores arriba.');
  }

  return exito === tablasNuevas.length;
}

verificarPostMigracion()
  .then(result => process.exit(result ? 0 : 1))
  .catch(error => {
    console.error('Error en verificación:', error);
    process.exit(1);
  });