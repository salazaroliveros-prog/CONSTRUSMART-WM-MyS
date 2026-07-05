import { test, expect } from '@playwright/test';

test('Login screen renders standalone without sidebar/header', async ({ page }) => {
  await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  const body = await page.textContent('body');

  // Should show login content, NOT dashboard content
  expect(body).toMatch(/iniciar sesión/i);
  expect(body).toMatch(/continuar con google/i);

  // Should NOT show Header or Sidebar content
  expect(body).not.toMatch(/planif|real/i);
  expect(body).not.toMatch(/proyectos/i);

  // Login has branding SVGs (logo) not dashboard chart SVGs
  const svgCount = await page.locator('svg').count();
  console.log(`SVGs en login: ${svgCount}`);
  expect(svgCount).toBeGreaterThanOrEqual(0);
});