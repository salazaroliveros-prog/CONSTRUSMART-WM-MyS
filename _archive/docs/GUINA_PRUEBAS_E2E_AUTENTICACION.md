# Guía: Optimizar Pruebas E2E con Autenticación

## Estado Actual

Las pruebas E2E actuales (`e2e/verificar-produccion.spec.ts`) tienen las siguientes limitaciones:
- No pueden probar el dashboard completo (requiere autenticación)
- 2/19 pruebas fallan por redirección a login de Google
- No validan funcionalidad CRUD con Supabase autenticado

## Solución Propuesta

### Opción 1: Mock de Autenticación (Recomendada para CI/CD)

Modificar las pruebas para usar un usuario mockeado:

```typescript
// e2e/verificar-produccion-auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CONSTRUSMART ERP - Verificación con Autenticación Mock', () => {
  test.beforeEach(async ({ page }) => {
    // Mock user data
    await page.evaluate(() => {
      localStorage.setItem('wm_erp_data_auth', JSON.stringify({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          nombre: 'Test User',
          rol: 'Administrador'
        },
        token: 'mock-jwt-token'
      }));
    });
  });

  test('Dashboard con autenticación', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // Verificar que carga el dashboard completo
    await expect(page.locator('h1')).toContainText('Tablero');
    await expect(page.locator('[class*="card"]').first()).toBeVisible();
  });
});
```

### Opción 2: Autenticación Real con Supabase (Para Testing Manual)

Requiere credenciales de Supabase:

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:5173',
    storageState: 'auth-state.json',
  },
});
```

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', process.env.TEST_EMAIL);
  await page.click('button:has-text("Continuar con Google")');
  // Manejar flow de OAuth real
  await page.context().storageState({ path: 'auth-state.json' });
});
```

### Opción 3: Tests Isolados por Funcionalidad

Separar pruebas en suites específicas:

```typescript
// e2e/dashboard.spec.ts - Pruebas sin autenticación
// e2e/dashboard-auth.spec.ts - Pruebas con autenticación mock
// e2e/crud.spec.ts - Pruebas CRUD con Supabase
```

## Requisitos para Opción 2 (Autenticación Real)

1. **Credenciales de Supabase** en variables de entorno:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_KEY=your-anon-key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   TEST_EMAIL=test@example.com
   TEST_PASSWORD=your-password
   ```

2. **Usuario de Testing** en Supabase:
   - Crear usuario específico para tests
   - Rol: Administrador
   - Email: test@example.com

3. **Configuración Playwright**:
   ```typescript
   // playwright.config.ts
   export default defineConfig({
     projects: [
       {
         name: 'authenticated',
         use: {
           storageState: 'e2e/.auth/authenticated-user-state.json',
         },
       },
     ],
   });
   ```

## Implementación Recomendada

Para el escenario actual (sin credenciales de Supabase disponibles):

1. **Mantener pruebas actuales** para verificación básica
2. **Agregar pruebas mock** para funcionalidad dashboard
3. **Documentar** requisitos para pruebas con autenticación real

Esto permite:
- Verificar que la app carga correctamente (actual)
- Probar UI de dashboard sin Supabase (nuevo)
- Preparar infraestructura para pruebas completas cuando se tengan credenciales

## Archivos a Crear

1. `e2e/dashboard-mock.spec.ts` - Pruebas de dashboard con auth mock
2. `e2e/crud-mock.spec.ts` - Pruebas CRUD con datos mock
3. `e2e/auth.spec.ts` - Pruebas de flujo de autenticación (manual)

## Comando para Ejecutar

```bash
# Pruebas actuales (sin auth)
npx playwright test e2e/verificar-produccion.spec.ts

# Pruebas nuevas (con mock)
npx playwright test e2e/dashboard-mock.spec.ts

# Todas las pruebas
npx playwright test e2e/
```

## Notas

- Las pruebas con mock son más rápidas y estables
- Las pruebas con auth real son más completas pero requieren setup adicional
- Para CI/CD, recomendar usar mock de autenticación
- Para testing manual pre-deploy, usar auth real
