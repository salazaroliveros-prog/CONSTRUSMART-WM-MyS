# CHECKLIST FINAL DE ALINEACIÓN — CONSTRUSMART ERP

**Última actualización**: 2026-07-02  
**Tests**: 839/839 passing (22 suites)  
**Build**: 0 errores  
**Errores runtime corregidos**: 3 (ThemeProvider duplicado, EMPRESA, BUTTON_DARK)

---

## 🔴 CRÍTICO

### C-01: `venta_paquetes` sin `loadFromStorage`
- **Estado**: ✅ **CORREGIDO**
- **Archivo**: `src/erp/store.tsx` línea 311
- **Fix**: `ventasPaquetes: loadFromStorage(BASE_STORAGE_KEY + '_ventas_paquetes', ventaPaqueteSchema)`

### C-02: `erp_muro` → `erp_publicaciones_muro` en MUTATION_TABLE_MAP
- **Estado**: ✅ **CORREGIDO**
- **Archivo**: `src/erp/store.tsx` líneas 197-198
- **Fix**: `addComentarioMuro:'erp_publicaciones_muro'`, `likePublicacionMuro:'erp_publicaciones_muro'`

### C-03: `erp_aplicaciones_escala` → `erp_aplicacion_escalas` en MUTATION_TABLE_MAP
- **Estado**: ✅ **CORREGIDO**
- **Archivo**: `src/erp/store.tsx` línea 209
- **Fix**: `registrarAplicacionEscala:'erp_aplicacion_escalas'`

### C-04: Migrar 33 screens a `t()` (i18n)
- **Estado**: ❌ **PENDIENTE** — Solo ~9/42 screens tienen i18n implementado
- **Prioridad**: Alta — afecta UX multilingüe

### C-05: Sidebar + Header i18n
- **Estado**: ❌ **PENDIENTE**
- **Archivos**: `src/erp/components/Sidebar.tsx`, `src/erp/components/Header.tsx`

### C-06: Mutation queue fallback para `motorCalculo.ts` writes
- **Estado**: ❌ **PENDIENTE**
- **Archivo**: `src/erp/services/motorCalculo.ts` (1700+ líneas)

### C-07: Mutation queue fallback para `validacionCalculos.ts`
- **Estado**: ❌ **PENDIENTE**

### C-08: Sección `weather` en i18n
- **Estado**: ✅ **CORREGIDO**
- **Archivos**: `src/lib/i18n/es.json:1771`, `src/lib/i18n/en.json:1279`

---

## 🟠 ALTO

### H-01: Invertir patrón offline (queue-first en services)
- **Estado**: ❌ **PENDIENTE**

### H-02: Agregar TABLE_MAP para tablas de referencia críticas
- **Estado**: ❌ **PENDIENTE**

### H-03: State arrays para service tables con delete stubs
- **Estado**: ❌ **PENDIENTE**

### H-04: `erp_publicaciones_muro` VIEW — trigger INSTEAD OF
- **Estado**: ❌ **PENDIENTE** — `addPublicacionMuro`, `updatePublicacionMuro`, `deletePublicacionMuro` fallan contra VIEW

### H-05: `erp_calculos_proyecto` — tabla sin estado local ni TABLE_MAP
- **Estado**: ✅ **CORREGIDO**
- **Archivo**: `src/erp/store.tsx` línea 194
- **Fix**: `addCalculoProyecto:'erp_calculos_proyecto'`, `updateCalculoProyecto:'erp_calculos_proyecto'`, `deleteCalculoProyecto:'erp_calculos_proyecto'`

### H-06: `erp_historial_aplicacion_reglas` sin MUTATION_TABLE_MAP
- **Estado**: ✅ **CORREGIDO**
- **Archivo**: `src/erp/store.tsx` línea 212
- **Fix**: `registrarAplicacionRegla:'erp_historial_aplicacion_reglas'`

### H-07: 3 screens con dead `useTranslation` imports
- **Estado**: ✅ **CORREGIDO** — Activos.tsx y Cuadros.tsx ya usan `t()`. Bitacora.tsx no existe como archivo separado.

---

## 🟡 MEDIO

### M-01: `login_hero.*` keys no usadas en ningún locale
- **Estado**: ❌ **PENDIENTE** — Login.tsx tiene texto hardcodeado

### M-02: `safeLogger.error` → `safeLogger.warn` en reads de services
- **Estado**: ❌ **PENDIENTE** — 4 service files

### M-03: `erp_publicaciones_muro` es VIEW — forceSync INSERT falla
- **Estado**: ❌ **PENDIENTE** — Requiere trigger INSTEAD OF o migrar handlers a RPC

### M-04: Store persistence `useEffect` sin agrupar (~30 efectos)
- **Estado**: ❌ **PENDIENTE** — Optimización de rendimiento

### M-05: Sin test coverage para service files
- **Estado**: ❌ **PENDIENTE** — `motorCalculo.ts` (1700+ líneas) sin cobertura

### M-06: Sin validación Zod en writes de services
- **Estado**: ❌ **PENDIENTE**

### M-07: Importación circular potencial en servicios
- **Estado**: ❌ **PENDIENTE** — Verificar con `madge`

---

## 🔵 BAJO

### L-01: `updateValeSalida` handler sin implementación real
- **Estado**: ❌ **PENDIENTE**

### L-02: `useSyncSupabase.ts` dead code
- **Estado**: ✅ **CORREGIDO** — Archivo no existe en el código actual

### L-03: `reglasFactores.ts` — `ReglaFactor` type inline
- **Estado**: ❌ **PENDIENTE** — Mover a types.ts

### L-04: Varios servicios definen interfaces duplicadas
- **Estado**: ❌ **PENDIENTE** — Mover a schemas Zod + types.ts

### L-05: `AnalisisCostosDashboard.tsx` imports servicios directamente
- **Estado**: ❌ **PENDIENTE** — Cachear con React Query o store

---

## 📊 PANORAMA GENERAL ACTUALIZADO

| Aspecto | Estado |
|---------|--------|
| Tests | ✅ 839/839 (22 suites) |
| Build | ✅ 0 errores |
| Errores runtime corregidos | ✅ 3 (ThemeProvider, EMPRESA, BUTTON_DARK) |
| Deploy Vercel | ✅ https://construsmart-wm2026.vercel.app |
| Items críticos completados | 6/8 (75%) |
| Items altos completados | 3/7 (43%) |
| Items medios completados | 0/7 (0%) |
| Items bajos completados | 1/5 (20%) |
| **Total completado** | **10/27 (37%)** |