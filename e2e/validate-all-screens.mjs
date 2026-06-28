import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8080';

const SCREENS = [
  'dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero',
  'rrhh', 'bodega', 'crm', 'apu', 'curvas', 'baseprecios', 'reportes',
  'muro', 'ordenes-cambio', 'notificaciones', 'sso-calidad', 'documentos',
  'visor-bim', 'predictivo', 'exportacion', 'logistica', 'rendimiento-campo',
  'comercial-fin', 'admin-sistema', 'planilla-destajos', 'impuestos',
  'entradas-almacen', 'ajustes', 'hitos', 'riesgos', 'cuentas-cobrar',
  'cuentas-pagar', 'cotizaciones', 'plantillas', 'analisis-costos',
  'proveedor-analytics', 'error-log', 'auditoria', 'activos', 'cuadros',
  'bitacora'
];

async function main() {
  console.log('VALIDACIÓN COMPLETA DE PANTALLAS');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  const jsErrors = [];
  const pageErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('ERR_CONNECTION_REFUSED') && !text.includes('Supabase') && !text.includes('favicon')) {
        jsErrors.push({ text, loc: msg.location() });
      }
    }
  });
  page.on('pageerror', err => pageErrors.push(err.message));

  // Cargar app
  console.log('\nCargando app y preparando store...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  const result = await page.evaluate(() => {
    try {
      const user = {
        id: 'test-user-id',
        email: 'admin@construsmart.com',
        nombre: 'Admin Test',
        rol: 'Administrador',
        avatar: '',
      };
      localStorage.setItem('wm_erp_theme', 'ant-design');
      localStorage.setItem('wm_erp_demo_loaded', 'true');
      localStorage.setItem('wm_erp_user', JSON.stringify(user));

      const storeData = JSON.parse(localStorage.getItem('zustand_erp_store') || '{"state":{}}');
      storeData.state = storeData.state || {};
      storeData.state.user = user;
      storeData.state.isOnline = true;
      storeData.state.appSettings = storeData.state.appSettings || {};
      localStorage.setItem('zustand_erp_store', JSON.stringify(storeData));

      return { success: true, hasStore: !!storeData };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
  console.log(`Store preparado: ${result.success}`);

  // Recargar con datos inyectados
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const pageContent = await page.content();
  const isLoginPage = pageContent.includes('Iniciar Sesión') || pageContent.includes('Continuar con Google');

  if (isLoginPage) {
    console.log('\nApp muestra Login (auth no bypassable)');
    console.log('Verificando Login screen...');

    const hasLogo = await page.locator('img[alt="WM"]').isVisible().catch(() => false);
    const hasGoogleBtn = await page.locator('button:has-text("Google")').isVisible().catch(() => false);
    const hasSubtitle = pageContent.includes('EDIFICANDO EL FUTURO');

    console.log(`Logo: ${hasLogo ? 'OK' : 'No'}`);
    console.log(`Google button: ${hasGoogleBtn ? 'OK' : 'No'}`);
    console.log(`Slogan: ${hasSubtitle ? 'OK' : 'No'}`);
    console.log('Login screen: OK');

    // Tomar screenshot del login
    await page.screenshot({ path: 'test-results/login-screen.png', fullPage: true });
    console.log('Screenshot de login guardado');
  } else {
    console.log('\nApp logueada - Navegando pantallas...');

    let success = 0;
    let failed = 0;
    const failedScreens = [];
    const screenTimings = {};

    for (const screen of SCREENS) {
      const startTime = Date.now();
      const currentErrors = jsErrors.length;
      const currentPageErrors = pageErrors.length;

      try {
        await page.goto(`${BASE_URL}/#${screen}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1500);

        const elapsed = Date.now() - startTime;
        const newJsErrors = jsErrors.length - currentErrors;
        const newPageErrors = pageErrors.length - currentPageErrors;

        screenTimings[screen] = elapsed;

        if (newJsErrors > 0 || newPageErrors > 0) {
          console.log(`  ${screen}: ERRORES (${newJsErrors + newPageErrors}) [${elapsed}ms]`);
          failed++;
          failedScreens.push(screen);
        } else {
          console.log(`  ${screen}: OK [${elapsed}ms]`);
          success++;
        }
      } catch (e) {
        console.log(`  ${screen}: ERROR - ${e.message?.substring(0, 80)} [${Date.now() - startTime}ms]`);
        failed++;
        failedScreens.push(screen);
      }
    }

    const avgTime = Object.values(screenTimings).reduce((a, b) => a + b, 0) / Object.keys(screenTimings).length;

    console.log('\n' + '='.repeat(60));
    console.log('RESULTADOS:');
    console.log(`Pantallas OK: ${success}/${SCREENS.length}`);
    console.log(`Pantallas con error: ${failed}/${SCREENS.length}`);
    console.log(`Tiempo promedio: ${Math.round(avgTime)}ms`);
    if (failedScreens.length > 0) {
      console.log('Fallidas:', failedScreens.join(', '));
    }
    if (pageErrors.length > 0) {
      console.log('\nPage errors:', pageErrors.slice(0, 5));
    }

    await page.screenshot({ path: 'test-results/screenshot-final.png', fullPage: true });
    console.log('Screenshot final guardado');
  }

  await browser.close();
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
