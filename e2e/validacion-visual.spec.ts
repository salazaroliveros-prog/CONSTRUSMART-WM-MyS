import { test, expect } from '@playwright/test';

test.describe('CONSTRUSMART ERP - Validación Visual de Pantallas', () => {
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

  SCREENS.forEach((screen) => {
    test(`${screen.name} - Verificar que carga`, async ({ page }) => {
      console.log(`🔍 Navegando a ${screen.name}...`);
      
      await page.goto(`${BASE_URL}${screen.path}`, { waitUntil: 'networkidle' });
      
      // Esperar a que la página cargue (máximo 10 segundos)
      await page.waitForTimeout(3000);
      
      // Verificar que la página tiene contenido
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      // Capturar screenshot
      await page.screenshot({ 
        path: `screenshots/${screen.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true 
      });
      
      console.log(`✅ ${screen.name} cargada correctamente`);
    });
  });
});
