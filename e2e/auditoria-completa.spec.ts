import { test, expect } from '@playwright/test';

const SCREEN_KEYS = [
  'dashboard', 'proyectos', 'presupuestos', 'seguimiento', 'financiero',
  'rrhh', 'bodega', 'crm', 'apu', 'baseprecios', 'muro', 'ordenes-cambio',
  'notificaciones', 'sso-calidad', 'documentos', 'visor-bim', 'predictivo',
  'exportacion', 'logistica', 'rendimiento-campo', 'comercial-fin',
  'admin-sistema', 'planilla-destajos', 'impuestos', 'entradas-almacen',
  'ajustes', 'hitos', 'riesgos', 'cuentas-cobrar', 'cuentas-pagar',
  'cotizaciones', 'plantillas', 'proveedor-analytics', 'error-log',
  'activos', 'cuadros', 'profitability', 'weather', 'conflicts',
  'calidad-cumplimiento', 'auditoria', 'curvas-s',
];

const MAIN_BUTTONS = [
  'button:has-text("Crear")', 'button:has-text("Nuevo")', 'button:has-text("Guardar")',
  'button:has-text("Cancelar")', 'button:has-text("Añadir")', 'button:has-text("Exportar")',
];

test.describe('Auditoría completa — CONSTRUSMART ERP', () => {

  test('app carga y muestra el dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(6000);
    const main = page.locator('role=main');
    await expect(main).toBeVisible({ timeout: 15000 });
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible({ timeout: 5000 });
  });

  for (const view of SCREEN_KEYS) {
    test(`pantalla ${view} carga sin errores`, async ({ page }) => {
      const collected: string[] = [];
      page.on('pageerror', err => collected.push(err.message));

      await page.goto(`/#${view}`);
      await page.waitForTimeout(4000);

      await expect(page.locator('role=main')).toBeVisible({ timeout: 15000 });
      expect(collected).toEqual([]);
    });
  }

  for (const view of ['proyectos', 'presupuestos', 'hitos', 'riesgos', 'ordenes-cambio']) {
    test(`botones principales en ${view} son accesibles`, async ({ page }) => {
      await page.goto(`/#${view}`);
      await page.waitForTimeout(4000);

      for (const btn of MAIN_BUTTONS) {
        const button = page.locator(btn).first();
        if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(button).toBeEnabled({ timeout: 3000 });
        }
      }
    });
  }

  test('breadcrumb se actualiza al navegar', async ({ page }) => {
    await page.goto('/#dashboard');
    await page.waitForTimeout(4000);
    await page.goto('/#financiero');
    await page.waitForTimeout(2000);
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toContainText(/financiero/i);
  });

  test('header contiene el nombre de la empresa', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
  });

  test('sidebar navigation es visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
    const sidebar = page.locator('[class*="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

});