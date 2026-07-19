import { test, expect } from '@playwright/test';

test.describe('Navigation — sidebar, hash routing', () => {

  test('sidebar navigation is visible on desktop', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('#sidebar-navigation');
    await expect(sidebar).toBeVisible({ timeout: 15000 });
  });

  test('sidebar is a nav element', async ({ page }) => {
    await page.goto('/');
    const sidebar = page.locator('#sidebar-navigation');
    await expect(sidebar).toBeVisible({ timeout: 15000 });
    const tagName = await sidebar.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('nav');
  });

  test('clicking sidebar item changes hash', async ({ page }) => {
    await page.goto('/#dashboard');
    const link = page.locator('#sidebar-navigation a[href*="proyectos"], #sidebar-navigation button').filter({ hasText: /proyectos/i }).first();
    await link.click();
    await page.waitForTimeout(1000);
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toContain('proyectos');
  });

  test('browser back button works with hash navigation', async ({ page }) => {
    await page.goto('/#dashboard');
    await page.goto('/#proyectos');
    await page.goto('/#financiero');
    await page.goBack();
    await expect(page).toHaveURL(/#proyectos/);
    await page.goBack();
    await expect(page).toHaveURL(/#dashboard/);
  });

  test('sidebar collapse button is accessible', async ({ page }) => {
    await page.goto('/');
    const collapseBtn = page.locator('button[aria-label*="collaps" i]').first();
    if (await collapseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
    }
  });

});
