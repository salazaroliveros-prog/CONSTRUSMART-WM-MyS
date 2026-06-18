import { test, expect } from '@playwright/test';

test('Dashboard charts render with live Supabase data', async ({ page }) => {
  await page.goto('http://localhost:8080/#dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);

  const chartText = await page.textContent('body');
  expect(chartText).toMatch(/planif|real/i);

  const chartEls = await page.locator('canvas, .recharts-wrapper, svg').count();
  expect(chartEls).toBeGreaterThan(0);
});
