# ANÁLISIS INTEGRAL DE INCONSISTENCIAS — CONSTRUSMART ERP

**Fecha**: 2026-07-20  
**Alcance**: Store, Zod schemas, DB ↔ TS alignment, Frontend, Tests, i18n  
**Metodología**: 3/5 análisis por subagentes + 2 análisis manuales

---

## RESUMEN EJECUTIVO

| Categoría | Hallazgos | Críticos (🔴) | Medios (🟡) | Bajos (🟢) |
|-----------|-----------|---------------|-------------|------------|
| Store / Zustand | 8 | 3 | 3 | 2 |
| DB ↔ Zod Alignment | 10 | 6 | 2 | 2 |
| Frontend / Screens | 5 | 1 | 2 | 2 |
| Tests / Calidad | 6 | 0 | 3 | 3 |
| i18n / Traducciones | 4 | 1 | 2 | 1 |
| **TOTAL** | **33** | **11** | **12** | **10** |

---

## 1. STORE / ZUSTAND (8 hallazgos — 🔴3 🟡3 🟢2)

### 🔴 1.1 — ProyectoSchema vs interface Proyecto: campos huérfanos
- **Schema tiene**: `subtipo?: string`, `fechaInicioReal`, `factorSobrecosto?: number`
- **Interface Proyecto NO tiene**: `subtipo`, `factorSobrecosto`
- **Impacto**: Datos se pierden en roundtrip store→UI→store; validación Zod acepta campos que TS no conoce
- **Fijo**: Agregar `subtipo?: string` y `factorSobrecosto?: number` a `Proyecto` en `types.ts`

### 🔴 1.2 — CotizacionCliente type incompleta vs cotizacionSchema
- **Schema campos**: `id`, `proyectoId`, `items: CotizacionItem[]`, `subtotal`, `impuesto`, `total`
- **Interface CotizacionCliente** (types.ts:366-378): incompleta
- **Impacto**: TypeScript no fuerza Tipos que Zod sí valida
- **Fijo**: Expandir interface para alineación 1:1

### 🔴 1.3 — Discrepancias en tipos Decimal
- **Schemas Zod**: Usan branded types `DecimalValue`, `DecimalValueArray`
- **Store zustand**: Usa `DecimalValue` pero hay funciones que retornan `number` puro en lugar de branded type
- **Impacto**: Pérdida de type-safety; funciones de cálculo financiero no benefician de branded types
- **Fijo**: Estandarizar todas las funciones de cálculo financiero a retornar branded types

### 🟢 1.4 — LoadFromStorage usa proyectos con schema inseguro
- `loadFromStorage('proyectos', proyectosSchema)` valida pero `proyectoSchemaInline` (versión simplificada) se usa en otros módulos
- **Estado**: Verificado — no hay referencias a `proyectoSchemaInline` en el código
- **Impacto**: Resuelto

### 🟡 1.5 — TABLE_MAP duplica entidades innecesarias
- `TABLE_MAP` en `constants/table-mappings.ts` mapea tablas sin entidad de estado correspondiente
- Tablas DB: `cajas_chicas`, `anticipos`, `amortizaciones`, `erp_rendimientos_cuadrilla` sin schema ni estado
- **Impacto**: Mutations queue intenta sincronizar tablas sin estado local
- **Fijo**: Remover de TABLE_MAP o agregar schemas + estado

### 🟡 1.6 — ForceSync catch genérico oculta errores
- Bloque `catch {}` en líneas de forceSync silencia errores no relacionados a PGRST116
- **Impacto**: Errores de red o auth quedan sin log
- **Fijo**: Loggear todos los errores; solo hacer continue para PGRST116 y FK 23503

### 🟢 1.7 — Version column inconsistente
- Algunas tablas tienen `version: number` en estado Zustand pero no todas
- **Impacto**: Bajo — optimistic locking parcial
- **Recomendación**: Marcar como mejorable en próxima iteración

### 🟢 1.8 — Mutation queue sin límite en retry
- Retry exponencial con max 10 intentos; no hay límite temporal
- **Impacto**: Bajo — en edge cases puede saturar
- **Recomendación**: Agregar deadline absoluto (ej: 5 minutos)

---

## 2. DB ↔ ZOD ALIGNMENT (10 hallazgos — 🔴6 🟡2 🟢2)

### 🔴 2.1 — Tablas DB completas sin schema Zod
| Tabla DB | Creada en | Uso |
|----------|-----------|-----|
| `cajas_chicas` | mig 002 | Gestión caja chica obra |
| `anticipos` | mig 002 | Anticipos proveedores |
| `amortizaciones` | mig 002 | Amortizaciones anticipos |
| `erp_rendimientos_cuadrilla` | mig 004 | Rendimientos APU |
| `erp_bodega` | mig 117 | Inventario bodega |
| `erp_documentos` | mig 117 | Documentos proyecto |
| `erp_permisos` | mig 117 | Permisos x usuario/proyecto |
| `erp_checklist` | mig 117 | Checklists calidad |
| `erp_configuracion` | mig 117 | Config proyecto |
| `erp_api_keys` | mig 125 | API keys integración |

- **Impacto**: Datos de estas tablas NO persisten en localStorage ni tienen validación Zod
- **Fijo**: Crear schemas Zod para cada tabla

### 🔴 2.2 — Enums DB que no coinciden con Zod
- `proyectos.estado`: DB permite `['planeado','ejecucion','pausado','finalizado','cancelado']`; Zod permite SUBConjunto
- `proyectos.tipologia`: DB tiene valores que Zod no contempla
- **Impacto**: Validación Zod rechaza valores legítimos desde DB; Riesgo de corrupción de datos
- **Fijo**: Sincronizar enums 1:1

### 🔴 2.3 — Columnas nullable vs optional inconsistentes
- Columna `proyectos.lat` en DB es `numeric NULLABLE`; Zod la marca `.nullable()` correctamente
- Columna `proyectos.factorSobrecosto` en DB es `numeric NULLABLE`; Zod NO la define (desaparecida)
- **Impacto**: factorSobrecosto nunca se valida ni persiste correctamente
- **Fijo**: Agregar campo a schema y a interface TS

### 🔴 2.4 — FK relationships no reflejadas en TS interfaces
- DB tiene `erp_destajos.proyecto_id → proyectos.id`
- Interface `Destajo` en types.ts NO tiene `proyectoId` tipado explícitamente
- **Impacto**: No se puede hacer join en TypeScript con type-safety
- **Fijo**: Agregar `proyectoId: string` a interface Destajo (y similares)

### 🔴 2.5 — Default values diferentes DB vs Zod
- `proyectos.estado`: DB default es `'planeado'`; Zustand store inicializa en `undefined` si no hay datos
- `erp_ordenes_cambio.estado`: DB default `'borrador'` (asumido); Zod no especifica default
- **Impacto**: Estado inicial inconsistente entre localStorage limpio y DB
- **Fijo**: Establecer defaults en Zod que coincidan con DB

### 🔴 2.6 — Campos de auditoría faltantes
- Tablas DB tienen `created_at`, `updated_at`, `created_by`, `updated_by`
- Schemas Zod solo incluyen algunos; interfaces TS omiten `created_by`/`updated_by`
- **Impacto**: Auditoría parcial
- **Fijo**: Agregar campos de auditoría a todos los schemas e interfaces

### 🟡 2.7 — Triggers DB no reflejados en código
- Triggers en DB actualizan `updated_at` automáticamente
- Frontend sobreescribe `updatedAt` manualmente; conflicto potencial
- **Impacto**: Bajo-medio — timestamps correctos pero código redundante
- **Recomendación**: Documentar triggers; simplificar frontend para no enviar updatedAt en INSERT

### 🟡 2.8 — Tabla `erp_cotizaciones` no existe pero screen Cotizaciones la usa
- Screen Cotizaciones consulta tabla `erp_cotizaciones` (confirmado en DB)
- Schema `cotizacionSchema` mapea a `erp_cotizaciones` ✅
- Sin embargo, no hay entidad `cotizaciones` en Zustand state
- **Impacto**: Medio — usa query directa no estado local
- **Recomendación**: Evaluar agregar a estado Zustand para lazy-load + cache

### 🟢 2.9 — Índices DB no documentados
- Varios índices compuestos existen en DB pero no hay referencia en código ni docs
- **Impacto**: Muy bajo — rendimiento DB, no funcional
- **Recomendación**: Documentar en comentarios de migración

### 🟢 2.10 — Missing column: `proyectos.factorSobrecosto` referenced in store
- Store intenta acceder a `proyecto.factorSobrecosto` en cálculos
- Campo no existe en interface Proyecto ni confirmado en DB
- **Impacto**: Runtime errors posibles en cálculos de rentabilidad
- **Fijo**: Confirmar DB; agregar a interface si existe; caso contrario eliminar referencias

---

## 3. FRONTEND / SCREENS (5 hallazgos — 🔴0 🟡1 🟢2)

### 🟡 3.1 — Login.tsx: verificación hasSupabase innecesaria
- **Línea 4**: Importa `hasSupabase`
- **Problema**: Login es público; la verificación debería ser en App.tsx oProtectedRoute
- **Impacto**: Bajo — duplicación de lógica
- **Recomendación**: Mover validación a routing layer

### 🟡 3.2 — Login.tsx: verificación hasSupabase innecesaria
- **Línea 4**: Importa `hasSupabase`
- **Problema**: Login es público; la verificación debería ser en App.tsx oProtectedRoute
- **Impacto**: Bajo — duplicación de lógica
- **Recomendación**: Mover validación a routing layer

### 🟢 3.3 — SCREEN_KEYS vs archivos reales: desync
- `SCREEN_KEYS` listado en AGENTS.md incluye: `cotizaciones`, `auditoria`, `errorLog`
- Archivos existen y están lazy-importados ✅
- Sin embargo, renombrados históricos no documentados (ej: `plantillas-destajos` vs `planilla-destajos`)
- **Impacto**: Bajo — solo confusión dev

### 🟢 3.4 — Login.tsx: solo 8 tests
- Módulo de autenticación crítico con solo 8 tests
- No hay tests para 2FA, SSO, recuperación contraseña
- **Impacto**: Bajo-medio — coverage insuficiente para flujo crítico
- **Recomendación**: Agregar tests para flujos adicionales

### 🟡 3.2 — Weather.tsx: hay imports residuales de Supabase
- **Líneas**: importa `getCompleteWeatherData`, `calculateWeatherImpact`, `calculateConstructionMetrics`, `calculateSchedulingWindows`, `getHistoricalWeatherImpact`
- **Problema**: Si alguna de esas funciones hace llamadas directas a Supabase, viola offline-first
- **Impacto**: Medio — depende si weatherService usa supabase client
- **Fijo**: Revisar `src/erp/services/weatherService.ts`; cualquier persistencia debe usar store + forceSync

Resuelto: `Weather.tsx` ya no llama a `saveWeatherToSupabase` ni `loadWeatherFromSupabase`. Persistencia debe ser manejada por store.

---

## 4. TESTS / CALIDAD (6 hallazgos — 🔴0 🟡3 🟢3)

### 🟢 3.3.1 — Weather.tsx/weatherService: acceso a Supabase
- **Fijo**: `Weather.tsx` ya no usa `saveWeatherToSupabase` ni `loadWeatherFromSupabase`.
- **Verificación**: No se detectaron import/uso de `supabase` en `src/erp/services/weatherService.ts`.
- **Impacto**: Resuelto.

### 🟢 4.1 — 4 archivos con describe.skip completos
| Archivo | Tests Skipped |
|---------|---------------|
| `profitability-analytics.test.tsx` | 18 tests |
| `proveedor-analytics.test.tsx` | 26 tests |
| `useAccessLog.test.tsx` | 1 test |
| `weather.test.tsx` | 0 tests (describe.skip vacío) |

- **Estado**: Verificado — no hay `describe.skip`/`it.skip`/`test.skip` en suite actual
- **Impacto**: No aplica; item eliminado de activos pendientes

### 🟢 4.2 — 45 tests individuales skipped
- Dentro de los archivos anteriores, 45 tests individuales marcados como skip además del describe.skip
- **Estado**: Verificado — no encontrados
- **Impacto**: No aplica

### 🟡 4.3 — Warnings act() no envuelto
- `useAuth.test.tsx`: Warning en 2 tests (initial loading state, onAuthStateChange)
- `ResourceConflicts.tsx`: 3 warnings (refresh button)
- `Animations.tsx`: 1 warning (PageTransition)
- `Impuestos.tsx`: 1 warning (validateDOMNesting)
- **Impacto**: Bajo — tests pasan pero con warning
- **Fijo**: Envolver actualizaciones de estado en `act()` dentro de tests

### 🟢 4.4 — Tests de flujo e2e incompletos
- `e2e-proyecto.test.ts`: 2 tests que cubren flujo completo
- No hay e2e para: autenticación completa, migración offline→online, conflictos realtime
- **Impacto**: Bajo — unit tests + integración tests cubren mayormente
- **Recomendación**: Agregar 3-5 e2e críticos (login, sync, conflictos)

### 🟢 4.5 — Archivo `weather.test.tsx` vacío
- Describe.skip declarado pero 0 tests dentro
- **Impacto**: Muy bajo — placeholder sin implementación
- **Fijo**: Eliminar archivo o completar tests para módulo Weather

### 🟢 4.6 — Tests con mocks frágiles
- `muro-obra.test.tsx`: 1 test con mock excesivamente simplificado
- `presupuestos.test.tsx`: 1 test genérico
- **Impacto**: Bajo — tests pueden fallar por cambios en mocks, no en lógica
- **Recomendación**: Strengthen mocks o usar renderizado real de componentes

---

## 5. i18n / TRADUCCIONES (4 hallazgos — 🔴1 🟡2 🟢1)

### 🔴 5.1 — Variables de interpolación asimétricas
- **Solo en ES**: `{{archivo}}`, `{{nombres}}`
- **Solo en EN**: `{{delayed}}`, `{{onTime}}`, `{{overdue}}`
- **Impacto**: Funcionalidad rota — traducciones parciales causan fallos en renders
- **Fijo**:
  - ES: Agregar `{{delayed}}`, `{{onTime}}`, `{{overdue}}` si se usan
  - EN: Agregar `{{archivo}}`, `{{nombres}}` si se usan
  - O eliminar variables no usadas de ambos archivos

### 🟡 5.2 — Keys asimétricas entre ES y EN (~950 cada uno)
- AGENTS.md reporta 363 keys añadidas a EN para completar
- Verificación inicial previa reportó ~950 keys en ambos, con namespaces completos
- Sin embargo, análisis con script mostró:
  - No single-brace placeholders: ✅ correcto (usan `{{double}}`)
  - Interpolation asimétrica: ⚠️ detectada (hallazgo 5.1)
- **Impacto**: Medio — funcionalidad parcial
- **Fijo**: Ejecutar `npm run check:i18n` (script existente) para auditoría precisa

### 🟡 5.3 — Formato de interpolación duplicado
- Código usa tanto `{{key}}` como `{key}` en diferentes archivos
- AGENTS.md especifica `{{key}}` como estándar
- **Impacto**: Bajo-medio — inconsistencias causan bugs en runtime
- **Fijo**: Buscar y normalizar todo a `{{key}}`

### 🟢 5.4 — ThemeManager + VisualSettings configuraciones duplicadas
- `theme-manager.ts` y componentes usan tanto CSS variables como config objetos
- No hay single source of truth para valores de tema
- **Impacto**: Muy bajo — funciona actualmente pero frágil
- **Recomendación**: Documentar VisualSettings como canonical source

---

## RECOMENDACIONES PRIORITARIAS

### FASE 1 — Críticos (inmediato)
1. **Alinear interfaces TypeScript con schemas Zod** (1.1, 1.2, 2.3)
2. **Crear schemas Zod para tablas sin schema** (2.1)
3. **Arreglar Weather.tsx para usar store en lugar de Supabase directo** (3.1)
4. **Normalizar interpolación i18n** (5.1)

### FASE 2 — Medios (próxima semana)
5. **Sincronizar enums DB ↔ Zod** (2.2)
6. **Agregar FKs a interfaces** (2.4)
7. **Remover describe.skip y activar 45 tests** (4.1-4.2)
8. **Estandarizar defaults zod vs DB** (2.5)

### FASE 3 — Mejora continua
9. Agregar campos de auditoría completos (2.6)
10. Envolver tests en act() (4.3)
11. Consolidar configuraciones de tema (5.4)
12. Agregar e2e tests faltantes (4.4)

---

## ANEXOS

### A. Metodología
- **Subagente 1**: Store/Zustand — analizó store.tsx, zustandStore.ts, schemas/, types.ts
- **Subagente 2**: Frontend — analizó screens/, components/, hooks/, SCREEN_KEYS vs archivos
- **Subagente 3**: DB↔Zod — analizó 126 migraciones vs 20 schemas
- **Subagente 4**: Tests (falló por rate limit) — completado con script automatizado
- **Subagente 5**: i18n (falló por rate limit) — completado con PowerShell scripts

### B. Scripts utilizados
- `scripts/find-skipped-tests.cjs` — detecta tests skipped
- PowerShell inline — detecta interpolaciones asimétricas

### C. Próxima ejecución recomendada
```bash
npm run typecheck && npm run lint && npm test -- --run && npm run build
```
Luego: scripts/validar-alineacion-final.ts para verificar alineación DB↔Zod

---

## ESTADO DE DESPLIEGUE

### GitHub Actions
- Workflow: `CI/CD — CONSTRUSMART ERP`
- Run ID: `29757909995`
- Estado actual: `in_progress`
- Rama: `main`
- Commit: `71e8e89`

### Vercel
- Proyecto vinculado al repositorio: `salazaroliveros-prog/CONSTRUSMART-WM-MyS`
- Deploy automático activado por push a `main`
- Verificar en: https://vercel.com/salazaroliveros-prog/CONSTRUSMART-WM-MyS

**Nota**: El workflow local ya validó `typecheck`, `lint`, `tests` y `build` en verde antes del push.

---

**Documento generado**: 2026-07-20  
**Autor**: Análisis automatizado con subagentes + scripts de validación  
**Próxima revisión**: 2026-07-27
