import { test, expect } from '@playwright/test';

test('Mobile login layout se adapta correctamente a pantallas pequeñas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('button:has-text("Continuar con Google")')).toBeVisible();
  await expect(page.locator('text=Solo el correo autorizado puede acceder')).toBeVisible();
  await expect(page.locator('div.min-h-screen')).toBeVisible();
  await expect(page.locator('div.max-w-sm')).toBeVisible();
});

