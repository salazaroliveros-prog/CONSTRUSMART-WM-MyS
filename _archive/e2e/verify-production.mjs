/**
 * Verificación completa de producción con nombres EXACTOS del sidebar
 */
import { chromium } from 'playwright';

const PROD_URL = 'https://construsmart-wm2026.vercel.app';

const SCREENS = [
  // Principal
  'Tablero', 'Proyectos', 'CRM / Pipeline', 'Cotizaciones',
  // Planificación
  'Presupuestos APU', 'APU Avanzado', 'Base de Precios', 'Hitos', 'Riesgos', 'Plantillas',
  // Ejecución
  'Seguimiento EVM', 'Curvas S', 'Rendimiento Campo', 'SSO & Calidad', 'Muro de Obra',
  'Órdenes de Cambio', 'Documentos', 'Visor BIM',
  // Suministro
  'Bodega', 'Logística/Compras', 'Entradas Almacén', 'Analytics Proveedores',
  // RRHH
  'RRHH', 'Planilla Destajos',
  // Finanzas
  'Financiero', 'Comercial/Finanzas', 'Cuentas x Cobrar', 'Cuentas x Pagar', 'Impuestos',
  // Análisis BI
  'Análisis Costos', 'Dashboard BI', 'Exportación', 'Reportes Técnicos',
  // Sistema
  'Notificaciones', 'Error Log', 'Auditoría', 'Administración', 'Ajustes'
];

async function main() {
  console.log('🚀 VERIFICACIÓN PRODUCCIÓN CONSTRUSMART ERP');
  console.log(`📋 ${SCREENS.length} pantallas a verificar\n`);

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // Capturar errores
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push({ screen: 'global', text: msg.text() });
  });
  page.on('pageerror', err => errors.push({ screen: 'global', text: 'PAGE: ' + err.message }));

  // Cargar app
  console.log('📡 Cargando app...');
  await page.goto(PROD_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('#root', { timeout: 10000 });
  await page.waitForTimeout(4000);

  // Limpiar errores de carga inicial
  errors.length = 0;

  let ok = 0, fail = 0, notFound = 0;
  const failDetails = [];

  for (const screen of SCREENS) {
    const screenErrors = [];
    const errorHandler = msg => {
      if (msg.type() === 'error') screenErrors.push(msg.text());
    };
    page.on('console', errorHandler);

    try {
      // Buscar en sidebar por span con el texto exacto
      const btn = page.locator(`button:has(span:text-is("${screen}"))`).first();
      
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(2000);
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});

        if (screenErrors.length > 0) {
          fail++;
          failDetails.push({ screen, errors: [...screenErrors] });
          console.log(`  ❌ ${screen}: ${screenErrors.length} error(es) — ${screenErrors[0].substring(0,100)}`);
        } else {
          ok++;
          process.stdout.write(`  ✅ ${screen}\n`);
        }
      } else {
        notFound++;
        failDetails.push({ screen, errors: ['No encontrado en sidebar'] });
        console.log(`  ⚠️ ${screen}: no encontrado en sidebar`);
      }
    } catch (e) {
      fail++;
      failDetails.push({ screen, errors: [e.message] });
      console.log(`  ❌ ${screen}: excepción — ${e.message.substring(0,80)}`);
    }

    page.removeListener('console', errorHandler);
  }

  console.log('\n' + '='.repeat(55));
  console.log('\n📊 RESUMEN FINAL');
  console.log(`  ✅ Cargadas sin errores: ${ok}/${SCREENS.length}`);
  console.log(`  ❌ Con errores JS:       ${fail}`);
  console.log(`  ⚠️ No encontradas:       ${notFound}`);

  if (fail > 0) {
    console.log('\n🔍 DETALLE DE ERRORES:');
    failDetails.filter(f => f.errors[0] !== 'No encontrado en sidebar').forEach(f => {
      console.log(`\n  📍 ${f.screen}:`);
      f.errors.slice(0,3).forEach(e => console.log(`    ❌ ${e.substring(0,120)}`));
    });
  }

  await page.screenshot({ path: 'test-results/produccion-final.png', fullPage: true });
  console.log('\n📸 Screenshot guardado');
  await browser.close();

  // Verificar errores globales
  if (errors.length > 0) {
    console.log('\n⚠️ ERRORES GLOBALES:');
    errors.slice(0,5).forEach(e => console.log(`  ❌ ${e.text.substring(0,100)}`));
  }

  const hasJsErrors = fail > 0 || errors.length > 0;
  const coverage = ((ok / SCREENS.length) * 100).toFixed(1);
  console.log(`\n🎯 Cobertura: ${coverage}%`);
  
  if (!hasJsErrors) {
    console.log('✅ PRODUCCIÓN APTA: 0 errores JS, todas las pantallas funcionan');
  } else {
    console.log(`⚠️ ${fail} pantalla(s) con errores JS requieren revisión`);
  }
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});