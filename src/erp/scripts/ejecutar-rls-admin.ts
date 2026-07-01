import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../../.env.local');
let supabaseUrl = '';
let supabaseServiceKey = '';
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (t.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = t.slice('VITE_SUPABASE_URL='.length).trim();
    else if (t.startsWith('VITE_SUPABASE_SERVICE_ROLE_KEY=')) supabaseServiceKey = t.slice('VITE_SUPABASE_SERVICE_ROLE_KEY='.length).trim();
  }
}
if (!supabaseServiceKey) throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ejecutarRLSCorreccion() {
  console.log('🔧 Corrigiendo políticas RLS usando service role (admin)...\n');

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
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.log(`❌ Error: ${error.message}`);
      } else {
        console.log(`✅ Política aplicada`);
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n✅ Corrección RLS completada');
}

ejecutarRLSCorreccion().catch(console.error);