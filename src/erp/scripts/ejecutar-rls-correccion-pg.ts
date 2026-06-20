import pg from 'pg';

const connectionString = 'postgresql://postgres:AngelDario.2026@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

async function ejecutarRLSCorreccion() {
  const client = new pg.Client({ connectionString });

  try {
    console.log('🔧 Conectando a Supabase...');
    await client.connect();
    console.log('✅ Conectado');

    console.log('\n🔧 Corrigiendo políticas RLS para permitir INSERT...\n');

    const politicaRLS = [
      // Departamentos
      `DROP POLICY IF EXISTS "departamentos_gt_read_all" ON erp_departamentos_gt`,
      `CREATE POLICY "departamentos_gt_read_all" ON erp_departamentos_gt FOR SELECT TO authenticated USING (true)`,
      `CREATE POLICY "departamentos_gt_insert_all" ON erp_departamentos_gt FOR INSERT TO authenticated WITH CHECK (true)`,
      `CREATE POLICY "departamentos_gt_update_all" ON erp_departamentos_gt FOR UPDATE TO authenticated USING (true)`,
      // Municipios
      `DROP POLICY IF EXISTS "municipios_gt_read_all" ON erp_municipios_gt`,
      `CREATE POLICY "municipios_gt_read_all" ON erp_municipios_gt FOR SELECT TO authenticated USING (true)`,
      `CREATE POLICY "municipios_gt_insert_all" ON erp_municipios_gt FOR INSERT TO authenticated WITH CHECK (true)`,
      `CREATE POLICY "municipios_gt_update_all" ON erp_municipios_gt FOR UPDATE TO authenticated USING (true)`,
      // Dosificaciones
      `DROP POLICY IF EXISTS "dosificaciones_concreto_read_all" ON erp_dosificaciones_concreto`,
      `CREATE POLICY "dosificaciones_concreto_read_all" ON erp_dosificaciones_concreto FOR SELECT TO authenticated USING (activo = true)`,
      `CREATE POLICY "dosificaciones_concreto_insert_all" ON erp_dosificaciones_concreto FOR INSERT TO authenticated WITH CHECK (true)`,
      `CREATE POLICY "dosificaciones_concreto_update_all" ON erp_dosificaciones_concreto FOR UPDATE TO authenticated USING (true)`,
      // Subtipologías
      `DROP POLICY IF EXISTS "subtipologias_read_all" ON erp_subtipologias`,
      `CREATE POLICY "subtipologias_read_all" ON erp_subtipologias FOR SELECT TO authenticated USING (activo = true)`,
      `CREATE POLICY "subtipologias_insert_all" ON erp_subtipologias FOR INSERT TO authenticated WITH CHECK (true)`,
      `CREATE POLICY "subtipologias_update_all" ON erp_subtipologias FOR UPDATE TO authenticated USING (true)`,
      // Referencias Acero
      `DROP POLICY IF EXISTS "referencias_acero_read_all" ON erp_referencias_acero`,
      `CREATE POLICY "referencias_acero_read_all" ON erp_referencias_acero FOR SELECT TO authenticated USING (activo = true)`,
      `CREATE POLICY "referencias_acero_insert_all" ON erp_referencias_acero FOR INSERT TO authenticated WITH CHECK (true)`,
      `CREATE POLICY "referencias_acero_update_all" ON erp_referencias_acero FOR UPDATE TO authenticated USING (true)`,
      // Precios Acero
      `DROP POLICY IF EXISTS "precios_acero_read_all" ON erp_precios_acero`,
      `CREATE POLICY "precios_acero_read_all" ON erp_precios_acero FOR SELECT TO authenticated USING (activo = true)`,
      `CREATE POLICY "precios_acero_insert_all" ON erp_precios_acero FOR INSERT TO authenticated WITH CHECK (true)`,
      `CREATE POLICY "precios_acero_update_all" ON erp_precios_acero FOR UPDATE TO authenticated USING (true)`,
      // Movimiento Tierra
      `DROP POLICY IF EXISTS "parametros_movimiento_tierra_read_all" ON erp_parametros_movimiento_tierra`,
      `CREATE POLICY "parametros_movimiento_tierra_read_all" ON erp_parametros_movimiento_tierra FOR SELECT TO authenticated USING (activo = true)`,
      `CREATE POLICY "parametros_movimiento_tierra_insert_all" ON erp_parametros_movimiento_tierra FOR INSERT TO authenticated WITH CHECK (true)`,
      `CREATE POLICY "parametros_movimiento_tierra_update_all" ON erp_parametros_movimiento_tierra FOR UPDATE TO authenticated USING (true)`,
      // Parámetros Climáticos
      `DROP POLICY IF EXISTS "parametros_climaticos_read_all" ON erp_parametros_climaticos`,
      `CREATE POLICY "parametros_climaticos_read_all" ON erp_parametros_climaticos FOR SELECT TO authenticated USING (activo = true)`,
      `CREATE POLICY "parametros_climaticos_insert_all" ON erp_parametros_climaticos FOR INSERT TO authenticated WITH CHECK (true)`,
      `CREATE POLICY "parametros_climaticos_update_all" ON erp_parametros_climaticos FOR UPDATE TO authenticated USING (true)`,
    ];

    for (const sql of politicaRLS) {
      try {
        await client.query(sql);
        console.log(`✅ Política aplicada`);
      } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
        console.log(`   SQL: ${sql}`);
      }
    }

    console.log('\n✅ Corrección RLS completada');
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

ejecutarRLSCorreccion().catch(console.error);