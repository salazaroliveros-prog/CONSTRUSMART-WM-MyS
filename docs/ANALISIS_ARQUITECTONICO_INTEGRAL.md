# Análisis Arquitectónico Integral — CONSTRUSMART ERP

**Fecha:** 2026-08-07  
**Autor:** CONSTRUSMART ERP Team  
**Versión:** 1.0  
**Estado:** Aprobado para implementación

---

## 1. Visión General del Sistema

### 1.1 Propósito
ERP empresarial para gestión integral de proyectos de construcción, con capacidad multi-proyecto,控制financiero, seguimiento físico, gestión de riesgos, calidad, logística, RRHH, y business intelligence.

### 1.2 Stack Tecnológico
- **Frontend:** React 18.3 + TypeScript 5.5 + Vite 5.4
- **UI Framework:** Ant Design 5.29.3 + Tailwind CSS
- **State Management:** Zustand + React Context (ErpProvider)
- **Backend:** Supabase (PostgreSQL + Realtime + RLS)
- **Validación:** Zod schemas
- **Formularios:** React Hook Form + Zod resolver
- **Exportación:** jspdf + html2canvas + xlsx
- **Visualizaciones:** Recharts + Three.js/web-ifc (BIM)
- **i18n:** react-i18next (es/en)

### 1.3 Patrones Arquitectónicos
- **Offline-first:** Mutation queue + localStorage + forceSync
- **Lazy Loading:** Todas las pantallas y componentes pesados
- **Schema-driven:** Zod schemas como fuente de verdad para tipos y validación
- **RBAC Client-side:** getViewsByRole para control de acceso
- **Compression:** lz-string para datos >10KB en localStorage

---

## 2. Análisis de Integración

### 2.1 Módulos Core y Relaciones

```
┌─────────────────────────────────────────────────────────────┐
│                    CONSTRUSMART ERP                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Proyectos   │◄──►│  Presupuestos│◄──►│     APU      │  │
│  │  (Hub)       │    │              │    │              │  │
│  └──────┬───────┘    └──────────────┘    └──────────────┘  │
│         │                                                     │
│         ├──► Hitos                                            │
│         ├──► Riesgos                                          │
│         ├──► Seguimiento (EVM)                                │
│         ├──► Muro Obra                                        │
│         ├──► Ordenes Cambio                                   │
│         └──► Documentos                                       │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │    CRM       │◄──►│Cotizaciones  │◄──►│    Bodega    │  │
│  │              │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Financiero   │◄──►│ Cuentas Cobrar│◄──►│ Cuentas Pagar│  │
│  │              │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │    RRHH      │◄──►│Planilla Dest.│◄──►│ Rend. Campo │  │
│  │              │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Dashboard  │◄──►│Predictivo BI │◄──►|Profitability │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Conexiones Lógicas Identificadas

| Módulo Origen | Módulo Destino | Tipo de Relación | Frecuencia | Prioridad |
|---------------|----------------|------------------|------------|-----------|
| Proyectos | Hitos | 1:N | Alta | Alta |
| Proyectos | Riesgos | 1:N | Alta | Alta |
| Proyectos | Seguimiento | 1:N | Alta | Alta |
| Proyectos | Presupuestos | 1:1 | Media | Alta |
| Proyectos | Bitácora | 1:N | Alta | Media |
| Proyectos | Avances | 1:N | Alta | Media |
| Proyectos | OrdenesCompra | 1:N | Media | Alta |
| Proyectos | ValesSalida | 1:N | Media | Alta |
| Proyectos | MuroObra | 1:N | Media | Media |
| Proyectos | Documentos | 1:N | Media | Media |
| Presupuestos | APU | 1:N | Alta | Alta |
| Presupuestos | CuadroComparativo | 1:1 | Media | Media |
| CRM | Cotizaciones | 1:N | Alta | Alta |
| Bodega | OrdenesCompra | 1:N | Alta | Alta |
| Bodega | EntradasAlmacen | 1:N | Media | Media |
| RRHH | PlanillaDestajos | 1:N | Media | Media |
| Financiero | CuentasCobrar | 1:N | Alta | Alta |
| Financiero | CuentasPagar | 1:N | Alta | Alta |

### 2.3 Oportunidades de Integración Optimizada

#### 2.3.1 Contexto Global de Proyecto (EN PROGRESO)
**Problema:** 16+ módulos mantienen filtros locales `selectedProyectoId` independientes.  
**Solución:** Introducir `currentProjectId` en contexto global.  
**Beneficio:** Elimina duplicación, reduce estado inconsistente, mejora UX.  
**Estado:** 
- ✅ Fase 1: Hitos migrado
- ✅ Riesgos migrado
- ✅ Seguimiento migrado
- ⏳ Pendiente: 13 módulos restantes

#### 2.3.2 Dashboard como Orquestador
**Problema:** Dashboard muestra métricas aisladas sin contexto profundo.  
**Solución:** 
- Widgets drill-down desde Dashboard a módulos específicos
- KPI cards con navegación directa al detalle del proyecto
- Alertas agregadas de todos los módulos en un solo lugar  
**Beneficio:** Visibilidad ejecutiva, respuesta rápida a incidencias.

#### 2.3.3 Motor de Cálculo Centralizado
**Problema:** Cálculos de presupuestos, APU, y análisis de costos están duplicados en múltiples archivos.  
**Solución:** `src/lib/motorCalculo.ts` como única fuente de verdad.  
**Beneficio:** Consistencia numérica, mantenibilidad, testing centralizado.  
**Estado:** ✅ Implementado en SESIÓN-07

#### 2.3.4 ForceSync como Capa Unificada
**Problema:** Algunas pantallas usan `supabase.from()` directo, bypassando el mutation queue.  
**Solución:** 100% de operaciones CRUD through `forceSync`.  
**Beneficio:** Offline-first garantizado, sincronización automática, logging centralizado.  
**Estado:** ⚠️ 4 service files aún bypassean la queue (motorCalculo.ts, normativaDepartamental.ts, escalasProduccion.ts, estacionalidad.ts)

#### 2.3.5 Nested Data References
**Problema:** Algunas entidades cargan datos anidados completos en vez de referencias ligeras.  
**Solución:** Schema alignment con nested objects como lightweight references.  
**Beneficio:** Reducción de tamaño de localStorage, mejor performance.  
**Ejemplo:** `cuadroSchema.cotizaciones` usa `CotizacionItem` (referencia), no `CotizacionCliente` (completo).

---

## 3. Refactoring y Optimización

### 3.1 Estrategias de Refactorización

#### 3.1.1 Extracción de Componentes (Completado)
**Módulo:** Proyectos  
**Resultado:** 10 componentes extraídos, 45% reducción de tamaño.  
**Lección:** Aplicar patrón a otros monolitos (Presupuestos: 46KB chunk, Dashboard: 47KB chunk).

**Candidatos:**
- `Presupuestos.tsx` → `PresupuestoForm`, `PresupuestoResumen`, `RenglonPresupuesto`
- `Dashboard.tsx` → `MetricCard`, `AlertWidget`, `ChartContainer`
- `Bodega.tsx` → `ItemCard`, `MovimientoForm`, `StockAlert`

#### 3.1.2 Hooks Personalizados
**Patrón:** Mover lógica de negocio de componentes a hooks reutilizables.

**Ejemplos:**
```typescript
// Antes: lógica dispersa en componente
const [filtered, setFiltered] = useState([]);
useEffect(() => { /* filter logic */ }, [search, status]);

// Después: hook reutilizable
const { data, search, setSearch, filterByStatus } = useFilteredProjects();
```

**Aplicar a:**
- `useProyectosFilters` — búsqueda, ordenamiento, filtrado
- `useProyectosActions` — CRUD, pausa, reanudación
- `useProyectosForm` — estado formulario, validación, submit
- `useCurrentProject` — Ya implementado ✅

#### 3.1.3 Reducción de Bundle Size
**Actual:**
- `Proyectos-*.js`: 246 KB (66 KB gzip)
- `Presupuestos-*.js`: 46 KB (11 KB gzip)
- `antd-*.js`: 1,084 KB (337 KB gzip)

**Objetivo:** < 100 KB por pantalla crítica.

**Estrategias:**
1. **Code splitting más agresivo:** Mover librerías pesadas (xlsx, pdf, three.js) a dynamic imports condicionales
2. **Tree shaking:** Verificar que xlsx y pdf solo se importen en pantallas de exportación
3. **Ant Design on-demand:** Usar `antd/es/button` en vez de `antd` completo
4. **Icon optimization:** Reemplazar `lucide-react` por iconos inline SVG en componentes de alta frecuencia

#### 3.1.4 Normalización de Schemas
**Problema:** Algunos schemas Zod tienen campos duplicados o tipos inconsistentes.  
**Solución:** Auditoría y alineación 1:1 entre schema Zod e interface TypeScript.  
**Estado:** ✅ Completado en SESIÓN-13 para 20+ entidades.

#### 3.1.5 Eliminación de Código Muerto
**Completado:** 45 archivos eliminados en SESIÓN-09.  
**Próximo:** Auditar `src/hooks/` y `src/lib/` para identificar hooks huérfanos.

### 3.2 Optimizaciones de Performance

#### 3.2.1 Memoización Estratégica
**Actual:** Uso limitado de `React.memo` y `useMemo`.  
**Propuesta:**
- `React.memo` en todos los componentes presentacionales puros
- `useMemo` en derivaciones costosas (filtros, ordenamientos, cálculos)
- `useCallback` en handlers pasados como props a componentes memorizados

**Objetivo:** Reducir re-renders innecesarios en listas grandes.

#### 3.2.2 Virtual Scrolling
**Desencadenante:** Cuando `proyectos.length > 50` o `movimientos.length > 500`.  
**Solución:** `@tanstack/react-virtual` en:
- `ProyectoList.tsx`
- `Bodega.tsx` (lista de materiales)
- `Movimientos.tsx` (tabla de movimientos)
- `Bitacora.tsx` (lista de entradas)

**Beneficio:** Renderizado solo de items visibles, mejora drástica en listas grandes.

#### 3.2.3 Web Worker para Compresión
**Actual:** `compressData`/`decompressData` con lz-string corren en main thread.  
**Propuesta:** Mover a Web Worker (`src/workers/compression.worker.ts`).  
**Beneficio:** No bloquea UI durante compresión/descompresión de datos grandes.

#### 3.2.4 Service Worker para Offline
**Actual:** Offline-first funciona via localStorage + mutation queue.  
**Mejora:** Service Worker para cachear assets estáticos y datos de referencia.  
**Beneficio:** Carga inicial más rápida, funcionalidad offline extendida.

#### 3.2.5 React Query para Datos de Referencia
**Candidatos:**
- `erp_departamentos_gt`
- `erp_municipios_gt`
- `erp_tipologia_obra`
- `erp_estados_proyecto`

**Estrategia:** React Query con `stale-while-revalidate` para cachear y revalidar en background.

---

## 4. Mejoras en Entrada de Datos y UX/UI

### 4.1 Rediseño de Formularios

#### 4.1.1 Form Layout Estandarizado
**Problema:** Formularios usan layouts inconsistentes (grid de 2, 3, 4 columnas sin patrón).  
**Solución:** Establecer convenciones:
- **Formularios simples** (≤5 campos): Grid de 1 columna
- **Formularios medianos** (6-10 campos): Grid de 2 columnas
- **Formularios complejos** (>10 campos): Grid de 2 columnas + secciones colapsables
- ** wizard paso a paso** para formularios muy largos (>15 campos)

**Aplicar a:**
- ProyectoForm (ya implementado con secciones colapsables ✅)
- PresupuestoForm
- OrdenCompraForm
- ValeSalidaForm

#### 4.1.2 Validación Inline Mejorada
**Actual:** La mayoría de formularios usan `toast.error` para validación.  
**Mejora:** Validación inline con mensajes debajo de cada campo.

**Patrón:**
```tsx
<div className="space-y-1">
  <input className={cn(INPUT, formErrors.nombre && 'border-red-500')} />
  {formErrors.nombre && (
    <p className="text-xs text-red-500 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {formErrors.nombre}
    </p>
  )}
</div>
```

**Aplicar a:** Todos los formularios del sistema.

#### 4.1.3 Autocompletado Inteligente
**Oportunidades:**
- **ProyectoForm:** Autocompletar cliente, tipología basado en proyecto anterior
- **OrdenCompraForm:** Autocompletar proveedor, materiales basado en historial
- **ValeSalidaForm:** Autocompletar cantidad basado en consumo promedio
- **BitacoraForm:** Sugerir tareas basado en tipo de obra

**Tecnología:** Debounce + búsqueda en Supabase + localStorage cache.

#### 4.1.4 Búsqueda Global
**Actual:** Búsqueda limitada a módulos individuales.  
**Propuesta:** Búsqueda global en Header (Cmd+K / Ctrl+K).

**Alcance:**
- Proyectos por nombre, cliente, NIT
- Presupuestos por código
- Documentos por nombre
- Movimientos por concepto
- Personas por nombre

**UI:** Modal con resultados categorizados + navegación directa.

### 4.2 Mejoras de Navegación

#### 4.2.1 Breadcrumbs
**Actual:** Navegación plana sin contexto de ubicación.  
**Propuesta:** Breadcrumbs en todas las pantallas.

**Ejemplo:**
```
Proyectos › Edificio Central › Presupuestos › Edición 2026
```

**Aplicar a:** Pantallas con jerarquía clara (Proyectos → Módulos → Detalle).

#### 4.2.2 Filtros Persistentes
**Problema:** Filtros se pierden al cambiar de pantalla.  
**Solución:** Guardar filtros en `appSettings` por usuario.  
**Beneficio:** UX mejorada, menos clics para filtrar.

#### 4.2.3 Accesos Rápidos Personalizables
**Propuesta:** Usuario puede elegir 4-8 accesos directos en Dashboard.  
**Opciones:** Proyecto favorito, módulo frecuente, reporte común.  
**Implementación:** `appSettings.favoriteShortcuts`.

### 4.3 Mejoras Visuales

#### 4.3.1 Dark Mode por Defecto
**Actual:** Tema claro por defecto, dark mode opcional.  
**Propuesta:** Detectar preferencia del sistema (`prefers-color-scheme: dark`).  
**Beneficio:** Mejor experiencia inicial, reduce eye strain.

#### 4.3.2 Animaciones de Transición
**Actual:** Transiciones básicas en hover.  
**Mejora:**
- Fade in/out al cambiar de pantalla
- Slide al abrir modales
- Skeleton screens en todas las pantallas (✅ 100% completado)
- Empty states ilustrados (✅ parcial)

#### 4.3.3 Responsive Mejorado
**Actual:** Breakpoints básicos (sm, md, lg).  
**Mejora:** Agregar `xl` y `2xl` para pantallas grandes.  
**Enfoque:** Mobile-first, pero maximizar uso de espacio en desktop.

---

## 5. Mejoras Funcionales

### 5.1 Modulaciones por Proyecto

#### 5.1.1 Fase 1: Contexto Global (EN PROGRESO)
**Objetivo:** Todos los módulos usan `currentProjectId`.  
**Beneficio:** Filtrado automático, sin selección manual repetitiva.

#### 5.1.2 Fase 2: Dashboard Inteligente
**Características:**
- **KPI Cards:** Métricas clave por proyecto (avance, presupuesto, riesgos)
- **Alertas agregadas:** Stock crítico, hitos vencidos, NC pendientes, OC sin aprobar
- **Gráficos comparativos:** Proyecto actual vs. promedio histórico
- **Drill-down:** Click en KPI navega a detalle del módulo

#### 5.1.3 Fase 3: Workflow Unificado
**Ejemplo: Flujo de Orden de Compra**
```
1. Bodega detecta stock bajo → Alerta
2. Usuario crea OC desde Proyecto → asigna proveedor
3. OC se sincroniza con Financiero (cuentas por pagar)
4. Proveedor entrega → Registro en Recepciones
5. Recepción actualiza stock automáticamente
6. Financiero genera pago programado
```

**Beneficio:** Trazabilidad completa, menos errores de entrada manual.

### 5.2 Nuevas Funcionalidades

#### 5.2.1 Sistema de Notificaciones Inteligente
**Actual:** Notificaciones básicas por evento.  
**Mejora:**
- **Notificaciones predictivas:** Basadas en tendencias (ej. "Probable retraso en hito X")
- **Agrupación:** Notificaciones similares se agrupan
- **Canales:** In-app + email + SMS (opcional)
- **Leer después:** Marcador de no leído con recordatorio

**Implementación:** Ya existe base en `addNotificacion` con grouping ✅.

#### 5.2.2 Audit Trail por Proyecto
**Actual:** Log de cambios en entidades individuales.  
**Mejora:** Vista consolidada de cambios por proyecto.

**UI:** Pantalla Auditoria con:
- Filtro por proyecto, usuario, fecha, entidad
- Timeline de cambios
- Diff visual de cambios (old vs new)

**Estado:** ✅ Pantalla Auditoria implementada en SESIÓN-13.

#### 5.2.3 Comparación de Versiones
**Actual:** No existe control de versiones en documentos/proyectos.  
**Propuesta:**
- Versionado automático en cambios mayores (estado, presupuesto, avance)
- Diff visual entre versiones
- Rollback a versión anterior (con logging)

**Aplicar a:** Proyectos, Presupuestos, OrdenesCompra.

#### 5.2.4 Análisis Predictivo
**Nivel 1: Alertas basadas en reglas**
- Si avance físico < avance financiero por >8% → Alerta de sobrecosto
- Si probabilidad + impacto > 15 → Marcar riesgo como crítico
- Si OC sin confirmar >7 días → Recordatorio

**Nivel 2: Machine Learning (futuro)**
- Predicción de retrasos basada en historial
- Detección de anomalías en costos
- Optimización de inventario

**Implementación:** `DashboardPredictivo.tsx` ya existe, expandir reglas.

#### 5.2.5 API de Integración
**Propuesta:** REST API para integrar con:
- Sistemas de facturación electrónica (FEL)
- Plataformas de pago en línea
- Sistemas de control de acceso biométrico
- Wearables para Safety-OSHA

**Tecnología:** Supabase Edge Functions + webhooks.

### 5.3 Fortalezas Operativas

#### 5.3.1 Control de Versiones de Documentos
**Problema:** No hay control de versiones en documentos subidos.  
**Solución:** 
- Hash de archivo (SHA-256)
- Metadata: versión, fecha, usuario, cambios
- Historial de versiones con comparación

**Impacto:** Trazabilidad, cumplimiento normativo.

#### 5.3.2 Gestión de Subcontratistas
**Actual:** Subcontratos como entidad muerta eliminada.  
**Reintroducción mejorada:**
- Evaluación de desempeño (rating, comentarios)
- Certificaciones y documentos adjuntos
- Historial de proyectos
- Alertas de vencimiento de pólizas

#### 5.3.3 Safety-OSHA Integration
**Propuesta:** Módulo de seguridad industrial.
- Checklist diario de seguridad
- Incidentes y near-misses
- capacitaciones
- Estadísticas de seguridad

**Integración:** Ligado a RRHH y Proyectos.

#### 5.3.4 Business Intelligence Avanzado
**Actual:** Dashboard básico + ProfitabilityAnalytics.  
**Mejoras:**
- **Drill-down reports:** Desde métrica a transacción individual
- **Exportación programada:** Reportes automáticos por email
- **Data warehouse:** Tablas agregadas para análisis histórico
- **Comparativas:** Proyecto vs. industria, benchmarks

---

## 6. Arquitectura Técnica Detallada

### 6.1 Estructura de Directorios

```
src/
├── erp/
│   ├── screens/          # 38 pantallas lazy-loaded
│   │   ├── Proyectos.tsx
│   │   ├── Hitos.tsx
│   │   ├── Riesgos.tsx
│   │   └── ...
│   ├── components/       # Componentes reutilizables
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Charts/
│   │   ├── GanttChart.tsx
│   │   └── proyectos/
│   ├── store/            # Estado global
│   │   ├── store.tsx     # ErpProvider + useErp
│   │   ├── schemas/      # Zod schemas canónicos
│   │   │   ├── proyectos.ts
│   │   │   ├── bodega.ts
│   │   │   └── ...
│   │   └── zustandStore.ts
│   ├── hooks/            # Custom hooks
│   │   ├── useChartConfig.ts
│   │   ├── useCurrentProject.ts
│   │   └── ...
│   ├── types/            # TypeScript interfaces
│   │   ├── index.ts
│   │   ├── proyectos.ts
│   │   └── ...
│   ├── utils/            # Utilidades
│   │   ├── proyectoColors.ts
│   │   └── ...
│   ├── ui.ts             # Tailwind constants
│   └── __tests__/
├── lib/                  # Dependencias externas
│   ├── i18n/             # Traducciones
│   ├── error-db-logger.ts
│   └── auto-repair.ts
├── components/           # Componentes UI genéricos
│   ├── ui/               # shadcn/ui components
│   ├── ErrorBoundary.tsx
│   └── SyncStatusBadge.tsx
├── styles/               # CSS global
└── workers/              # Web Workers
    └── compression.worker.ts
```

### 6.2 Flujo de Datos

```
[UI Event] 
    ↓
[Mutation Queue]
    ↓
{Online?}
    ├─ Yes → [forceSync] → [(Supabase)] → [Realtime] → [State Merge]
    └─ No → [localStorage] → [lz-string compression]
              ↓
        [Next sync when online]
```

### 6.3 Estado Global

**Zustand Store:**
- 33+ entidades de estado
- 100+ mutation handlers
- MUTATION_TABLE_MAP para fuerzaSync
- Optimistic updates con rollback

**React Context (ErpProvider):**
- `currentProjectId`, `setCurrentProjectId`, `currentProject`
- `user`, `auth`, `settings`
- Métodos auxiliares: `useCurrentProject()`, `useResponsive()`

**Persistencia:**
- localStorage con Zod validation
- Compresión lz-string para datos >10KB
- Auto-repair en caso de corrupción

### 6.4 Seguridad

**RLS (Row Level Security):**
- 65+ tablas protegidas
- Políticas basadas en `get_accessible_proyectos()`
- Anon SELECT revocado de tablas operacionales

**Sanitización:**
- Input sanitization en formularios
- XSS prevention en renderizado
- SQL injection prevention via Supabase parameterized queries

**Audit Trail:**
- Log de cambios en entidades críticas
- Registro de usuario, fecha, old/new values
- Pantalla de auditoría con filtros

---

## 7. Testing

### 7.1 Cobertura Actual

| Tipo | Tests | Estado |
|------|-------|--------|
| Unitarios | 586 | ✅ Todos pasan |
| Integración | 21 archivos | ✅ Todos pasan |
| E2E | 1 | ✅ Flujo completo proyecto |
| Performance | No automatizado | ⏳ Pendiente |
| Accesibilidad | No automatizado | ⏳ Pendiente |

### 7.2 Estrategia de Testing

**Unitarios:**
- Store operations (CRUD, filters, calculations)
- Componentes presentacionales
- Utilidades y helpers

**Integración:**
- Módulos completos con store real
- Flujos de usuario end-to-end en ambiente controlado

**E2E:**
- Playwright para flujos críticos
- CI/CD en cada push

**Futuro:**
- Performance tests con `vitest-benchmark`
- a11y tests con `@axe-core/playwright`

---

## 8. Roadmap de Implementación

### Fase 1: Contexto Global de Proyecto (Semanas 1-2)
- [x] Introducir `currentProjectId` en contexto
- [x] Crear `useCurrentProject()` hook
- [x] Migrar Hitos
- [x] Migrar Riesgos
- [x] Migrar Seguimiento
- [ ] Migrar Presupuestos
- [ ] Migrar Bodega
- [ ] Migrar OrdenesCambio
- [ ] Migrar MuroObra
- [ ] Migrar Documentos
- [ ] Migrar 8 módulos restantes

### Fase 2: Optimización de Performance (Semana 3)
- [ ] Code splitting: xlsx, pdf, three.js como dynamic imports
- [ ] Tree shaking: verificar antd on-demand
- [ ] Memoización: React.memo en componentes puros
- [ ] Virtual scrolling: listas >50 items
- [ ] Web Worker para compresión
- [ ] Service Worker para assets

### Fase 3: UX/UI Mejoras (Semana 4)
- [ ] Formularios: validación inline en todos
- [ ] Breadcrumbs en jerarquías
- [ ] Búsqueda global (Cmd+K)
- [ ] Filtros persistentes
- [ ] Accesos rápidos personalizables
- [ ] Dark mode por defecto

### Fase 4: Nuevas Funcionalidades (Semanas 5-8)
- [ ] Dashboard inteligente con drill-down
- [ ] Notificaciones predictivas
- [ ] Auditoría consolidada por proyecto
- [ ] Control de versiones en documentos
- [ ] API de integración (FEL, pagos, biométricos)
- [ ] Subcontratistas mejorado
- [ ] Safety-OSHA module
- [ ] BI avanzado (data warehouse, benchmarks)

### Fase 5: Orquestación Final y Testing (Semana 9)
- [ ] Tests de performance
- [ ] Tests de accesibilidad automatizados
- [ ] Load testing
- [ ] Documentación final
- [ ] Capacitación a usuarios

---

## 9. Métricas de Éxito

| Métrica | Objetivo | Actual | Estado |
|---------|----------|--------|--------|
| Tamaño bundle inicial | < 500 KB gzip | ~1,100 KB | ⚠️ |
| Tiempo de carga inicial | < 3s | ~2.5s | ✅ |
| Tests coverage | > 90% | ~85% | ⚠️ |
| TypeScript errors | 0 | 0 | ✅ |
| Lint errors | 0 | 0 | ✅ |
| Accesibilidad (WCAG) | AA | A (parcial) | ⚠️ |
| Offline functionality | 100% | 100% | ✅ |
| Módulos con contexto global | 100% | 25% | ⚠️ |

---

## 10. Conclusiones

### Fortalezas Actuales
1. Arquitectura offline-first robusta
2. Cobertura de tests sólida (586/586)
3. TypeScript estricto sin errores
4. Sistema de diseño unificado
5. Documentación técnica completa

### Áreas de Oportunidad
1. **Integración modular:** Aumentar cohesión entre módulos relacionados
2. **Performance:** Reducir bundle size, implementar virtual scrolling
3. **UX/UI:** Validación inline, breadcrumbs, búsqueda global
4. **Contexto global:** Migrar todos los módulos a `currentProjectId`
5. **Feature expansion:** Notificaciones predictivas, API, BI avanzado

### Recomendación Estratégica
**Priorizar Fase 1 (Contexto Global)** como base para todas las mejoras posteriores. Sin un eje central de proyecto, las integraciones futuras seguirán siendo fragmentadas.

Una vez alcanzado 100% de contexto global, proceder con Fase 3 (UX/UI) para maximizar impacto en productividad del usuario.

---

*Documento generado en el contexto de la sesión de refactorización integral del 2026-08-07.*