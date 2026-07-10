import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

async function main() {
  console.log('🔍 Verificando configuración de Supabase...\n');
  
  // Leer variables de entorno del archivo .env.local
  const supabaseUrl = 'https://neygzluxugodiwcuctbj.supabase.co';
  const supabaseKey = 'JWT_ANON_KEY_PLACEHOLDER';
  const serviceRoleKey = '[REDACTED-SERVICE-ROLE-KEY-ROTATED]';
  
  console.log(`✅ Supabase URL: ${supabaseUrl}`);
  console.log(`✅ Supabase Key configurada`);
  console.log(`✅ Service Role Key configurada\n`);
  
  // Crear cliente Supabase
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  console.log('🔍 Verificando conexión a la base de datos...\n');
  
  // Verificar que podemos conectarnos a la base de datos
  try {
    const { data, error } = await supabase
      .from('erp_proyectos')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Error conectando a Supabase:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Conexión a Supabase exitosa');
    console.log(`📊 Total proyectos en DB: ${data ? data[0]?.count || 0 : 0}\n`);
  } catch (e) {
    console.error('❌ Error verificando conexión:', e);
    process.exit(1);
  }
  
  // Verificar usuarios en auth
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.warn('⚠️ No se pudo listar usuarios (service role key puede no tener permisos):', error.message);
    } else {
      console.log(`👥 Total usuarios en auth: ${users.length}`);
      if (users.length > 0) {
        console.log('📧 Usuarios disponibles:');
        users.forEach((user, i) => {
          console.log(`   ${i + 1}. ${user.email} (ID: ${user.id})`);
        });
      }
    }
  } catch (e) {
    console.warn('⚠️ No se pudo listar usuarios:', e.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Abriendo navegador para validar aplicación con datos reales...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const BASE_URL = 'http://localhost:8080';
  
  console.log('🔍 Navegando a la aplicación...\n');
  await page.goto(BASE_URL);
  
  // Esperar a que la página cargue
  await page.waitForTimeout(3000);
  
  // Verificar que la página carga
  const bodyContent = await page.locator('body').textContent();
  console.log(`✅ Página cargada (${bodyContent?.length || 0} caracteres)\n`);
  
  // Capturar pantalla inicial
  await page.screenshot({ path: 'screenshots/01-login-inicial.png', fullPage: true });
  console.log('📸 Screenshot capturado: screenshots/01-login-inicial.png\n');
  
  console.log('='.repeat(60));
  console.log('🎉 Aplicación abierta en navegador');
  console.log('📍 URL: ' + BASE_URL);
  console.log('🔐 Estado: Lista para login manual');
  console.log('💾 Supabase: Conectado y verificado');
  console.log('\n📋 Instrucciones:');
  console.log('1. Navega manualmente en el navegador abierto');
  console.log('2. Haz login con tus credenciales de Supabase');
  console.log('3. Verifica que los datos sean reales de la base de datos');
  console.log('4. Navega por las diferentes pantallas');
  console.log('5. Presiona Ctrl+C aquí para cerrar el navegador\n');
  
  // Mantener el navegador abierto
  await new Promise(() => {});
}

main().catch(console.error);
