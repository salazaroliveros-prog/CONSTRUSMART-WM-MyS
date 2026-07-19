import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests — CONSTRUSMART ERP
 *
 * Primera ejecución: genera los snapshots base en e2e/__snapshots__/
 * Ejecuciones siguientes: compara contra los snapshots base (maxDiffPixelRatio 2%)
 *
 * Para regenerar snapshots: npx playwright test visual-regression --update-snapshots
 */

const SCREENS = [
  { path: '/',             name: 'login' },
  { path: '/dashboard',   name: 'dashboard' },
  { path: '/proyectos',   name: 'proyectos' },
  { path: '/presupuestos',name: 'presupuestos' },
  { path: '/financiero',  name: 'financiero' },
  { path: '/bodega',      name: 'bodega' },
  { path: '/rrhh',        name: 'rrhh' },
  { path: '/ajustes',     name: 'ajustes' },
];

test.describe('Visual Regression — pantallas principales', () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations for stable screenshots
    await page.addStyleTag({ content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }' });
  });

  for (const screen of SCREENS) {
    test(`${screen.name} — snapshot`, async ({ page }) => {
      await page.goto(screen.path, { waitUntil: 'networkidle' });
      // Wait for skeleton loaders to resolve
      await page.waitForTimeout(800);
      // Hide dynamic content that changes between runs
      await page.addStyleTag({
        content: `
          [data-testid="sync-indicator"],
          [data-testid="clock"],
          .animate-spin { visibility: hidden !important; }
        `,
      });
      await expect(page).toHaveScreenshot(`${screen.name}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.03,
      });
    });
  }
});

test.describe('Visual Regression — responsive mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({ content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }' });
  });

  for (const screen of [SCREENS[0], SCREENS[1], SCREENS[2]]) {
    test(`${screen.name} mobile — snapshot`, async ({ page }) => {
      await page.goto(screen.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(800);
      await expect(page).toHaveScreenshot(`${screen.name}-mobile.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.03,
      });
    });
  }
});
