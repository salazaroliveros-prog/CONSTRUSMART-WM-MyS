import { test, expect } from '@playwright/test';

const VIEWS = [
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

test.describe('Smoke tests — screen loading', () => {

  test('app root loads main content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('role=main')).toBeVisible({ timeout: 15000 });
  });

  for (const view of VIEWS) {
    test(`${view} renders without error`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));

      await page.goto(`/#${view}`);
      await expect(page.locator('role=main')).toBeVisible({ timeout: 15000 });

      expect(errors).toEqual([]);
    });
  }

  test.describe('breadcrumb', () => {

    test('shows current view name after navigation', async ({ page }) => {
      await page.goto('/#proyectos');
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(breadcrumb).toBeVisible({ timeout: 10000 });
      await expect(breadcrumb).toContainText(/proyectos/i);
    });

    test('hash change updates breadcrumb', async ({ page }) => {
      await page.goto('/#dashboard');
      await page.goto('/#financiero');
      const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
      await expect(breadcrumb).toContainText(/financiero/i);
    });

  });

});
