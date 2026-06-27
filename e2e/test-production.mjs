/**
 * Script de prueba contra Vercel producción
 * Usa el service role key de Supabase para crear sesión y navegar la app
 */

import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://neygzluxugodiwcuctbj.supabase.co';
const SERVICE_KEY = 'SERVICE_ROLE_KEY_REVOKED';
const PROD_URL = 'https://construsmart-wm2026.vercel.app';

async function main() {
  console.log('🚀 Iniciando verificación de producción...\n');

  // 1. Crear sesión Supabase via service role
  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Intentar login con admin email (el del .env)
  const { data, error } = await serviceClient.auth.signInWithPassword({
    email: 'salazaroliveros@gmail.com',
    password: 'test12345', // Placeholder - necesitamos la contraseña real
  });

  if (error) {
    console.log('⚠️ No se pudo hacer login automático con service role.');
    console.log('   El service role key no permite signIn con password.');
    console.log('   Modo: Verificar HTML y assets estáticos (ya hecho)');
    console.log('   Para ver pantallas internas se necesita session real.\n');
  }

  // 2. Navegar a producción con Playwright
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: PROD_URL,
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  // 3. Capturar errores de consola
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
  });

  // 4. Navegar a la app
  console.log('📡 Navegando a producción...');
  await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 30000 });
  
  // 5. Esperar a que React cargue
  await page.waitForSelector('#root', { timeout: 10000 });
  await page.waitForTimeout(3000); // Esperar a que hydrate

  // 6. Tomar screenshot del estado actual
  await page.screenshot({ path: 'test-results/produccion-login.png', fullPage: true });
  
  const html = await page.content();

  // 7. Verificar que la app cargó sin errores catastróficos
  console.log('\n📊 RESULTADOS:');
  console.log(`  URL: ${page.url()}`);
  console.log(`  Title: ${await page.title()}`);
  console.log(`  Errores de consola: ${consoleErrors.length > 0 ? consoleErrors.join(', ') : 'NINGUNO ✅'}`);
  console.log(`  Errores de página: ${consoleErrors.filter(e => e.includes('PAGE ERROR')).length > 0 ? 'SI' : 'NO ✅'}`);
  
  // 8. Verificar elementos clave en el DOM
  const hasRoot = html.includes('id="root"');
  const hasReact = html.includes('__REACT');
  const scripts = html.match(/<script[^>]+>/g)?.length || 0;
  
  console.log(`  #root presente: ${hasRoot ? '✅' : '❌'}`);
  console.log(`  React detectado: ${hasReact ? '✅' : '❌'}`);
  console.log(`  Scripts en DOM: ${scripts}`);
  
  // 9. Verificar si hay algún texto visible en la app
  const visibleText = await page.locator('body').innerText();
  console.log(`  Texto visible: ${visibleText.substring(0, 200)}...`);

  if (!consoleErrors.length && hasRoot) {
    console.log('\n✅ PRODUCCIÓN OK: App cargada sin errores');
  } else {
    console.log('\n⚠️ Se encontraron problemas:');
    consoleErrors.forEach(e => console.log(`  ❌ ${e}`));
  }

  await browser.close();
}

main().catch(console.error);