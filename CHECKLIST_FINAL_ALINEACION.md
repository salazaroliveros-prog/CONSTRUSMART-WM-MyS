# CHECKLIST FINAL DE ALINEACIÓN — CONSTRUSMART ERP

> Auditoría integral Frontend ↔ Backend (28 Jun 2026)
> 42 pantallas · 14 schemas Zod · 40 tablas Supabase · 7 servicios · 2 locales i18n

---

## RESUMEN DE HALLAZGOS

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| 🔴 CRÍTICO | 8 | Data loss, sync broken, table name mismatches |
| 🟡 ALTO | 10 | Inconsistencias funcionales mayores |
| 🟠 MEDIO | 7 | Mejoras de calidad/deuda técnica |
| 🔵 BAJO | 5 | Cosméticos y limpieza |
| **TOTAL** | **30** | |

---

## 🔴 CRÍTICO

### C-01: `ventas_paquetes` no persiste en localStorage
- **Archivo**: `src/erp/store.tsx` (~línea 296)
- **Problema**: `ventaPaqueteSchema` tiene schema, state array, handlers y MUTATION_TABLE_MAP, pero **no tiene `loadFromStorage()`**. Datos se pierden en recarga.
- **Fix**: Agregar `loadFromStorage(BASE_STORAGE_KEY + '_ventas_paquetes', ventaPaqueteSchema)` en el `useEffect` de persistencia.

### C-02: MUTATION_TABLE_MAP apunta a `erp_muro` (tabla inexistente)
- **Archivo**: `src/erp/store.tsx` líneas 185-187
- **Problema**: `addPublicacionMuro`, `updatePublicacionMuro`, `deletePublicacionMuro`, `addComentarioMuro`, `likePublicacionMuro` → todas apuntan a `'erp_muro'` que fue renombrada a la VIEW `erp_publicaciones_muro`. forceSync escribe a tabla que ya no existe.
- **Fix**: Cambiar todas las entradas a `'erp_publicaciones_muro'`. Nota: INSERT/UPDATE/DELETE contra una VIEW fallarán a menos que tenga trigger INSTEAD OF.

### C-03: Table name mismatch — `erp_aplicaciones_escala` vs `erp_aplicacion_escalas`
- **Archivos**: `src/erp/store.tsx` línea 198 vs `src/erp/services/escalasProduccion.ts` línea 149
- **Problema**: MUTATION_TABLE_MAP mapea `registrarAplicacionEscala` → `erp_aplicaciones_escala`, pero el servicio escribe a `erp_aplicacion_escalas`. forceSync apunta a tabla que no existe.
- **Fix**: Unificar nombre: cambiar MUTATION_TABLE_MAP a `'erp_aplicacion_escalas'` (coincidir con la tabla real).

### C-04: 33/42 screens sin i18n — app Spanish-only
- **Archivos**: 33 screens en `src/erp/screens/`
- **Problema**: Solo Dashboard, Presupuestos, Proyectos, ErrorLog, Auditoria, Ajustes usan `useTranslation()` + `t()`. Las otras 33 pantallas tienen hardcoded Spanish. Los JSON ya tienen las keys definidas para la mayoría.
- **Fix**: Migrar cada screen a `t()` usando keys existentes en `es.json`/`en.json`.

### C-05: Sidebar/Header/AppLayout sin i18n
- **Archivos**: `src/erp/components/Sidebar.tsx`, `src/erp/components/Header.tsx`, `src/erp/components/AppLayout.tsx`
- **Problema**: Navegación principal hardcoded en español. `nav.*` y `nav.items.*` keys existen en JSON pero no se usan.
- **Fix**: Migrar Sidebar y Header a `t('nav.items.${key}')`.

### C-06: `motorCalculo.ts` — 3 writes sin mutation queue fallback
- **Archivo**: `src/erp/services/motorCalculo.ts`
- **Problema**: `registrarCalculo()`, `crearSnapshotEstado()`, `validarCalculo()` escriben directo a Supabase sin ningún fallback de mutation queue. Data loss total si Supabase está offline.
- **Fix**: Agregar `enqueueMutation()` en catch blocks (patrón ya aplicado a los 4 service files en SESIÓN-16).

### C-07: `validacionCalculos.ts` — write sin mutation queue
- **Archivo**: `src/erp/services/validacionCalculos.ts`
- **Problema**: `guardarAlertasCalculo()` escribe vía `supabase.from().update()` directo, sin fallback.
- **Fix**: Agregar `enqueueMutation()` en catch block.

### C-08: WeatherWidget — 23 keys faltantes en ambos JSON
- **Archivos**: `src/lib/i18n/es.json`, `src/lib/i18n/en.json`
- **Problema**: `WeatherWidget.tsx` usa 23 keys del namespace `weather.*` que no existen en ningún locale. Renderiza raw keys en UI.
- **Fix**: Agregar sección `weather` completa a ambos JSON.

---

## 🟡 ALTO

### H-01: Inverted offline pattern en 6 service files
- **Archivos**: `reglasFactores.ts`, `normativaDepartamental.ts`, `escalasProduccion.ts`, `estacionalidad.ts`, `motorCalculo.ts`, `validacionCalculos.ts`
- **Problema**: El patrón ERP estándar es queue-first (enqueue → forceSync). Estos servicios hacen direct Supabase first, queue solo en catch. Adicionalmente, re-lanzan el error después de encolar, por lo que el caller ve excepción.
- **Fix**: Cambiar a patrón queue-first: enqueue siempre, forceSync se encarga de escribir. O al menos no re-lanzar error después de encolar exitosamente.

### H-02: 12+ service tables sin TABLE_MAP
- **Problema**: Las tablas del motor de cálculo (`erp_reglas_factores`, `erp_normativa_departamental`, `erp_escalas_produccion`, `erp_estacionalidad`, `erp_calculos_proyecto`, `erp_dosificaciones_concreto`, `erp_parametros_*`, `erp_subtipologias`, `erp_departamentos_gt`, `erp_municipios_gt`, etc.) no están en TABLE_MAP.
- **Impacto**: No hay persistencia localStorage para estas tablas. Son datos de referencia que podrían cachearse localmente.
- **Fix**: Agregar TABLE_MAP entries + schemas Zod + state arrays para las tablas de referencia críticas.

### H-03: `erp_reglas_factores` handler `deleteReglaFactor` no actualiza estado local
- **Archivo**: `src/erp/zustandStore.ts` línea 1750
- **Problema**: `deleteReglaFactor`, `deleteNormativaDepartamental`, `deleteEscalaProduccion`, `deleteEstacionalidad`, `deleteAjusteEstacionalActividad` solo llaman `enqueueMutation()` sin modificar ningún estado local. Si se invocan desde el store, el usuario no ve cambio visual hasta el próximo refresh.
- **Fix**: Como estas tablas no tienen state arrays, considerar remover estos stubs de ErpActions, o agregar state arrays completos.

### H-04: `Dashboard.tsx` importa `supabase` directo
- **Archivo**: `src/erp/screens/Dashboard.tsx`
- **Problema**: Importa `{ supabase } from '@/lib/supabase'` para llamadas directas, bypassing el store y mutation queue.
- **Fix**: Mover lógica de Supabase a servicios o al store.

### H-05: `AnalisisCostosDashboard.tsx` no usa store para datos
- **Archivo**: `src/erp/screens/AnalisisCostosDashboard.tsx`
- **Problema**: Importa servicios directamente (`listarNormativas`, `listarEscalasProduccion`, `listarEstacionalidad`), bypassing store completamente.
- **Fix**: Mover reads a store o cachear respuestas en estado local con persistencia.

### H-06: `APUAvanzado.tsx` no usa store para datos de cálculo
- **Archivo**: `src/erp/screens/APUAvanzado.tsx`
- **Problema**: Usa `ServicioMotorCalculo` y `ServicioValidacionCalculos` directo sin pasar por store.
- **Fix**: Similar a H-05.

### H-07: Sin Zod schemas para tablas de servicios
- **Problema**: Las tablas `erp_reglas_factores`, `erp_normativa_departamental`, `erp_escalas_produccion`, `erp_estacionalidad`, `erp_calculos_proyecto`, `erp_parametros_*` no tienen schemas Zod canónicos en `src/erp/store/schemas/`.
- **Impacto**: No hay validación runtime para writes a estas tablas.
- **Fix**: Crear schemas Zod para estas tablas.

### H-08: 3 screens con dead `useTranslation` imports
- **Archivos**: `src/erp/screens/Activos.tsx`, `src/erp/screens/Bitacora.tsx`, `src/erp/screens/Cuadros.tsx`
- **Problema**: Importan `useTranslation` pero nunca llaman `t()`. Código muerto.
- **Fix**: Implementar `t()` o remover el import.

### H-09: `erp_calculos_proyecto` — tabla sin estado local ni TABLE_MAP
- **Problema**: Es la tabla más escrita por `motorCalculo.ts` (via `registrarCalculo` y `guardarAlertasCalculo`), pero no tiene representación en el store. Datos de cálculo no disponibles offline.
- **Fix**: Agregar schema, state array, handlers y persistencia.

### H-10: `erp_historial_aplicacion_reglas` sin MUTATION_TABLE_MAP
- **Archivo**: `src/erp/services/reglasFactores.ts` — `registrarAplicacion()` escribe a `erp_historial_aplicacion_reglas`
- **Problema**: No hay entrada en MUTATION_TABLE_MAP para esta tabla, por lo que si el enqueueMutation se invoca, forceSync no sabrá dónde escribir.
- **Fix**: Agregar entrada en MUTATION_TABLE_MAP.

---

## 🟠 MEDIO

### M-01: `login_hero.*` keys no usadas en ningún locale
- **Archivos**: `es.json` y `en.json` sección `login_hero`
- **Problema**: `Login.tsx` no usa estas keys (tiene hardcoded texto). Código muerto en JSON.
- **Fix**: Implementar en Login.tsx o remover del JSON.

### M-02: 4 service files con `safeLogger.error` en vez de `safeLogger.warn` en reads
- **Archivos**: `normativaDepartamental.ts`, `escalasProduccion.ts`, `estacionalidad.ts` (reads), `reglasFactores.ts` (reads)
- **Problema**: Los reads fallidos se loguean como `error` cuando deberían ser `warn` (son esperables offline).
- **Fix**: Cambiar `safeLogger.error(...)` en catch blocks de reads a `safeLogger.warn(...)`.

### M-03: `erp_publicaciones_muro` es VIEW — forceSync INSERT falla
- **Problema**: Aunque se corrija C-02 (`erp_muro` → `erp_publicaciones_muro`), INSERT/UPDATE/DELETE contra una VIEW fallan en PostgreSQL. `addComentarioMuro` y `likePublicacionMuro` ya usan RPC que funciona, pero `addPublicacionMuro`, `updatePublicacionMuro`, `deletePublicacionMuro` no.
- **Fix**: Crear trigger INSTEAD OF en la VIEW, o cambiar estos handlers a RPC.

### M-04: Store persistence `useEffect` tiene ~30 entradas sin agrupar
- **Archivo**: `src/erp/store.tsx` líneas 877-907
- **Problema**: Cada entidad tiene su propio `useEffect(() => saveToStorage(...), [...])`. Son ~30 efectos separados que podrían combinarse en uno solo para rendimiento.
- **Fix**: Unificar en un solo efecto con objeto de configuraciones.

### M-05: Sin test coverage para service files
- **Problema**: Los 7 archivos en `src/erp/services/` no tienen tests unitarios. `motorCalculo.ts` (1700+ líneas) es el archivo más grande sin cobertura.
- **Fix**: Agregar tests para writes y reads de servicios.

### M-06: Sin validación Zod en writes de services
- **Problema**: Los writes en services (`crearRegla`, `registrarCalculo`, etc.) pasan datos directamente a Supabase sin validar con Zod primero.
- **Fix**: Agregar parse Zod antes de todo write.

### M-07: Importación circular potencial en servicios
- **Problema**: `motorCalculo.ts` importa `reglasFactores.ts` que a su vez podría ser importado por screens que también importan `motorCalculo.ts`. Riesgo de circulares.
- **Fix**: Verificar con `madge` y romper circulares si existen.

---

## 🔵 BAJO

### L-01: `updateValeSalida` handler existe en interface pero sin implementación real
- **Archivo**: `src/erp/zustandStore.ts`
- **Problema**: Mencionado en AGENTS.md como issue conocido: solo `addValeSalida` y `deleteValeSalida` existen.
- **Fix**: Implementar `updateValeSalida` handler.

### L-02: `useSyncSupabase.ts` dead code
- **Problema**: Archivo existe pero nunca es importado según AGENTS.md.
- **Fix**: Eliminar archivo.

### L-03: `reglasFactores.ts` — `ReglaFactor` type definido inline en vez de importar de types
- **Archivo**: `src/erp/services/reglasFactores.ts`
- **Problema**: Las interfaces `ReglaFactor`, `FactorAplicado`, `HistorialAplicacion` se definen dentro del archivo service en vez de en `types.ts`.
- **Fix**: Mover a `types.ts` e importar.

### L-04: Varios servicios definen interfaces duplicadas
- **Problema**: `AplicacionEscala` (escalasProduccion.ts), `CumplimientoNormativo` (normativaDepartamental.ts), `AjusteEstacionalActividad` (estacionalidad.ts) — todas definidas inline en services.
- **Fix**: Mover a schemas Zod + types.ts.

### L-05: `AnalisisCostosDashboard.tsx` imports servicios directamente
- **Problema**: `listarNormativas`, `listarEscalasProduccion`, `listarEstacionalidad` son funciones importadas de servicios que hacen SELECT directo cada vez que se monta el componente.
- **Fix**: Cachear con React Query o store.

---

## 📊 PANORAMA GENERAL

### Cobertura de Pantallas (42/42)
| Aspecto | Cobertura |
|---------|-----------|
| Skeleton loading | ✅ 42/42 (100%) |
| Empty states | ✅ 38/42 (90%) |
| Exportable (PDF/CSV) | ✅ 12 screens |
| i18n implementado | ❌ 9/42 (21%) |
| Zod validation en forms | ✅ ~30/42 (~71%) |
| ErrorBoundary | ✅ 42/42 (100%) |

### Cobertura de Datos (40 tablas)
| Aspecto | Cobertura |
|---------|-----------|
| Zod Schema canónico | ✅ 28/40 (70%) |
| State array en zustand | ✅ 28/40 (70%) |
| TABLE_MAP entry | ✅ 29/40 (72%) |
| MUTATION_TABLE_MAP entry | ✅ 29/40 (72%) |
| loadFromStorage | ✅ 27/40 (67%) |
| CRUD handlers completos | ✅ 25/40 (62%) |

### Cobertura de Servicios (7 archivos)
| Aspecto | Cobertura |
|---------|-----------|
| Mutation queue fallback | ✅ 4/7 (57%) — parcial (solo catch) |
| Zod validation en writes | ❌ 0/7 (0%) |
| Tests unitarios | ❌ 0/7 (0%) |
| TABLE_MAP para tablas | ❌ 0/7 (0%) |

---

## PRIORIDAD DE ACCIÓN

### Fase 1 — Corrección Inmediata (CRÍTICO)
1. C-02: `erp_muro` → `erp_publicaciones_muro` en MUTATION_TABLE_MAP
2. C-03: `erp_aplicaciones_escala` → `erp_aplicacion_escalas` en MUTATION_TABLE_MAP
3. C-01: Agregar `loadFromStorage` para `venta_paquetes`
4. C-08: Agregar sección `weather` a ambos JSON (23 keys)
5. C-06: Mutation queue fallback para `motorCalculo.ts` writes
6. C-07: Mutation queue fallback para `validacionCalculos.ts`

### Fase 2 — Funcional (ALTO)
7. H-01: Invertir patrón offline (queue-first en services)
8. H-09: Agregar schema + state para `erp_calculos_proyecto`
9. H-03: Agregar state arrays para service tables con delete stubs
10. H-02: Agregar TABLE_MAP para tablas de referencia críticas

### Fase 3 — i18n (ALTO)
11. C-04: Migrar 33 screens a `t()` (priorizar 10 más visitadas)
12. C-05: Sidebar + Header i18n
13. H-08: Fix dead imports (Activos, Bitacora, Cuadros)

### Fase 4 — Calidad (MEDIO)
14. M-01: Implementar o remover `login_hero.*`
15. M-02: `safeLogger.error` → `safeLogger.warn` en reads de services
16. M-05: Tests para service files
17. M-06: Zod validation en writes de services

### Fase 5 — Limpieza (BAJO)
18. L-01: Implementar `updateValeSalida`
19. L-02: Eliminar `useSyncSupabase.ts`
20. L-03/04: Mover interfaces inline a types.ts
