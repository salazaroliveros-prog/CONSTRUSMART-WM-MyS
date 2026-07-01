# 🚀 PLAN DE OPTIMIZACIÓN DE PERFORMANCE - CONSTRUSMART ERP

**Fecha**: 2026-07-01  
**Estado**: 📋 Planificación  
**Objetivo**: Mejorar performance de carga y bundle size

---

## 📊 ANÁLISIS ACTUAL (BASELINE)

### Bundle Size por Categoría (del build output)

**CHUNKS GRANDES (>15 KB)**:
- PlantillasProyectos: 19.50 KB (gzip: 6.04 KB)
- Proyectos: 18.80 KB (gzip: 5.86 KB)
- AppLayout: 19.50 KB (gzip: 6.04 KB)
- Presupuestos: 18.25 KB (gzip: 5.63 KB)
- BasePrecios: 16.53 KB (gzip: 4.15 KB)
- CurvasS: 16.20 KB (gzip: 4.34 KB)
- ReportesTecnicos: 18.80 KB (gzip: 4.16 KB)
- Riesgos: 18.25 KB (gzip: 4.25 KB)
- Hitos: 15.56 KB (gzip: 4.16 KB)
- Seguimiento: 15.93 KB (gzip: 4.91 KB)
- Ajustes: 16.45 KB (gzip: 5.26 KB)
- ProveedorAnalytics: 16.09 KB (gzip: 3.72 KB)
- DashboardPredictivo: 13.84 KB (gzip: 3.19 KB)
- export: 15.93 KB (gzip: 4.91 KB)
- motorCalculo: 17.22 KB (gzip: 4.35 KB)
- ComercialFinanzas: 17.27 KB (gzip: 3.77 KB)
- QuickActionsFab: 17.44 KB (gzip: 5.33 KB)

**CHUNKS MEDIANOS (10-15 KB)**:
- Sidebar: 13.24 KB (gzip: 4.27 KB)
- ErrorLog: 13.66 KB (gzip: 3.93 KB)
- Financiero: 11.15 KB (gzip: 3.08 KB)
- CuentasCobrar: 11.01 KB (gzip: 2.82 KB)
- PlanillaDestajos: 11.26 KB (gzip: 3.02 KB)
- Administracion: 11.56 KB (gzip: 2.86 KB)
- Cuadros: 12.01 KB (gzip: 2.82 KB)
- Charts: 12.25 KB (gzip: 3.63 KB)
- LogisticaCompras: 12.27 KB (gzip: 2.95 KB)
- CuentasPagar: 10.63 KB (gzip: 2.68 KB)
- RRHH: 10.84 KB (gzip: 2.74 KB)
- Bitacora: 11.20 KB (gzip: 2.81 KB)
- RendimientoCampo: 10.31 KB (gzip: 2.44 KB)

**CSS**:
- index.css: 129.71 KB (gzip: 20.97 KB) - PRINCIPAL PROBLEMA
- Proyectos.css: 16.00 KB (gzip: 6.53 KB)

**TOTAL ESTIMADO**: ~500 KB (gzip: ~150 KB)

---

## 🎯 OBJETIVOS DE OPTIMIZACIÓN

### Metas
- **Tiempo de carga inicial**: < 2s (3G)
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Bundle size total**: < 300 KB (gzip: < 100 KB)
- **CSS total**: < 50 KB (gzip: < 15 KB)

### Impacto Esperado
- **Score Lighthouse**: 85+ (actual: ~70)
- **Reducción bundle**: 40-50%
- **Tiempo de carga**: 30-40% más rápido

---

## 🔧 PLAN DE ACCIÓN (POR PRIORIDAD)

### 🔴 PRIORIDAD ALTA (Impacto Inmediato)

#### 1. Optimización CSS (CRÍTICO)
**Problema**: `index.css` es 129.71 KB (20.97 KB gzip)

**Acciones**:
- Migrar a Tailwind CSS con purging agresivo
- Eliminar CSS no usado (tree-shaking)
- Extraer CSS crítico para inline en HTML
- Lazy loading de CSS por pantalla

**Herramientas**:
- `@tailwindcss/purge` (ya configurado, verificar efectividad)
- `purgecss` como fallback
- `critters` para CSS crítico

**Estimado**: Reducir CSS a ~30 KB (gzip: ~8 KB) → **75% reducción**

---

#### 2. Code Splitting Agresivo
**Problema**: Todos los chunks cargan en el bundle inicial

**Acciones**:
- Ya existe lazy loading en `AppLayout.tsx` (✅ bien)
- Verificar que todas las screens secundarias estén lazy
- Agregar prefetching inteligente (solo cuando usuario navega)
- Implementar route-based code splitting

**Archivos a verificar**:
- `AppLayout.tsx` - revisar lazy imports
- Identificar componentes pesados no lazy-loaded

**Estimado**: Reducir bundle inicial 30-40%

---

#### 3. Optimización de Imágenes
**Problema**: Sin evidencia directa, pero probable optimización necesaria

**Acciones**:
- Implementar `next/image` o `react-image` con lazy loading
- Convertir a WebP/AVIF
- Responsive images con srcset
- Placeholder blur/shimmer

**Herramientas**:
- `sharp` para conversión WebP
- `lqip` para placeholders

**Estimado**: Reducir tamaño imágenes 50-70%

---

### 🟡 PRIORIDAD MEDIA (Mejoras Sustanciales)

#### 4. Tree Shaking de Librerías
**Problema**: Librerías grandes con imports no usados

**Acciones**:
- Revisar `three.js` y `web-ifc` (muy pesados para IFC)
- Considerar alternativas más ligeras para visualización 3D
- Verificar Ant Design imports (usar solo componentes necesarios)
- Optimizar imports de `jspdf`, `xlsx`, `html2canvas`

**Ejemplo**:
```typescript
// ❌ MAL
import * as THREE from 'three';
import * as antd from 'antd';

// ✅ BIEN
import { Scene, PerspectiveCamera } from 'three';
import { Button, Modal } from 'antd';
```

**Estimado**: Reducir bundle 15-20%

---

#### 5. Optimización de Queries Supabase
**Problema**: Queries con `select *` traen todos los campos

**Acciones**:
- Especificar solo campos necesarios en select
- Implementar paginación en listas grandes
- Caching inteligente en React Query
- Optimizar joins múltiples

**Ejemplo**:
```typescript
// ❌ MAL
supabase.from('erp_proyectos').select('*')

// ✅ BIEN
supabase.from('erp_proyectos').select('id, nombre, estado, cliente_id, fecha_inicio')
```

**Estimado**: Reducir payload 30-40%

---

#### 6. Memoización de Componentes
**Problema**: Re-renders innecesarios

**Acciones**:
- `React.memo` en componentes pesados
- `useMemo` para cálculos costosos
- `useCallback` para callbacks que pasan a hijos
- Virtual scrolling para listas largas

**Herramientas**:
- `react-window` o `react-virtualized`
- React DevTools Profiler

**Estimado**: Reducir re-renders 40-50%

---

### 🟢 PRIORIDAD BAJA (Pulido)

#### 7. Service Worker / Caching
**Problema**: Sin caching offline mejorado

**Acciones**:
- Implementar Workbox para caching
- Estrategia cache-first para assets estáticos
- Network-first para datos Supabase
- Background sync para offline

**Herramientas**:
- `workbox-webpack-plugin`
- `vite-plugin-pwa`

**Estimado**: Mejorar rendimiento recargas 50-70%

---

#### 8. Prefetching Inteligente
**Problema**: Sin prefetching predictivo

**Acciones**:
- Prefetch próxima pantalla basado en navegación
- Preload imágenes críticas
- DNS prefetch para dominios externos

**Estimado**: Mejorar perceived performance 20-30%

---

## 🛠️ HERRAMIENTAS DE ANÁLISIS

### Métricas Web Vitals
- **Lighthouse**: Audit completo
- **WebPageTest**: Test de carga real
- **Chrome DevTools**: Performance profiling

### Bundle Analysis
- `rollup-plugin-visualizer`: Visualizar bundle
- `webpack-bundle-analyzer`: Analizar dependencias
- `source-map-explorer`: Mapear source maps

### Monitoring Producción
- **Vercel Analytics**: Métricas reales
- **Sentry**: Error tracking + performance
- **Google Analytics**: User behavior

---

## 📋 IMPLEMENTACIÓN (Fase 1)

### SESIÓN PRÓXIMA

#### Paso 1: Análisis Baseline (30 min)
1. Instalar `rollup-plugin-visualizer`
2. Generar reporte visual del bundle
3. Ejecutar Lighthouse en producción
4. Documentar métricas actuales

#### Paso 2: Optimización CSS (1 hora)
1. Configurar purging agresivo de Tailwind
2. Identificar CSS no usado
3. Extraer CSS crítico
4. Testear en producción

#### Paso 3: Code Splitting (1 hora)
1. Verificar lazy loading en AppLayout
2. Agregar prefetching inteligente
3. Testear carga inicial
4. Medir mejora

#### Paso 4: Validación (30 min)
1. Build + deploy a staging
2. Ejecutar Lighthouse
3. Comparar métricas vs baseline
4. Documentar mejoras

---

## 📈 MÉTRICAS DE ÉXITO

### KPIs
- **Bundle size inicial**: < 200 KB (actual: ~500 KB)
- **CSS total**: < 30 KB (actual: 130 KB)
- **Lighthouse Performance**: > 85 (actual: ~70)
- **First Contentful Paint**: < 1.5s (actual: ~2s)
- **Largest Contentful Paint**: < 2.5s (actual: ~3.5s)

### Monitoreo Continuo
- Alertas cuando Lighthouse < 80
- Monitoreo de Web Vitals en producción
- Alertas de errores de performance

---

## 🎓 RECURSOS

### Documentación
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Tailwind CSS Optimization](https://tailwindcss.com/docs/optimizing-for-production)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)

### Herramientas
- [Bundle Analyzer](https://www.npmjs.com/package/rollup-plugin-visualizer)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Workbox](https://developers.google.com/web/tools/workbox)

---

## 📝 NOTAS

**Estado Actual**:
- ✅ Lazy loading implementado en AppLayout
- ✅ Tailwind con purging configurado
- ✅ Build cache funcionando en Vercel
- ⚠️ CSS muy grande (130 KB)
- ⚠️ Bundle inicial grande (~500 KB)

**Riesgos**:
- Optimización de IFC/three.js puede ser compleja
- CSS purging puede romper estilos si no se testea bien
- Lazy loading puede afectar UX si no se prefetch correctamente

**Recomendación**:
Empezar con CSS (impacto inmediato) y code splitting (bajo riesgo). Dejar optimización de librerías pesadas para después de validar primeras mejoras.
