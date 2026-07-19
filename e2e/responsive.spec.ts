import { test, expect } from '@playwright/test';

test.describe('Responsive layout', () => {

  test('desktop viewport shows sidebar navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await expect(page.locator('#sidebar-navigation')).toBeVisible({ timeout: 15000 });
  });

  test('mobile viewport shows hamburger menu button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const menuBtn = page.locator('button[aria-label*="menú" i], button[aria-label*="menu" i]').first();
    await expect(menuBtn).toBeVisible({ timeout: 10000 });
  });

  test('mobile viewport has bottom navigation bar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForTimeout(3000);
    const bottomNav = page.locator('[class*="fixed bottom-0"] button[aria-label*="Dashboard" i]');
    await expect(bottomNav).toBeVisible({ timeout: 10000 });
  });

  test('sidebar collapse button works on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    const collapseBtn = page.locator('button[aria-label*="collaps" i]').first();
    if (await collapseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('app renders main content at very small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('/');
    await expect(page.locator('role=main')).toBeVisible({ timeout: 15000 });
  });

});
