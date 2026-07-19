import { test, expect } from '@playwright/test';

const KEY_SCREENS = [
  'dashboard', 'proyectos', 'financiero', 'seguimiento', 'bodega',
  'cotizaciones', 'notificaciones', 'presupuestos', 'rrhh', 'crm',
  'muro', 'hitos', 'curvas-s', 'logistica', 'impuestos',
];

test.describe('Key user flows', () => {

  for (const view of KEY_SCREENS) {
    test(`${view} screen loads main content`, async ({ page }) => {
      await page.goto(`/#${view}`);
      await expect(page.locator('role=main')).toBeVisible({ timeout: 15000 });
    });
  }

  test('main content area has correct aria attributes', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('role=main');
    await expect(main).toHaveAttribute('aria-label');
    await expect(main).toHaveAttribute('id', 'main-content');
  });

  test('breadcrumb is present with ERP label', async ({ page }) => {
    await page.goto('/#dashboard');
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible({ timeout: 10000 });
    await expect(breadcrumb).toContainText(/ERP/i);
  });

  test('header is visible on dashboard', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header').first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

});
