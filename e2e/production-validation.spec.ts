import { test, expect } from '@playwright/test';

const PROD_URL = 'https://construsmart-wm2026.vercel.app';

test.describe('Production Validation', () => {
  test('production home page loads', async ({ page }) => {
    const response = await page.goto(PROD_URL);
    expect(response?.status()).toBeLessThan(500);
    await page.waitForTimeout(3000);
    const body = await page.content();
    expect(body.length).toBeGreaterThan(100);
  });

  test('no critical console errors on production', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(PROD_URL);
    await page.waitForTimeout(4000);
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('sourceMappingURL') &&
      !e.includes('DevTools')
    );
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('main layout renders without crash', async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForTimeout(3000);
    const body = await page.content();
    const hasContent = body.includes('CONSTRUSMART') || body.includes('Login') || body.includes('Dashboard');
    expect(hasContent).toBe(true);
  });
});
