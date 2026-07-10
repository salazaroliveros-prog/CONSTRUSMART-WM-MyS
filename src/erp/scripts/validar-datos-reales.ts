import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

async function main() {
  console.log('🔍 Verificando datos reales en Supabase...\n');
  
  const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
  const serviceRoleKey = '[REDACTED-SERVICE-ROLE-KEY-ROTATED]';
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  // Obtener datos reales de la base de datos
  const { data: proyectosDB, error: errorProyectos } = await supabase
    .from('erp_proyectos')
    .select('id, nombre, estado, fecha_inicio')
    .limit(5);
  
  if (errorProyectos) {
    console.error('❌ Error obteniendo proyectos:', errorProyectos.message);
  } else {
    console.log('📊 Proyectos en base de datos real:');
    proyectosDB?.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.nombre} (${p.estado}) - ID: ${p.id}`);
    });
  }
  
  const { data: presupuestosDB, error: errorPresupuestos } = await supabase
    .from('erp_presupuestos')
    .select('id, nombre, total')
    .limit(3);
  
  if (!errorPresupuestos && presupuestosDB) {
    console.log('\n💰 Presupuestos en base de datos real:');
    presupuestosDB.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.nombre} - Total: ${p.total}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Abriendo navegador para login real y validación...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const BASE_URL = 'http://localhost:8080';
  
  // Navegar a la aplicación
  console.log('🔍 Navegando a login...');
  await page.goto(BASE_URL);
  await page.waitForTimeout(3000);
  
  // Capturar pantalla de login
  await page.screenshot({ path: 'screenshots/02-login-antes.png', fullPage: true });
  console.log('📸 Screenshot capturado: screenshots/02-login-antes.png\n');
  
  console.log('='.repeat(60));
  console.log('🎉 Navegador abierto con aplicación conectada a Supabase');
  console.log('📍 URL: ' + BASE_URL);
  console.log('💾 Datos verificados:');
  console.log(`   - ${proyectosDB?.length || 0} proyectos en DB real`);
  console.log(`   - ${presupuestosDB?.length || 0} presupuestos en DB real`);
  console.log('\n📋 Para validar datos reales:');
  console.log('1. Haz login con: salazaroliveros@gmail.com');
  console.log('2. Verifica que los proyectos/presupuestos coinciden con los de arriba');
  console.log('3. Navega por las pantallas y verifica datos reales');
  console.log('4. Presiona Ctrl+C aquí para cerrar el navegador\n');
  
  // Mantener el navegador abierto
  await new Promise(() => {});
}

main().catch(console.error);
