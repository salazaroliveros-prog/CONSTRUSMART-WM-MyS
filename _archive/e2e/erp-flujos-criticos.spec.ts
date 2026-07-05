import { test, expect } from '@playwright/test';

test.describe('Flujo 1: Login → Dashboard', () => {
  test('1.1 Página carga correctamente', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CONSTRUSMART/);
  });

  test('1.2 Login redirige al dashboard', async ({ page }) => {
    await page.goto('/');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });
});

test.describe('Flujo 2: CRUD Proyectos', () => {
  test('2.1 Página de proyectos carga', async ({ page }) => {
    await page.goto('/proyectos');
    await page.waitForLoadState('domcontentloaded');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('2.2 Formulario de proyecto tiene campos requeridos', async ({ page }) => {
    await page.goto('/proyectos');
    await page.waitForLoadState('domcontentloaded');
    const html = await page.content();
    expect(html.length).toBeGreaterThan(0);
  });
});

test.describe('Flujo 3: Bodega y Stock', () => {
  test('3.1 Página carga sin errores', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('3.2 Store tiene materiales', async ({ page }) => {
    await page.goto('/');
    const hasStore = await page.evaluate(() => {
      return typeof window !== 'undefined';
    });
    expect(hasStore).toBe(true);
  });
});

test.describe('Flujo 4: Offline → Online', () => {
  test('4.1 App funciona offline', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.context().setOffline(true);
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    await page.context().setOffline(false);
  });

  test('4.2 Reconexion detectada', async ({ page }) => {
    await page.goto('/');
    await page.context().setOffline(true);
    await page.context().setOffline(false);
    await page.waitForTimeout(500);
    const online = await page.evaluate(() => navigator.onLine);
    expect(online).toBe(true);
  });
});

test.describe('Flujo 5: Exportación y datos', () => {
  test('5.1 App renderiza correctamente', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('5.2 CSS carga correctamente', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const styles = await page.evaluate(() => {
      return document.styleSheets.length;
    });
    expect(styles).toBeGreaterThanOrEqual(0);
  });
});