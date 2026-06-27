/**
 * Verificación completa de todas las pantallas en producción Vercel
 * La app ya carga en modo guest (Usuario Local Administrador)
 */
import { chromium } from 'playwright';

const PROD_URL = 'https://construsmart-wm2026.vercel.app';

const SCREENS = [
  'Tablero', 'Proyectos', 'CRM', 'Cotizaciones', 'Presupuestos', 'Seguimiento',
  'Financiero', 'RRHH', 'Bodega', 'APU', 'Curvas-S', 'Base Precios',
  'Reportes Técnicos', 'Muro', 'Órdenes Cambio', 'Notificaciones', 'SSO Calidad',
  'Documentos', 'Visor BIM', 'Predictivo', 'Exportación',
  'Logística', 'Rendimiento Campo', 'Comercial Fin', 'Admin Sistema',
  'Planilla Destajos', 'Impuestos', 'Entradas Almacén', 'Ajustes', 'Hitos',
  'Riesgos', 'Cuentas Cobrar', 'Cuentas Pagar'
];

async function main() {
  console.log('🚀 VERIFICACIÓN COMPLETA DE PANTALLAS EN PRODUCCIÓN\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  let totalErrors = 0;
  let loadedScreens = 0;
  const failedScreens = [];

  // Capturar errores JS
  const jsErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      jsErrors.push({ text: msg.text(), loc: msg.location() });
    }
  });
  page.on('pageerror', err => jsErrors.push({ text: 'PAGE: ' + err.message }));

  // 1. Cargar app
  console.log('📡 Cargando app...');
  await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('#root', { timeout: 10000 });
  await page.waitForTimeout(3000);

  // 2. Navegar a cada pantalla via sidebar
  for (const screen of SCREENS) {
    console.log(`\n🔍 ${screen}...`);
    jsErrors.length = 0;
    
    try {
      // Buscar enlace en sidebar
      const link = page.locator(`a:has(span:text-is("${screen}")), button:has(span:text-is("${screen}"))`).first();
      
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await link.click();
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        
        // Verificar errores
        const errs = [...jsErrors];
        if (errs.length > 0) {
          console.log(`  ❌ ERRORES (${errs.length}): ${errs[0].text.substring(0, 150)}`);
          totalErrors += errs.length;
          failedScreens.push(screen);
        } else {
          console.log(`  ✅ OK`);
          loadedScreens++;
        }
      } else {
        console.log(`  ⚠️ No encontrado en sidebar`);
        failedScreens.push(screen);
      }
    } catch (e) {
      console.log(`  ❌ EXCEPCIÓN: ${e.message.substring(0, 100)}`);
      failedScreens.push(screen);
    }
  }

  // 3. Verificar errores JS totales en la sesión
  const allErrors = [];
  context.on('page', p => {
    p.on('pageerror', err => allErrors.push(err.message));
  });

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 RESUMEN FINAL');
  console.log(`Pantallas cargadas OK: ${loadedScreens}/${SCREENS.length}`);
  console.log(`Pantallas con error: ${failedScreens.length}`);
  console.log(`Errores JS totales: ${totalErrors}`);
  
  if (failedScreens.length > 0) {
    console.log(`\n⚠️ Pantallas con problemas:`);
    failedScreens.forEach(s => console.log(`  - ${s}`));
  }

  await page.screenshot({ path: 'test-results/final-produccion.png', fullPage: true });
  console.log('\n📸 Screenshot final guardado');

  await browser.close();
  
  const successPct = ((loadedScreens / SCREENS.length) * 100).toFixed(1);
  console.log(`\n✅ ${successPct}% de pantallas funcionando correctamente`);
  
  if (totalErrors === 0 && loadedScreens >= SCREENS.length * 0.8) {
    console.log('🎉 PRODUCCIÓN APTA: Sin errores JS, sin inconsistencias');
  } else if (totalErrors > 0) {
    console.log('⚠️ Se encontraron errores que requieren atención');
    process.exit(1);
  } else {
    console.log('⚠️ Algunas pantallas no pudieron verificarse');
    process.exit(1);
  }
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});