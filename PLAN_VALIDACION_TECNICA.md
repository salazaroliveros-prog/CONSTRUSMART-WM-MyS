# Plan de Validación Técnica - CONSTRUSMART ERP

## 📋 Resumen Ejecutivo
Plan de validación técnico optimizado para verificar integridad de la aplicación CONSTRUSMART ERP, enfocado en renderizado, persistencia offline, sincronización automática y responsividad móvil.

**Alcance**: 34 pantallas, 30+ entidades, realtime sync, offline-first architecture
**Duración Estimada**: 4-6 horas (validación completa)
**Método**: Automatizado + Manual (80/20 ratio)

---

## 🎯 Objetivos de Validación

### 1. Integridad de Renderizado
- ✅ Todas las 34 pantallas cargan sin errores
- ✅ Componentes visibles y funcionales
- ✅ Sin errores de consola JavaScript
- ✅ Sin errores de hidratación React
- ✅ Lazy loading funciona correctamente

### 2. Persistencia Offline
- ✅ Datos persisten en localStorage
- ✅ Compresión LZ-String funciona
- ✅ Recuperación ante errores de almacenamiento
- ✅ Validación Zod de datos al cargar
- ✅ Funciona sin conexión a Supabase

### 3. Sincronización Automática
- ✅ Detección de conectividad (online/offline)
- ✅ Cola de mutaciones funciona
- ✅ forceSync envía cambios a Supabase
- ✅ Realtime subscriptions funcionan
- ✅ Manejo de conflictos de sincronización

### 4. Responsividad Móvil
- ✅ Layout adapta a tamaños móviles
- ✅ Touch interactions funcionan
- ✅ Performance aceptable en móvil
- ✅ Sidebar móvil funciona
- ✅ QuickActionsFab accesible en móvil

---

## 🧪 Suite de Pruebas Automatizadas

### A. Pruebas de Compilación y Build
```bash
npm run build          # Build producción
npm run typecheck      # TypeScript strict
npm run lint          # ESLint
npm run test          # Vitest (619 tests existentes)
```

**Criterios de Aceptación**:
- ✅ Exit code 0 en todos los comandos
- ✅ Sin errores de TypeScript
- ✅ Sin warnings críticos de ESLint
- ✅ 619/619 tests pasan

### B. Pruebas de Renderizado (Playwright/E2E)

#### Test Suite: Core Navigation
```typescript
// e2e/navigation.spec.ts
test('core navigation', async ({ page }) => {
  // Login flow
  await page.goto('/')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button[type="submit"]')
  
  // Verify dashboard loads
  await expect(page.locator('h1')).toContainText('Tablero')
  
  // Test navigation to all 34 views
  const views = [
    'dashboard', 'proyectos', 'presupuestos', 'seguimiento', 
    'financiero', 'rrhh', 'bodega', 'crm', 'apu', 'curvas',
    'baseprecios', 'reportes', 'muro', 'ordenes-cambio',
    'notificaciones', 'sso-calidad', 'documentos', 'visor-bim',
    'predictivo', 'exportacion', 'logistica', 'rendimiento-campo',
    'comercial-fin', 'admin-sistema', 'planilla-destajos',
    'impuestos', 'entradas-almacen', 'ajustes', 'hitos',
    'riesgos', 'cuentas-cobrar', 'cuentas-pagar', 'cotizaciones'
  ]
  
  for (const view of views) {
    await page.goto(`/#${view}`)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('.error-boundary')).not.toBeVisible()
  }
})
```

#### Test Suite: Responsive Mobile
```typescript
// e2e/responsive.spec.ts
test('mobile responsiveness', async ({ page, context }) => {
  // Set mobile viewport
  await context.setViewportSize({ width: 375, height: 667 })
  
  await page.goto('/')
  
  // Test sidebar toggle
  await page.click('[aria-label="Menu"]')
  await expect(page.locator('aside')).toBeVisible()
  
  // Test QuickActionsFab accessibility
  const fab = page.locator('[aria-label="Abrir acciones rápidas"]')
  await expect(fab).toBeVisible()
  await fab.click()
  await expect(page.locator('[aria-label="Cerrar acciones rápidas"]')).toBeVisible()
  
  // Test horizontal scrolling tables
  await page.goto('/#proyectos')
  const table = page.locator('table')
  if (await table.isVisible()) {
    await expect(table).toHaveCSS('overflow-x', 'auto')
  }
})
```

#### Test Suite: Offline Persistence
```typescript
// e2e/offline.spec.ts
test('offline persistence', async ({ page, context }) => {
  // Create project online
  await page.goto('/#proyectos')
  await page.click('text=Nuevo Proyecto')
  await page.fill('input[name="nombre"]', 'Test Offline Project')
  await page.click('text=Guardar')
  
  // Clear localStorage to simulate fresh load
  await page.evaluate(() => localStorage.clear())
  
  // Go offline
  await context.setOffline(true)
  
  // Reload and verify data integrity
  await page.reload()
  await expect(page.locator('text=Test Offline Project')).toBeVisible()
  
  // Verify compression works
  const storageSize = await page.evaluate(() => {
    const data = localStorage.getItem('wm_erp_data')
    return data ? data.length : 0
  })
  expect(storageSize).toBeLessThan(5000000) // < 5MB
  
  // Go back online
  await context.setOffline(false)
  
  // Verify sync trigger
  await page.waitForTimeout(2000)
  await expect(page.locator('.sync-status')).toContainText('Sincronizado')
})
```

### C. Pruebas de Sincronización (Unit Tests)

```typescript
// src/erp/__tests__/sync-integration.test.ts
describe('Synchronization Integration', () => {
  test('forceSync sends queued mutations', async () => {
    const { result } = renderHook(() => useErp())
    
    // Create offline mutation
    act(() => {
      result.current.addProyecto({
        nombre: 'Test Sync',
        ubicacion: 'Guatemala',
        tipologia: 'residencial',
        presupuestoTotal: 100000,
        estado: 'planeacion'
      })
    })
    
    // Verify queue has item
    expect(result.current.mutationQueue).toHaveLength(1)
    
    // Simulate online
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    
    // Verify sync attempt
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('erp_proyectos')
    })
  })
  
  test('realtime subscription updates store', async () => {
    const { result } = renderHook(() => useErp())
    
    // Simulate realtime event
    const realtimeEvent = {
      eventType: 'INSERT',
      old: null,
      new: { id: 'test-1', nombre: 'Realtime Test', ...defaultProyecto }
    }
    
    act(() => {
      window.dispatchEvent(new CustomEvent('supabase:realtime', { 
        detail: realtimeEvent 
      }))
    })
    
    // Verify store updated
    await waitFor(() => {
      expect(result.current.proyectos).toHaveLength(1)
    })
  })
})
```

---

## 📱 Validación Manual - Checklist Optimizado

### Phase 1: Core Functionality (30 min)

#### 1. Login & Authentication
- [ ] Login con Google funciona
- [ ] Login con email/password funciona
- [ ] Guest login funciona
- [ ] Logout redirige correctamente
- [ ] Session timeout (30 min) funciona

#### 2. Navigation & Layout
- [ ] Header muestra usuario correcto
- [ ] Sidebar navigation funciona
- [ ] Mobile toggle sidebar funciona
- [ ] Breadcrumb navigation (si aplica)
- [ ] QuickActionsFab aparece y funciona

#### 3. Error Handling
- [ ] ErrorBoundary catchea errores
- [ ] Mensajes de error son claros
- [ ] Recovery buttons funcionan
- [ ] No alerts nativos del navegador

### Phase 2: Screen Validation (60 min)

**Method**: Validación visual rápida de cada pantalla (2 min/screen)

| Pantalla | Carga | Components | Data | Mobile |
|----------|-------|------------|------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Proyectos | ✅ | ✅ | ✅ | ✅ |
| Presupuestos | ✅ | ✅ | ✅ | ✅ |
| Seguimiento | ✅ | ✅ | ✅ | ✅ |
| Financiero | ✅ | ✅ | ✅ | ✅ |
| RRHH | ✅ | ✅ | ✅ | ✅ |
| Bodega | ✅ | ✅ | ✅ | ✅ |
| CRM | ✅ | ✅ | ✅ | ✅ |
| APU Avanzado | ✅ | ✅ | ✅ | ✅ |
| Curvas S | ✅ | ✅ | ✅ | ✅ |
| Base Precios | ✅ | ✅ | ✅ | ✅ |
| Reportes | ✅ | ✅ | ✅ | ✅ |
| Muro | ✅ | ✅ | ✅ | ✅ |
| Ordenes Cambio | ✅ | ✅ | ✅ | ✅ |
| Notificaciones | ✅ | ✅ | ✅ | ✅ |
| SSO Calidad | ✅ | ✅ | ✅ | ✅ |
| Documentos | ✅ | ✅ | ✅ | ✅ |
| Visor BIM | ✅ | ✅ | ✅ | ✅ |
| Predictivo | ✅ | ✅ | ✅ | ✅ |
| Exportación | ✅ | ✅ | ✅ | ✅ |
| Logística | ✅ | ✅ | ✅ | ✅ |
| Rendimiento Campo | ✅ | ✅ | ✅ | ✅ |
| Comercial Fin | ✅ | ✅ | ✅ | ✅ |
| Admin Sistema | ✅ | ✅ | ✅ | ✅ |
| Planilla Destajos | ✅ | ✅ | ✅ | ✅ |
| Impuestos | ✅ | ✅ | ✅ | ✅ |
| Entradas Almacén | ✅ | ✅ | ✅ | ✅ |
| Ajustes | ✅ | ✅ | ✅ | ✅ |
| Hitos | ✅ | ✅ | ✅ | ✅ |
| Riesgos | ✅ | ✅ | ✅ | ✅ |
| Cuentas Cobrar | ✅ | ✅ | ✅ | ✅ |
| Cuentas Pagar | ✅ | ✅ | ✅ | ✅ |
| Cotizaciones | ✅ | ✅ | ✅ | ✅ |

### Phase 3: Offline & Sync (30 min)

#### Offline Validation
1. **Desconectar Internet**
   - [ ] App detecta offline (icono/indicador)
   - [ ] UI permanece funcional
   - [ ] Puede crear/editar registros
   - [ ] Datos se guardan en localStorage
   - [ ] Mutation queue incrementa

2. **Reconectar Internet**
   - [ ] App detecta online automáticamente
   - [ ] Sync inicia automáticamente
   - [ ] Indicador de sync visible
   - [ ] Datos se envían a Supabase
   - [ ] Mutation queue se limpia

3. **Data Integrity**
   - [ ] Datos offline = datos online
   - [ ] Sin pérdida de datos
   - [ ] Validación Zod pasa
   - [ ] Compresión funciona
   - [ ] Health check pasa

### Phase 4: Mobile Responsiveness (30 min)

#### Test Devices
- [ ] iPhone SE (375x667)
- [ ] iPhone 12 Pro (390x844)
- [ ] iPad Mini (768x1024)
- [ ] Android Small (360x640)
- [ ] Android Large (412x915)

#### Validation Points
- [ ] Layout no rompe en ninguno
- [ ] Sidebar mobile toggle funciona
- [ ] Tables tienen scroll horizontal
- [ ] Formularios usables en touch
- [ ] QuickActionsFab accesible
- [ ] Texto legible (min 16px)
- [ ] Botones touch-friendly (min 44x44px)
- [ ] No horizontal scroll en body

---

## 🔧 Herramientas de Validación

### Automatización
```bash
# Instalar dependencias de testing
npm install -D @playwright/test
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Ejecutar tests
npm run test              # Unit tests (619 tests)
npm run test:e2e         # E2E tests (Playwright)
npm run test:coverage    # Coverage report
```

### Performance Monitoring
```typescript
// Browser DevTools integration
const perfData = {
  fcp: 0,      // First Contentful Paint
  lcp: 0,      // Largest Contentful Paint
  fid: 0,      // First Input Delay
  cls: 0,      // Cumulative Layout Shift
  tti: 0,      // Time to Interactive
}

// Mobile performance thresholds
const MOBILE_THRESHOLDS = {
  fcp: 1800,   // < 1.8s
  lcp: 2500,   // < 2.5s
  fid: 100,    // < 100ms
  cls: 0.1,    // < 0.1
  tti: 3800,   // < 3.8s
}
```

### Offline Simulation
```javascript
// Chrome DevTools
// Network tab → Offline checkbox

// O programático
navigator.connection.addEventListener('change', () => {
  console.log('Network changed:', navigator.connection.effectiveType)
})
```

---

## 📊 Criterios de Aceptación

### Build & Compilation
- ✅ `npm run build`: Exit code 0
- ✅ `npm run typecheck`: 0 errors
- ✅ `npm run lint`: 0 errors, < 5 warnings
- ✅ `npm run test`: 619/619 tests pass
- ✅ Bundle size: < 500KB (gzipped)

### Runtime Performance
- ✅ First Contentful Paint: < 1.8s (mobile)
- ✅ Time to Interactive: < 3.8s (mobile)
- ✅ First Input Delay: < 100ms
- ✅ Cumulative Layout Shift: < 0.1

### Offline Functionality
- ✅ Persistencia: 100% datos guardados
- ✅ Compresión: > 50% reducción tamaño
- ✅ Recuperación: 100% datos recuperados
- ✅ Validación: 100% datos validados por Zod

### Sync Functionality
- ✅ Detección online/offline: < 1s
- ✅ Sync automático: < 5s después de conectar
- ✅ Success rate: > 95% sync completados
- ✅ Conflict handling: 100% resoluciones

### Mobile Responsiveness
- ✅ All 34 screens: Responsive
- ✅ Touch targets: ≥ 44x44px
- ✅ Font size: ≥ 16px body text
- ✅ No horizontal scroll: En body
- ✅ QuickActionsFab: Accessible

---

## 🐛 Troubleshooting Guide

### Issue: Screen no carga
**Diagnosis**: 
- Check browser console for errors
- Verify lazy loading working
- Check network tab for failed requests

**Solution**:
- Verify View type matches sidebar
- Check ErrorBoundary for caught errors
- Test with different project filter

### Issue: Datos no persisten offline
**Diagnosis**:
- Check localStorage quota
- Verify compression working
- Check Zod validation errors

**Solution**:
- Clear localStorage and retry
- Check `isStorageQuotaCritical` flag
- Verify `safeSetItem` fallback

### Issue: Sync no funciona
**Diagnosis**:
- Check Supabase connection
- Verify mutation queue
- Check realtime subscriptions

**Solution**:
- Verify internet connection
- Check `forceSync` function
- Test realtime manually

### Issue: Mobile layout roto
**Diagnosis**:
- Check viewport meta tag
- Verify Tailwind responsive classes
- Check fixed positioning elements

**Solution**:
- Add missing responsive prefixes
- Fix overflow properties
- Test on actual device

---

## 📈 Reporte de Validación

### Template
```markdown
## Validación Técnica - [Fecha]

### Resumen
- Screens probadas: 34/34
- Tests automatizados: 619/619 passed
- Issues críticos: 0
- Issues menores: [n]
- Performance: [A/B/C]

### Detalles por Categoría

#### Build & Compilation
- Estado: ✅ Pass
- Tiempo build: [X]s
- Bundle size: [X]KB

#### Renderizado
- Screens: 34/34 ✅
- Components: 100% ✅
- Console errors: 0 ✅

#### Offline & Sync
- Persistencia: ✅ Pass
- Compresión: ✅ Pass
- Sync: ✅ Pass
- Data integrity: ✅ Pass

#### Mobile Responsiveness
- Devices probados: [n]
- Screens responsive: 34/34 ✅
- Touch targets: ✅ Pass
- Performance móvil: ✅ Pass

### Issues Encontrados
1. [Descripción] - Severidad: [High/Medium/Low]
2. [Descripción] - Severidad: [High/Medium/Low]

### Recomendaciones
- [Recomendación 1]
- [Recomendación 2]

### Firma Validador
- Nombre: [Nombre]
- Fecha: [Fecha]
```

---

## 🚀 Ejecución Rápida (30 min)

```bash
# 1. Build y Tests (5 min)
npm run build && npm run typecheck && npm run test

# 2. Iniciar aplicación (2 min)
npm run dev

# 3. Validación Manual (20 min)
# - Login y navigation básica (5 min)
# - Validar 5 screens críticos (10 min)
# - Test offline/sync (5 min)

# 4. Mobile Check (3 min)
# - Chrome DevTools device toolbar
# - Test 3 viewports diferentes
```

---

## 📞 Contacto & Soporte

**Para issues durante validación**:
- Revisar AGENTS.md para arquitectura
- Check existing tests en `src/__tests__/`
- Revisar documentación QuickActionsFab

**Escalation Criteria**:
- > 5 screens fallan renderizado
- Offline persistencia falla > 50%
- Sync success rate < 90%
- Performance móvil > 5s TTI

---

**Versión**: 1.0
**Fecha**: 2026-06-18
**Estado**: ✅ Ready for Execution
**Duración Estimada**: 4-6 horas (validación completa)
