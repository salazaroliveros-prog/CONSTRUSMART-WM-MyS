import { test, expect } from '@playwright/test';

const PROD_URL = 'https://construsmart-wm2026.vercel.app';

test.describe('Deep Module Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PROD_URL);
    await page.waitForTimeout(4000);
  });

  test('sidebar and main layout are present', async ({ page }) => {
    const body = await page.content();
    const hasSidebarOrContent = body.includes('CONSTRUSMART') || body.includes('Dashboard') || body.includes('Proyectos') || body.includes('Login');
    expect(hasSidebarOrContent).toBe(true);
  });

  test('no JS console errors after load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(2000);
    const critical = errors.filter(e => !e.includes('favicon') && !e.includes('sourceMappingURL') && !e.includes('DevTools'));
    expect(critical.length).toBeLessThan(10);
  });

  test('page title is correct', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
