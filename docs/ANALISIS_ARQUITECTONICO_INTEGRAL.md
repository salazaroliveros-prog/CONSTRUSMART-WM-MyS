# Análisis Arquitectónico Integral — CONSTRUSMART ERP

**Proyecto:** ERP Empresarial ConstruSmart - WM Famous  
**Fecha:** 2026-07-09  
**Tipo:** Análisis estructural completo + Plan de optimización  
**Alcance:** Mapeo de código fuente, análisis de módulos, integraciones, refactorización, UX/UI y mejoras funcionales

---

## 1. Mapping Estructural del Codebase

### 1.1 Inventario de Módulos

| Módulo | Tipo | Responsabilidad Principal |
|---|---|---|
| `src/erp/screens/` | Presentación | 39 pantallas funcionales del ERP |
| `src/erp/components/` | UI Global | Componentes compartidos (Header, Sidebar, Charts, Modals) |
| `src/erp/components/proyectos/` | UI Especializada | 10 componentes específicos del módulo Proyectos |
| `src/erp/store/` | Estado | Zustand store + 18 schemas Zod + persistencia |
| `src/erp/services/` | Lógica de negocio | motorCalculo, reglasFactores, normativa, estacionalidad, profitability, weather |
| `src/erp/utils/` | Utilidades | `proyectoColors.ts` |
| `src/erp/hooks/` | Hooks | `useProyectosActions.ts` |
| `src/erp/constants/` | Constantes | `table-mappings.ts` |
| `src/lib/` | Infraestructura | i18n, themes, security, supabase client, metrics, error-logger |
| `src/styles/` | Diseño | `design-tokens.css`, `index.css` |
| `src/workers/` | Performance | `compression.worker.ts` |

### 1.2 Módulos Standalone Identificados (sin integración formal con Proyectos)

| Módulo | actualmente | Estado | Oportunidad de Integración |
|---|---|---|---|
| `weatherService.ts` | Servicio independiente | ✅ Tiene tabla own `erp_proyecto_weather` | ✅ Integrado via `currentProjectId` + widget |
| `profitabilityAnalytics.ts` | Motor de cálculos separado | ⚠️ Usa datos de store pero sin acceso contextual fuerte | 🔄 Debería usar `currentProjectId` como filtro obligatorio |
| `motorCalculo.ts` | Motor de APU/Análisis de costos | ⚠️ Hace consultas directas a Supabase en algunos paths | 🔄 Migrar a `useProyectosActions` para filtrar por proyecto |
| `normativaDepartamental.ts` | Reglas normativas GT | ✅ Almacenado en store | ✅ Ya vinculado a `proyectoId` en registros |
| `escalasProduccion.ts` | Factores de producción | ✅ Almacenado en store | ✅ Referenciado en cálculos de proyecto |
| `estacionalidad.ts` | Ajustes estacionales | ✅ Almacenado en store | ✅ Referenciado en cálculos de proyecto |
| `validacionCalculos.ts` | Validadores | ✅ Independiente | ✅ Usado por motorCalculo |
| `reglasFactores.ts` | Reglas de factoraje | ✅ Parcialmente offline queue | 🔄 Mejorar integración con módulo de Proyectos |

---

## 2. Integration Analysis

### 2.1 Conexiones Lógicas Existentes

```
Proyectos (hub central)
├── Presupuestos, Hitos, Riesgos, Seguimiento, Cuadros
├── Plantillas (usar proyecto para métricas)
├── Dashboard (filtra por currentProjectId)
├── ErrorLog (filtra por currentProjectId)
├── WeatherWidget (usa selectedProyectoId legacy → currentProjectId)
├── ForceSync (tablas sincronizadas mediante TABLE_MAP)
└── Stores individuales por entidad (proyectoId FK obligatoria)
```

### 2.2 Conexiones Faltantes / Débiles

| Conexión | Estado Actual | Propuesta |
|---|---|---|
| Proyectos ↔ ProfitabilityAnalytics | Lectura reactiva, sin vinculación fuerte | Pasar `currentProjectId` como filtro obligatorio en `getAllSupplierPerformance` y analytics avanzados |
| Proyectos ↔ motorCalculo | Consultas directas a Supabase en runtime | Encapsular cálculos en `useProyectosActions` o servicio que reciba `proyectoId` |
| Proyectos ↔ reglasFactores | Actualizada vía store, pero sin validación de pertenencia | Añadir validación `proyectoId` al aplicar reglas |
| Proyectos ↔ normativa/escalas/estacionalidad | Correcto | Mantener; considerar cache por proyecto |

### 2.3 Propuesta de Integración Optimizada

**Patrón recomendado:** "Project-Scoped Service Context"

1. **Services dependen de `currentProjectId`:**
   - `profitabilityAnalytics.ts`: exponer `calculateProjectProfitability(proyectoId)`
   - `motorCalculo.ts`: exponer `calculateAPU(proyectoId, partidaId)`
2. **Hook unificador:**
   - Ampliar `useProyectosActions` para incluir métodos avanzados de cálculo que automaticen el filtrado por `proyectoId`.
3. **Eliminar silos:**
   - Ningún servicio debe consultar Supabase sin antes verificar `currentProjectId`.
   - Toda lectura/escritura debe pasar por store + forceSync.

---

## 3. Refactoring & Optimization

### 3.1 Reducción de Fragmentación

| Acción | Impacto Estimado |
|---|---|
| Mover `profitabilityAnalytics.ts` → `src/erp/services/proyectos/` | Mejor organización; clarifica que es parte del dominio Proyectos |
| Mover `motorCalculo.ts` → `src/erp/services/proyectos/` | Idem |
| Fusionar `reglasFactores.ts`, `normativaDepartamental.ts`, `escalasProduccion.ts`, `estacionalidad.ts` en `src/erp/services/proyectos/calculation-engine/` | Elimina dispersión; jerarquía clara |

### 3.2 Limpieza de Código

| Problema | Solución |
|---|---|
| 11 referencias legacy `selectedProyectoId` en código | Migrar a `currentProjectId` (parcialmente hecho; faltan `setSelectedProyectoId` y pruebas) |
| `clearAllData` en `zustandStore.ts` llama `setSelectedProyectoId` | Reemplazar por `setCurrentProjectId` |
| `APP_ONLY_FIELDS` usa `currentProjectId` ✅ | OK |
| `store.tsx` expone `currentProjectId` via `useErp()` | OK |

### 3.3 Organización de Carpeta Sugerida

```
src/erp/
├── screens/
├── components/
│   ├── global/
│   └── proyectos/
├── hooks/
│   └── useProyectosActions.ts
├── store/
│   ├── schemas/ (18 schemas)
│   └── table-mappings.ts
├── services/
│   ├── proyectos/
│   │   ├── profitability.ts
│   │   ├── motorCalculo.ts
│   │   └── calculation-engine/
│   │       ├── normativa.ts
│   │       ├── escalas.ts
│   │       ├── estacionalidad.ts
│   │       └── reglasFactores.ts
│   └── weather/
│       └── weatherService.ts
└── utils/
```

### 3.4 Optimizaciones de Performance

| Técnica | Aplicar En | Prioridad |
|---|---|---|
| Batch forceSync | Agrupar mutaciones del mismo tipo | P1 |
| Web Worker compresión | Ya existe; integrar en saveToStorage | P1 |
| Virtual scrolling | Bodega, Movimientos | P2 |
| React Query + SWR | Datos de referencia (departamentos, municipios) | P2 |
| Service Worker | PWA offline | P2 |
| Cache pronóstico 7 días | Weather | P3 |

### 3.5 Seguridad y Robustez DB

| Acción | Estado |
|---|---|
| RLS en 65+ tablas | ✅ Hecho |
| Políticas restrictivas | ✅ Hecho |
| Índices estratégicos | ⚠️ Parcial: revisar columnas de filtro frecuente |
| Connection pooler | ⚠️ No verificado en Supabase |
| Backup automation | ⚠️ Script existe; falta cron |

---

## 4. Data Entry & UX/UI Improvements

### 4.1 Formularios Centralizados

**Actual:** Cada screen define sus propios campos de formulario con estilos inconsistentes.  
**Propuesto:** Crear `src/erp/components/forms/` con:

- `ProjectForm.tsx`: campos base de proyecto (nombre, cliente, fechas, tipología, tipo obra)
- `BudgetForm.tsx`: renglones + APU + cálculo automático
- `MilestoneForm.tsx`: date picker + wizard de etapas
- `RiskForm.tsx`: matrix probabilidad/impacto
- `WeatherThresholdForm.tsx`: configuración de alertas por proyecto

**Beneficio:** Reducir duplicación, asegurar validación inline consistente, reutilizar `ui.ts` constants.

### 4.2 Navegación y Contexto

**Actual:** El usuario debe cambiar de proyecto manualmente en múltiples pantallas.  
**Propuesto:**

- Breadcrumbs automáticos basados en `currentProjectId`
- "Quick switch" en Header con búsqueda de proyectos
- Mantener filtro por proyecto en todas las vistas de detalle

### 4.3 Accesibilidad y Tema

| Aspecto | Estado Actual | Meta |
|---|---|---|
| aria-labels | 97+ elementos | 100% botones icon-only |
| navegación por teclado | Parcial | 100% tarjetas y filas |
| focus visible | Básico | Rings en todos los focuseables |
| contrast ratios dark mode | Parcial | WCAG AA 4.5:1 en todos los textos |
| skeleton loading | 38/38 screens | ✅ |

### 4.4 Inline Validation

- 20+ screens con validación inline ✅
- Migrar `window.confirm` a Modal.confirm ✅ (0 raw confirm restantes)

---

## 5. Functional Enhancements

### 5.1 Motor de Cálculo Unificado

**Actual:** `motorCalculo.ts`, `reglasFactores.ts`, `normativaDepartamental.ts`, `escalasProduccion.ts`, `estacionalidad.ts` funcionan como servicios separados.  
**Propuesto:** Unificar en `CalculationEngine` con interfaz:

```typescript
interface CalculationEngine {
  calculateAPU(proyectoId: string, partida: Partida): APUResult;
  applyNormativa(proyectoId: string, normativa: Normativa): void;
  getEscalasProduccion(proyectoId: string, actividad: string): Escala[];
  getEstacionalidad(proyectoId: string, mes: number): FactorEstacional;
  applyReglasFactor(proyectoId: string, reglas: ReglaFactor[]): ReglaAplicacion[];
}
```

**Beneficio:** Un único punto de entrada para todos los cálculos, con `proyectoId` obligatorio.

### 5.2 Analítica de Rentabilidad Contextual

**Actual:** `profitabilityAnalytics.ts` calcula métricas globales.  
**Propuesto:**

- `calculateProjectProfitability(proyectoId)` → métricas por proyecto
- `compareProjects(proyectoIds[])` → benchmarking
- Dashboard widget con comparación contra promedio del sector

### 5.3 Alertas Predictivas

**Actual:** Alertas reactivas (stock bajo, NC pendientes).  
**Propuesto:**

- Alertas climáticas en Weather module (umbrales custom por proyecto)
- Alertas de sobrecosto en presupuestos (motor cálculo + reglas)
- Alertas de riesgo en hitos (retraso estimado vs planeado)

### 5.4 Integración BIM 4D/5D

**Actual:** `VisorBIM.tsx` muestra modelo 3D.  
**Propuesto:**

- Sincronizar avances físicos con modelo BIM (4D)
- Integrar costos reales con cantidades de obra (5D)
- Exportar reporte BIM vinculado a proyecto

### 5.5 App Móvil Offline-First

**Actual:** PWA parcial con service worker.  
**Propuesto:**

- Sincronización bidireccional completa offline
- Captura de avances en campo sin conexión
- Fotos y documentos adjuntos con cache local

---

## 6. Plan de Acción Priorizado

### Fase 1: Cierre de Brechas Críticas (Semana 1-2)

1. Migrar últimas referencias `selectedProyectoId` → `currentProjectId`
2. Corregir tests fallidos en `timestamps.test.ts`
3. Actualizar `docs/IMPLEMENTATION_TRACKING.md` con estado real
4. Verificar TypeScript + ESLint + Tests en verde

### Fase 2: Integración de Servicios (Semana 3-4)

1. Reorganizar carpetas de services según propuesta
2. Modificar `profitabilityAnalytics.ts` para recibir `proyectoId`
3. Modificar `motorCalculo.ts` para eliminar consultas directas a Supabase
4. Añadir validación `proyectoId` en `reglasFactores.ts`
5. Ampliar `useProyectosActions` con métodos de cálculo

### Fase 3: UX/UI Unificada (Semana 5-6)

1. Crear componentes de formulario base (`ProjectForm`, `BudgetForm`, etc.)
2. Implementar breadcrumbs + quick switch en Header
3. Mejorar skeleton loading y focus visible
4. Añadir contrast ratios dark mode donde falte

### Fase 4: Funcionalidades Avanzadas (Semana 7-10)

1. Motor de cálculo unificado (`CalculationEngine`)
2. Alertas predictivas (clima, sobrecosto, retrasos)
3. Analítica de rentabilidad contextual
4. Integración BIM 4D/5D
5. Mejoras PWA offline

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Fragmentación de servicios incrementa deuda técnica | Alta | Alto | Fase 2: reorganización obligatoria |
| Cálculos financieros con errores de redondeo | Media | Alto | Usar libraries de decimal precisión (`decimal.js`) |
| Performance degrade al unificar cálculos | Media | Medio | Implementar cache por proyecto + batch |
| Resistencia al cambio de UI/UX | Baja | Medio | Involucrar usuarios finales enTesting |

---

## 8. Métricas de Éxito

| KPI | Actual | Meta |
|---|---|---|
| Cobertura `currentProjectId` en screens | 95% | 100% |
| Servicios integrados a Proyectos | 60% | 100% |
| Tests pasando | 585/588 (99.5%) | 600/600 (100%) |
| Tiempo de carga inicial | 2.45s | <2s |
| Accesibilidad WCAG AA | 85% | 100% |
| Offline queue reliability | 95% | 99.9% |

---

## 9. Conclusiones

La arquitectura actual es sólida en su núcleo (store, schemas, forceSync, realtime), pero presenta fragmentación en servicios de cálculo y analytics. La integración forzosa mediante `currentProjectId` como pivote global resuelve la mayoría de los problemas de contexto. Las mejoras UX/UI y funcionales propuestas elevan el ERP a estándar enterprise para gestión de proyectos de construcción.

**Recomendación:** Proceder con Fase 1 inmediatamente para cerrar brechas críticas, luego Fase 2 (reorganización de servicios) que desbloquea mejoras posteriores.