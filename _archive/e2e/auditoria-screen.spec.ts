import { test, expect } from '@playwright/test';

test.describe('Auditoría Screen', () => {

  test('debe cargar con título y KPIs visibles', async ({ page }) => {
    await page.goto('/auditoria');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toContain('Auditoría');
    expect(body).toContain('Cambios');
  });

  test('debe mostrar la tabla de auditoría', async ({ page }) => {
    await page.goto('/auditoria');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const hasTable = await page.evaluate(() => {
      return !!document.querySelector('table');
    });
    expect(hasTable).toBe(true);
  });

  test('debe tener el botón de exportar CSV', async ({ page }) => {
    await page.goto('/auditoria');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const body = await page.textContent('body');
    expect(body).toContain('CSV');
  });

  test('debe tener filtros de búsqueda', async ({ page }) => {
    await page.goto('/auditoria');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const hasInput = await page.evaluate(() => {
      return !!document.querySelector('input');
    });
    expect(hasInput).toBe(true);
  });

  test('debe tener KPIs numéricos', async ({ page }) => {
    await page.goto('/auditoria');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const kpiValues = await page.evaluate(() => {
      const boldTexts = Array.from(document.querySelectorAll('[class*="font-bold"]'));
      return boldTexts.map(el => el.textContent).filter(Boolean);
    });
    expect(kpiValues.length).toBeGreaterThanOrEqual(4);
  });

  test('debe abrir modal de detalle al hacer clic en Ver', async ({ page }) => {
    await page.goto('/auditoria');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const verButton = page.locator('button:has-text("Ver")').first();
    if (await verButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await verButton.click();
      await page.waitForTimeout(2000);

      const hasModal = await page.evaluate(() => {
        return !!document.querySelector('.ant-modal') ||
               !!document.querySelector('.ant-modal-root') ||
               Array.from(document.querySelectorAll('*')).some(el =>
                 el.className?.includes?.('modal') || el.id?.includes?.('modal')
               );
      });
      expect(hasModal).toBe(true);
    }
  });
});
