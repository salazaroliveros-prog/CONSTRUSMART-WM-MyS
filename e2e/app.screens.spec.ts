import { test, expect } from '@playwright/test';

test('Carga la pantalla de login del ERP', async ({ page }) => {
  await page.goto('http://localhost:8080');
  // Verificar que la página carga con el título correcto
  await expect(page).toHaveTitle(/CONSTRUSMART WM/);
  // Verificar que el header de la empresa se renderiza
  await expect(page.locator('text=CONSTRUCTORA WM')).toBeVisible();
  // Verificar que el botón de login con Google está presente
  await expect(page.locator('text=Continuar con Google').first()).toBeVisible();
});

test('Login muestra botón de Google y mensaje de acceso', async ({ page }) => {
  await page.goto('http://localhost:8080');
  // Verificar que existe el botón de continuar con Google
  await expect(page.locator('text=Continuar con Google').first()).toBeVisible();
  // Verificar que se muestra el mensaje de acceso restringido
  await expect(page.locator('text=Solo el correo autorizado puede acceder').first()).toBeVisible();
});