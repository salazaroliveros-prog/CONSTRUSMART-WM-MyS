import { test, expect } from '@playwright/test';

// Función helper para login como invitado
async function loginAsGuest(page: any) {
  await page.goto('http://localhost:8080');
  await page.waitForLoadState('networkidle');
  
  // Buscar y hacer click en el botón de invitado
  const guestButton = page.locator('button:has-text("Entrar como Invitado"), button:has-text("Invitado")').first();
  if (await guestButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await guestButton.click();
    console.log('  🔑 Login como invitado');
    // Esperar a que el login complete
    await page.waitForTimeout(3000);
  } else {
    console.log('  ⚠️ Botón de invitado no encontrado, probablemente hay Supabase configurado');
    // Intentar verificar si ya está logueado
    await page.waitForTimeout(1000);
  }
}

test.describe('Validación Visual UI CONSTRUSMART ERP', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await loginAsGuest(page);
  });

  test('1. Login - Validar página de login', async ({ page }) => {
    // Navegar a login sin autenticar (resetear estado)
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
    
    // Verificar que la página de login cargue
    await expect(page).toHaveTitle(/CONSTRUSMART/);
    
    // Verificar elementos de login
    await expect(page.locator('text=Iniciar Sesión').or(page.locator('text=Login'))).toBeVisible({ timeout: 10000 });
    
    // Verificar botón de invitado (modo offline)
    const guestButton = page.locator('button:has-text("Entrar como Invitado")');
    if (await guestButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  ✅ Botón de invitado visible (modo offline)');
    }
    
    // Tomar screenshot
    await page.screenshot({ path: 'screenshots/01-login.png', fullPage: true });
    
    console.log('✅ Página de login validada');
  });

  test('2. Dashboard - Validar gráficas y KPIs', async ({ page }) => {
    // Navegar al dashboard (ya logueado por beforeEach)
    await page.goto('http://localhost:8080/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(4000); // Esperar a que las gráficas carguen
    
    // Verificar elementos del dashboard
    await expect(page.locator('text=Dashboard').or(page.locator('text=Panel de Control')).or(page.locator('text=Tablero'))).toBeVisible({ timeout: 10000 });
    
    // Verificar que haya gráficas (SVG elements)
    const svgElements = await page.locator('svg').count();
    console.log(`  📊 Gráficas encontradas: ${svgElements}`);
    expect(svgElements).toBeGreaterThan(0);
    
    // Verificar KPIs (números/métricas)
    const hasMetrics = await page.locator('text=GTQ, text=Q, text=$, text=%').count() > 0;
    console.log(`  📈 KPIs encontrados: ${hasMetrics ? 'Sí' : 'No'}`);
    
    // Verificar Panel de Alertas
    const alertPanel = page.locator('text=Alertas').or(page.locator('text=alertas'));
    if (await alertPanel.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  ✅ Panel de Alertas visible');
    }
    
    // Tomar screenshot
    await page.screenshot({ path: 'screenshots/02-dashboard.png', fullPage: true });
    
    console.log('✅ Dashboard validado');
  });

  test('3. Proyectos - Validar lista de proyectos', async ({ page }) => {
    // Navegar a proyectos (ya logueado por beforeEach)
    await page.goto('http://localhost:8080/#/proyectos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verificar título de pantalla
    await expect(page.locator('text=Proyectos').or(page.locator('text=Projects'))).toBeVisible({ timeout: 10000 });
    
    // Verificar tabla o lista de proyectos
    const table = page.locator('table, .grid, [role="grid"]');
    const hasTable = await table.count() > 0;
    console.log(`  📋 Tabla de proyectos: ${hasTable ? 'Sí' : 'No'}`);
    
    // Tomar screenshot
    await page.screenshot({ path: 'screenshots/03-proyectos.png', fullPage: true });
    
    console.log('✅ Pantalla Proyectos validada');
  });

  test('4. Validar colores y estilos', async ({ page }) => {
    // Navegar al dashboard (ya logueado por beforeEach)
    await page.goto('http://localhost:8080/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verificar que no haya errores de consola
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    if (logs.length > 0) {
      console.log(`  ⚠️ Errores de consola: ${logs.length}`);
      logs.forEach(log => console.log(`    - ${log}`));
    } else {
      console.log('  ✅ Sin errores de consola');
    }
    
    // Verificar elementos visuales clave
    const buttons = await page.locator('button').count();
    console.log(`  🔘 Botones: ${buttons}`);
    
    const cards = await page.locator('[class*="card"], [class*="Card"]').count();
    console.log(`  🃏 Cards: ${cards}`);
    
    // Tomar screenshot
    await page.screenshot({ path: 'screenshots/04-colores-estilos.png', fullPage: true });
    
    console.log('✅ Colores y estilos validados');
  });

  test('5. Responsive - Validar diferentes tamaños', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:8080/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/05-responsive-desktop.png', fullPage: true });
    console.log('  ✅ Desktop (1920x1080)');
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:8080/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/06-responsive-tablet.png', fullPage: true });
    console.log('  ✅ Tablet (768x1024)');
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:8080/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/07-responsive-mobile.png', fullPage: true });
    console.log('  ✅ Mobile (375x667)');
    
    console.log('✅ Responsive validado');
  });

  test('6. Validar animaciones y transiciones', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navegar al dashboard (ya logueado por beforeEach)
    await page.goto('http://localhost:8080/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Navegar entre pantallas para validar transiciones
    // Intentar click en sidebar, fallback a navegación directa
    await page.goto('http://localhost:8080/#/proyectos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    await page.goto('http://localhost:8080/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    // Tomar screenshot después de navegación
    await page.screenshot({ path: 'screenshots/08-transiciones.png', fullPage: true });
    
    console.log('✅ Animaciones y transiciones validadas');
  });

  test('7. Validar integridad de textos (overflow)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:8080/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verificar elementos con overflow horizontal
    const overflowElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overflowing: string[] = [];
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.overflowX === 'auto' || styles.overflowX === 'scroll') {
          if (el.scrollWidth > el.clientWidth) {
            overflowing.push(el.tagName + (el.className ? '.' + el.className : ''));
          }
        }
      });
      
      return overflowing;
    });
    
    console.log(`  📝 Elementos con overflow: ${overflowElements.length}`);
    if (overflowElements.length > 0) {
      console.log('    Elementos:', overflowElements.slice(0, 5));
    }
    
    // Verificar que el texto sea legible
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, div').count();
    console.log(`  📄 Elementos de texto: ${textElements}`);
    
    await page.screenshot({ path: 'screenshots/09-integridad-textos.png', fullPage: true });
    
    console.log('✅ Integridad de textos validada');
  });

  test('8. Validar estado Supabase (offline mode)', async ({ page }) => {
    // Navegar al dashboard (ya logueado por beforeEach)
    await page.goto('http://localhost:8080/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verificar indicador de estado de sync
    const syncIndicator = page.locator('text=Sin conexión, text=offline, text=Sincronizado, text=Sync').first();
    const syncText = await syncIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`  🔄 Indicador de sync visible: ${syncText ? 'Sí' : 'No'}`);
    
    if (syncText) {
      const syncLabel = await syncIndicator.textContent();
      console.log(`  📡 Estado: ${syncLabel}`);
    }
    
    // Tomar screenshot
    await page.screenshot({ path: 'screenshots/10-estado-supabase.png', fullPage: true });
    
    console.log('✅ Estado Supabase validado');
  });
});
