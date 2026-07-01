# Plan de Refactorización del Sidebar — CONSTRUSMART ERP

## Objetivo
Reducir de **40 módulos a 30 módulos** eliminando redundancias funcionales confirmadas, unificando funcionalidades duplicadas y mejorando la experiencia de navegación.

---

## Fase 1: Eliminación de módulos redundantes (5)

### 1.1 Eliminar `src/erp/screens/Bitacora.tsx`
- **Razón**: Funcionalidad 100% duplicada con pestaña de bitácora en `Seguimiento.tsx` (líneas 284-353)
- **Acción**: 
  - Eliminar archivo `src/erp/screens/Bitacora.tsx`
  - Eliminar entrada `{ id: 'bitacora', ... }` del array `ITEMS` en `Sidebar.tsx`
  - Eliminar tipo `'bitacora'` del tipo `View` en `store.tsx` si existe
  - Eliminar ruta lazy de `Bitacora` en `AppLayout.tsx`

### 1.2 Eliminar `src/erp/screens/ReportesTecnicos.tsx`
- **Razón**: Exportación duplicada con `ExportacionInteligente.tsx` (mismas funciones PDF/CSV/XLSX)
- **Acción**:
  - Eliminar archivo `src/erp/screens/ReportesTecnicos.tsx`
  - Eliminar entrada `{ id: 'reportes-tecnicos', ... }` del array `ITEMS` en `Sidebar.tsx` si existe
  - Eliminar ruta lazy en `AppLayout.tsx`

### 1.3 Eliminar `src/erp/screens/AnalisisCostosDashboard.tsx`
- **Razón**: 100% overlap de datos con `Dashboard.tsx` (proyectos, movimientos, presupuestos, avances)
- **Acción**:
  - Eliminar archivo `src/erp/screens/AnalisisCostosDashboard.tsx`
  - Eliminar entrada `{ id: 'analisis-costos', ... }` del array `ITEMS`
  - Eliminar ruta lazy en `AppLayout.tsx`

### 1.4 Eliminar `src/erp/screens/CurvasS.tsx`
- **Razón**: 100% duplicado con pestaña `'curvas'` en `Seguimiento.tsx`
- **Acción**:
  - Eliminar archivo `src/erp/screens/CurvasS.tsx`
  - Eliminar entrada `{ id: 'curvas', ... }` del array `ITEMS`
  - Eliminar ruta lazy en `AppLayout.tsx`

### 1.5 Eliminar `src/erp/screens/Auditoria.tsx`
- **Razón**: Redundante con `Administracion.tsx` que ya muestra `auditLog`
- **Acción**:
  - Eliminar archivo `src/erp/screens/Auditoria.tsx`
  - Eliminar entrada `{ id: 'auditoria', ... }` del array `ITEMS`
  - Eliminar ruta lazy en `AppLayout.tsx`

---

## Fase 2: Unificación de funcionalidades (3)

### 2.1 Unificar ReportesTecnicos → ExportacionInteligente
- **Origen**: `ReportesTecnicos.tsx` (a eliminar)
- **Destino**: `ExportacionInteligente.tsx`
- **Funcionalidades a migrar**:
  - [ ] Reporte PDF ejecutivo con membrete CONSTRUCTORA WM
  - [ ] Cubicación de elementos BIM
  - [ ] Reporte de rendimientos
  - [ ] Reporte APU
- **Acción**:
  - Agregar tabs en `ExportacionInteligente.tsx`:
    - Tab "Cubicación" (desde ReportesTecnicos)
    - Tab "Rendimientos" (desde ReportesTecnicos)
    - Tab "Ejecutivo" (reporte PDF con membrete)
    - Tab "APU" (reporte de análisis de precios unitarios)
  - Mantener tabs existentes: JSON, CSV, XLSX, PDF, Programados

### 2.2 Unificar CurvasS + Bitacora → Seguimiento
- **Origen**: `CurvasS.tsx` y `Bitacora.tsx` (a eliminar)
- **Destino**: `Seguimiento.tsx`
- **Estado actual**: Seguimiento.tsx ya tiene pestañas:
  - `'seguimiento'`: EVM
  - `'curvas'`: Curvas S
  - `'gantt'`: Gantt
  - `'bitacora'`: Bitácora (líneas 284-353)
  - `'avances'`: CRUD avances
- **Acción**:
  - Verificar que pestaña `'bitacora'` en Seguimiento.tsx tenga CRUD completo
  - Si falta funcionalidad de Bitacora.tsx, migrarla a la pestaña
  - Verificar que pestaña `'curvas'` tenga toda la funcionalidad de CurvasS.tsx
  - Si falta, completarla

### 2.3 Unificar AnalisisCostos → Dashboard
- **Origen**: `AnalisisCostosDashboard.tsx` (a eliminar)
- **Destino**: `Dashboard.tsx`
- **Funcionalidades a migrar**:
  - [ ] Sección colapsable "Análisis de Costos"
  - [ ] KPI: Costo planificado vs real
  - [ ] KPI: Desviación presupuestaria
  - [ ] Gráfica: Barras comparativas de costos
  - [ ] Gráfica: Donut de distribución de costos
  - [ ] Gráfica: Línea de tendencia de costos
- **Acción**:
  - Agregar sección colapsable en Dashboard.tsx
  - Por defecto colapsada para no saturar
  - Toggle para expandir/colapsar

---

## Fase 3: Reorganización del Sidebar (2)

### 3.1 Mover módulos entre grupos
- **Mover**: `{ id: 'proveedor-analytics', ... }` de grupo "Suministro" a ¿grupo correcto?
  - Opción A: Mantener en Suministro (proveedores son parte de cadena de suministro)
  - Opción B: Mover a Finanzas (analytics de proveedores = análisis de costos)
  - **Recomendación**: Mantener en Suministro pero renombrar a "Analytics Proveedores"

### 3.2 Renombrar DashboardPredictivo
- **Actual**: `{ id: 'predictivo', labelKey: 'predictivo', ... }`
- **Nuevo**: `{ id: 'bi-predictivo', labelKey: 'bi-predictivo', ... }`
- **Actualizar**: 
  - `labelKey` en objeto ITEMS
  - Traducción en archivos i18n (es.json, en.json)

---

## Fase 4: Actualizaciones en store.tsx

### 4.1 Actualizar tipo `View`
- **Eliminar** del tipo `View`:
  - `'bitacora'`
  - `'reportes-tecnicos'` (si existe como tipo separado)
  - `'analisis-costos'`
  - `'curvas'`
  - `'auditoria'`
- **Agregar** al tipo `View` (si no existen):
  - `'bi-predictivo'` (reemplaza `'predictivo'`)
- **Actualizar** array `ALL_VIEWS` en store.tsx

### 4.2 Actualizar allowedViews por rol
- Revisar roles en `getViewsByRole()` para eliminar vistas eliminadas

---

## Fase 5: Actualizaciones en AppLayout.tsx

### 5.1 Eliminar rutas lazy
- Eliminar import lazy de:
  - `Bitacora`
  - `ReportesTecnicos`
  - `AnalisisCostosDashboard`
  - `CurvasS`
  - `Auditoria`

### 5.2 Actualizar ruta de DashboardPredictivo
- Cambiar ruta de `/predictivo` a `/bi-predictivo` (o mantener `/predictivo` y solo cambiar label)

---

## Fase 6: Actualizaciones en Supabase

### 6.1 Verificar tablas afectadas
- **NO ELIMINAR TABLAS** — Solo eliminar pantallas, no datos
- Tablas que permanecen (solo se cambia la forma de acceder):
  - `erp_bitacora` → Ahora se accede desde Seguimiento
  - `erp_presupuestos` → Se accede desde ExportacionInteligente para exportar
  - `erp_avances` → Se accede desde Seguimiento
  - `erp_curvas_s` → Si existe tabla separada, verificar si se usa o se calcula en tiempo real
  - `erp_audit_log` → Se accede desde Administracion

### 6.2 Actualizar vistas/roles si aplica
- Si hay vistas de Supabase (views) que expongan estas tablas, verificar que sigan funcionando
- No hay cambios en esquemas, solo en UI

---

## Fase 7: Testing y validación

### 7.1 Tests unitarios
- [ ] Ejecutar `npm run test` después de cada eliminación
- [ ] Verificar que no haya referencias rotas a módulos eliminados

### 7.2 Typecheck
- [ ] Ejecutar `npm run typecheck` después de cada fase
- [ ] Verificar que no haya errores de tipos en `View`, `ALL_VIEWS`, `ITEMS`

### 7.3 Lint
- [ ] Ejecutar `npm run lint` al final
- [ ] Verificar 0 errores, 0 warnings

### 7.4 Build
- [ ] Ejecutar `npm run build:dev` al final
- [ ] Verificar que compile sin errores

### 7.5 Navegación
- [ ] Verificar que todos los links del sidebar funcionen
- [ ] Verificar que no haya enlaces rotos
- [ ] Verificar responsive en móvil (bottom navigation)

---

## Cronograma estimado

| Fase | Duración | Prioridad |
|------|----------|-----------|
| Fase 1: Eliminación | 30 min | Alta |
| Fase 2: Unificación | 2 horas | Alta |
| Fase 3: Reorganización | 30 min | Media |
| Fase 4-5: Store/AppLayout | 1 hora | Alta |
| Fase 6: Supabase | 15 min | Baja (solo verificación) |
| Fase 7: Testing | 1 hora | Alta |
| **Total** | **~5.5 horas** | |

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Usuarios buscan módulos eliminados | Actualizar tooltips/docs con nueva ubicación |
| Funcionalidad perdida en unificación | Revisar exhaustivamente cada pestaña/modal antes de eliminar |
| Referencias rotas en código | Buscar con `grep` antes de eliminar cada archivo |
| Roles/permisos rotos | Verificar `getViewsByRole()` después de cambios |

---

## Archivos a modificar

1. `src/erp/components/Sidebar.tsx` — Eliminar entradas, reorganizar grupos
2. `src/erp/store.tsx` — Actualizar tipo `View`, `ALL_VIEWS`, `getViewsByRole()`
3. `src/erp/AppLayout.tsx` — Eliminar rutas lazy, actualizar rutas
4. `src/erp/screens/Seguimiento.tsx` — Expandir funcionalidad de bitácora y curvas
5. `src/erp/screens/ExportacionInteligente.tsx` — Agregar tabs de cubicación/rendimientos/ejecutivo
6. `src/erp/screens/Dashboard.tsx` — Agregar sección colapsable de análisis de costos
7. `src/erp/screens/*.tsx` — Eliminar 5 archivos
8. `src/locales/*.json` — Actualizar traducciones

---

## Criterios de éxito

- [ ] 0 errores de lint
- [ ] 0 errores de typecheck
- [ ] Build exitoso
- [ ] 40 módulos → 30 módulos en sidebar
- [ ] 0 funcionalidades perdidas (todas migradas)
- [ ] Navegación responsive funciona en móvil
- [ ] Supabase sin cambios de esquema (solo UI)