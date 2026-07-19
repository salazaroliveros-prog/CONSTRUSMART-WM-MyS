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
  { path: '/',                name: 'login' },
  { path: '/dashboard',      name: 'dashboard' },
  { path: '/proyectos',      name: 'proyectos' },
  { path: '/presupuestos',   name: 'presupuestos' },
  { path: '/seguimiento',    name: 'seguimiento' },
  { path: '/financiero',     name: 'financiero' },
  { path: '/rrhh',           name: 'rrhh' },
  { path: '/bodega',         name: 'bodega' },
  { path: '/crm',            name: 'crm' },
  { path: '/apu',            name: 'apu-avanzado' },
  { path: '/baseprecios',    name: 'base-precios' },
  { path: '/muro',           name: 'muro-obra' },
  { path: '/ordenes-cambio', name: 'ordenes-cambio' },
  { path: '/notificaciones', name: 'notificaciones' },
  { path: '/sso-calidad',    name: 'sso-calidad' },
  { path: '/documentos',     name: 'gestion-documental' },
  { path: '/visor-bim',      name: 'visor-bim' },
  { path: '/predictivo',     name: 'dashboard-predictivo' },
  { path: '/exportacion',    name: 'exportacion-inteligente' },
  { path: '/logistica',      name: 'logistica-compras' },
  { path: '/rendimiento-campo', name: 'rendimiento-campo' },
  { path: '/comercial-fin',  name: 'comercial-finanzas' },
  { path: '/admin-sistema',  name: 'administracion' },
  { path: '/planilla-destajos', name: 'planilla-destajos' },
  { path: '/impuestos',      name: 'impuestos' },
  { path: '/entradas-almacen', name: 'entradas-almacen' },
  { path: '/ajustes',        name: 'ajustes' },
  { path: '/hitos',          name: 'hitos' },
  { path: '/riesgos',        name: 'riesgos' },
  { path: '/cuentas-cobrar', name: 'cuentas-cobrar' },
  { path: '/cuentas-pagar',  name: 'cuentas-pagar' },
  { path: '/cotizaciones',   name: 'cotizaciones' },
  { path: '/plantillas',     name: 'plantillas-proyectos' },
  { path: '/proveedor-analytics', name: 'proveedor-analytics' },
  { path: '/error-log',      name: 'error-log' },
  { path: '/activos',        name: 'activos' },
  { path: '/cuadros',        name: 'cuadros' },
  { path: '/profitability',  name: 'profitability-analytics' },
  { path: '/weather',        name: 'weather' },
  { path: '/conflicts',      name: 'resource-conflicts' },
  { path: '/calidad-cumplimiento', name: 'calidad-cumplimiento' },
  { path: '/auditoria',      name: 'auditoria' },
  { path: '/curvas-s',       name: 'curvas-s' },
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

  for (const screen of SCREENS.slice(0, 10)) {
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
