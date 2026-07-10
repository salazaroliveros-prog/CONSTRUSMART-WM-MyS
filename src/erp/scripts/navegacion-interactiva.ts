import { chromium } from 'playwright';

async function main() {
  console.log('🚀 Abriendo navegador para validar aplicación CONSTRUSMART...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Navegación más lenta para que el usuario pueda ver
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  const BASE_URL = 'http://localhost:8080';
  
  const SCREENS = [
    { path: '/', name: 'Login' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/proyectos', name: 'Proyectos' },
    { path: '/presupuestos', name: 'Presupuestos' },
    { path: '/seguimiento', name: 'Seguimiento' },
    { path: '/financiero', name: 'Financiero' },
    { path: '/rrhh', name: 'RRHH' },
    { path: '/bodega', name: 'Bodega' },
    { path: '/crm', name: 'CRM' },
    { path: '/apu', name: 'APU Avanzado' },
    { path: '/baseprecios', name: 'Base Precios' },
    { path: '/muro', name: 'Muro Obra' },
    { path: '/cotizaciones', name: 'Cotizaciones' },
    { path: '/plantillas', name: 'Plantillas' },
    { path: '/ajustes', name: 'Ajustes' },
  ];

  console.log('='.repeat(60));
  console.log('Navegando por las pantallas principales...\n');

  for (const screen of SCREENS) {
    console.log(`🔍 Navegando a ${screen.name}...`);
    await page.goto(`${BASE_URL}${screen.path}`);
    
    // Esperar a que la página cargue
    await page.waitForTimeout(3000);
    
    // Verificar que la página tiene contenido
    const bodyContent = await page.locator('body').textContent();
    if (bodyContent && bodyContent.length > 100) {
      console.log(`✅ ${screen.name} cargada correctamente (${bodyContent.length} caracteres)`);
    } else {
      console.log(`⚠️ ${screen.name} pudo no cargar completamente`);
    }
    
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('🎉 Navegación completada. El navegador permanecerá abierto.');
  console.log('Puedes navegar manualmente por las pantallas restantes.');
  console.log('Presiona Ctrl+C para cerrar el navegador.\n');
  
  // Mantener el navegador abierto para navegación manual
  await new Promise(() => {}); // Esperar indefinidamente
}

main().catch(console.error);
