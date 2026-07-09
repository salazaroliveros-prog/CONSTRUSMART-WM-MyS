# Análisis Arquitectónico Integral — CONSTRUSMART ERP

**Fecha:** 2026-08-07
**Versión:** 1.0
**Autor:** Ingeniero Civil Especialista en Desarrollo de Proyectos de Construcción

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura Actual del Sistema](#2-arquitectura-actual-del-sistema)
3. [Análisis de Integración entre Módulos](#3-análisis-de-integración-entre-módulos)
4. [Plan de Reestructuración: Proyectos como Eje Central](#4-plan-de-reestructuración-proyectos-como-eje-central)
5. [Refactorización y Optimización del Código](#5-refactorización-y-optimización-del-código)
6. [Rediseño de UX/UI y Entrada de Datos](#6-rediseño-de-uxui-y-entrada-de-datos)
7. [Mejoras Funcionales Estratégicas](#7-mejoras-funcionales-estratégicas)
8. [Roadmap de Implementación](#8-roadmap-de-implementación)
9. [Métricas de Éxito](#9-métricas-de-éxito)

---

## 1. Resumen Ejecutivo

CONSTRUSMART ERP es un sistema de gestión empresarial para la construcción con **38 pantallas**, **34 tablas Supabase**, **~637 tests** y una arquitectura offline-first con cola de mutaciones y sincronización bidireccional. 

**Hallazgo Principal:** El módulo **Proyectos** funciona como hub central del negocio, pero 16 módulos satélite operan como pantallas independientes al mismo nivel jerárquico, sin estar formalmente anidados bajo Proyectos. Esto crea:

- Duplicación de filtros de proyecto en cada pantalla
- Inconsistencia en el contexto de navegación
- Oportunidades perdidas de flujos de datos integrados
- Mayor complejidad cognitiva para el usuario

**Propuesta:** Reestructurar la arquitectura para que **Proyectos** actúe como contenedor padre de 16 submódulos, unificando el contexto, los filtros y los flujos de datos.

---

## 2. Arquitectura Actual del Sistema

### 2.1 Mapa de Módulos Actual (Plano)

```
Dashboard ──────────────────────────────────────────────────────────────
├── Proyectos (independiente)
├── Presupuestos (independiente)
├── Seguimiento (independiente, filtro proyecto)
├── Financiero (independiente)
├── RRHH (independiente)
├── Bodega (independiente, filtro proyecto en OC)
├── CRM (independiente)
├── APU Avanzado (independiente, filtro proyecto)
├── Base Precios (independiente)
├── Muro Obra (independiente, filtro proyecto)
├── Órdenes de Cambio (independiente, filtro proyecto)
├── Notificaciones (independiente)
├── SSO y Calidad (independiente, filtro proyecto)
├── Gestión Documental (independiente, filtro proyecto)
├── Visor BIM (independiente, filtro proyecto)
├── Dashboard Predictivo (independiente)
├── Exportación Inteligente (independiente)
├── Logística Compras (independiente, filtro proyecto)
├── Rendimiento Campo (independiente, filtro proyecto)
├── Comercial Finanzas (independiente)
├── Administración (independiente)
├── Planilla Destajos (independiente, filtro proyecto)
├── Impuestos (independiente)
├── Entradas Almacén (independiente, filtro proyecto)
├── Ajustes (independiente)
├── Hitos (independiente, filtro proyecto)
├── Riesgos (independiente, filtro proyecto)
├── Cuentas Cobrar (independiente)
├── Cuentas Pagar (independiente)
├── Cotizaciones (independiente)
├── Plantillas (independiente)
├── Analytics Proveedores (independiente)
├── Error Log (independiente)
├── Activos (independiente)
├── Cuadros Comparativos (independiente)
├── Profitability (independiente)
├── Weather (independiente)
```

### 2.2 Problema: 16 Módulos con Filtro Proyecto Duplicado

**16 de 38 pantallas** tienen su propio selector/filtro de proyecto (`ProyectoFilter`, `selectedProyectoId`, `selProyecto`, etc.) implementado de forma independiente:

| Módulo | Tipo de Filtro | Líneas de Código | Estado Actual |
|--------|---------------|-------------------|---------------|
| Presupuestos | `proyectoFilter` + selector | ~600 | ✅ Independiente |
| Seguimiento | `selectedProyectoId` | ~500 | ✅ Independiente |
| APU Avanzado | `proyectoId` selector | ~641 | ✅ Independiente |
| Bodega (OC) | `selectedProyectoId` | ~400 | ✅ Independiente |
| Muro Obra | `proyectoFilter` | ~500 | ✅ Independiente |
| Órdenes Cambio | `selectedProyectoId` | ~400 | ✅ Independiente |
| SSO Calidad | `proyectoFilter` | ~350 | ✅ Independiente |
| Gestión Documental | `selProyecto` | ~536 | ✅ Independiente |
| Visor BIM | `proyectoFilter` | ~400 | ✅ Independiente |
| Rendimiento Campo | `proyectoFilter` | ~268 | ✅ Independiente |
| Planilla Destajos | `proyectoFilter` | ~344 | ✅ Independiente |
| Entradas Almacén | `selectedProyectoId` | ~242 | ✅ Independiente |
| Hitos | `selectedProyectoId` | ~400 | ✅ Independiente |
| Riesgos | `proyectoFilter` | ~350 | ✅ Independiente |
| Logística Compras | `selectedProyectoId` | ~400 | ✅ Independiente |
| Dashboard Predictivo | `selectedProyectoId` | ~300 | ✅ Independiente |

### 2.3 Flujo de Datos Actual (Fragmentado)

```
Usuario → Sidebar → Selecciona Módulo
  → Cada módulo filtra proyecto INDEPENDIENTEMENTE
  → Datos duplicados en memoria
  → Sin contexto compartido de navegación
  → El usuario debe re-seleccionar proyecto en cada módulo
```

### 2.4 Store Context: Capa Compartida (Correcto)

El store centralizado (`useErp()`) es el acierto arquitectónico principal. Todos los módulos consumen datos de una sola fuente:

```
ErpProvider
  ├── useErpStore() (Zustand) → Estado global
  ├── loadFromStorage() (localStorage + Zod)
  ├── forceSync() (Supabase bidireccional)
  └── React Context (view, user, isOnline, ...)
```

**Problema:** El store no expone un `currentProjectId` global que unifique el contexto. Cada módulo gestiona su propio estado de filtro localmente.

---

## 3. Análisis de Integración entre Módulos

### 3.1 Matriz de Relaciones Lógicas

| Módulo Principal | Módulos Relacionados | Tipo de Relación | Prioridad Integración |
|-----------------|---------------------|------------------|----------------------|
| **Proyectos** | Presupuestos | 1:N (proyecto→presupuestos) | 🔴 Alta |
| **Proyectos** | Seguimiento | 1:1 (proyecto→avance) | 🔴 Alta |
| **Proyectos** | Hitos | 1:N (proyecto→hitos) | 🔴 Alta |
| **Proyectos** | Riesgos | 1:N (proyecto→riesgos) | 🔴 Alta |
| **Proyectos** | Órdenes Cambio | 1:N (proyecto→OC) | 🔴 Alta |
| **Proyectos** | Muro Obra | 1:N (proyecto→publicaciones) | 🔴 Alta |
| **Proyectos** | APU Avanzado | 1:N (proyecto→APUs) | 🟡 Media |
| **Proyectos** | Gestión Documental | 1:N (proyecto→documentos) | 🔴 Alta |
| **Proyectos** | Visor BIM | 1:1 (proyecto→modelo BIM) | 🟡 Media |
| **Proyectos** | SSO Calidad | 1:N (proyecto→calidad) | 🔴 Alta |
| **Proyectos** | Rendimiento Campo | 1:N (proyecto→rendimiento) | 🟡 Media |
| **Proyectos** | Planilla Destajos | 1:N (proyecto→destajos) | 🟡 Media |
| **Proyectos** | Entradas Almacén | 1:N (proyecto→OC→entradas) | 🔴 Alta |
| **Proyectos** | Bodega (OC) | N:N (proyecto←→OC) | 🔴 Alta |
| **Proyectos** | Logística Compras | 1:N (proyecto→compras) | 🟡 Media |
| **Proyectos** | Presupuestos→APU | 1:N (presupuesto→APU) | 🟡 Media |
| **Presupuestos** | Bodega (Materiales) | N:N (presupuesto→materiales) | 🟡 Media |
| **CRM** | Cotizaciones | 1:N (licitación→cotización) | 🔴 Alta |
| **Cotizaciones** | Presupuestos | 1:1 (cotización→presupuesto) | 🔴 Alta |
| **Bodega** | Logística Compras | 1:N (bodega→compras) | 🟡 Media |
| **Bodega** | Entradas Almacén | 1:N (OC→entradas) | 🔴 Alta |
| **Bodega** | Planilla Destajos | N:N (materiales→destajos) | 🟢 Baja |
| **Financiero** | Cuentas Cobrar | 1:N (finanzas→cobranza) | 🔴 Alta |
| **Financiero** | Cuentas Pagar | 1:N (finanzas→pagos) | 🔴 Alta |
| **Financiero** | Ordenes Cambio | 1:N (OC→impacto financiero) | 🟡 Media |
| **Financiero** | Profitability | 1:N (finanzas→rentabilidad) | 🔴 Alta |
| **RRHH** | Planilla Destajos | 1:N (empleados→destajos) | 🟡 Media |
| **Dashboard** | Todos | Agregación de KPIs | 🔴 Alta |

### 3.2 Oportunidades de Integración Identificadas

#### Oportunidad 1: Contexto de Proyecto Global 🔴
**Problema:** 16 módulos duplican filtro `proyectoId`.
**Solución:** Añadir `currentProjectId` al store global. Al navegar a cualquier submódulo de proyecto, el filtro se hereda automáticamente.

#### Oportunidad 2: Flujo CRM → Cotización → Presupuesto 🔴
**Problema:** El pipeline comercial está fragmentado en 3 pantallas independientes.
**Solución:** Un flujo continuo CRM → Cotización → Presupuesto con datos pre-rellenados.

#### Oportunidad 3: Presupuesto → APU → Materiales → Bodega 🟡
**Problema:** Los APU y materiales creados en presupuestos no se sincronizan automáticamente con la base de precios y bodega.
**Solución:** Al aprobar un presupuesto, los materiales nuevos se añaden automáticamente a `BasePrecios` y `Bodega`.

#### Oportunidad 4: Bodega → OC → Entradas → Pagos 🔴
**Problema:** Flujo de compras fragmentado entre Bodega, Logística, EntradasAlmacen y CuentasPagar.
**Solución:** Vista unificada "Ciclo de Compra" que integre OC → Recepción → Validación → Pago.

#### Oportunidad 5: Proyecto → Hitos → Riesgos → Órdenes Cambio 🔴
**Problema:** Estas 3 pantallas están desconectadas entre sí, pero los hitos afectan riesgos, y los riesgos generan órdenes de cambio.
**Solución:** Vista integrada de "Salud del Proyecto" que correlacione hitos vencidos con riesgos materializados y OC generadas.

---

## 4. Plan de Reestructuración: Proyectos como Eje Central

### 4.1 Nueva Jerarquía de Navegación

```
Sidebar
├── 📊 Dashboard (global)
├── 📋 Proyectos ← EJE CENTRAL
│   ├── 📝 Información General
│   ├── 💰 Presupuestos
│   │   ├── 📋 Presupuesto Principal
│   │   └── 🔧 APU Avanzado
│   ├── 📈 Seguimiento (Curva S, EVM)
│   ├── 📅 Hitos y Calendario
│   ├── ⚠️ Riesgos
│   ├── 🔄 Órdenes de Cambio
│   ├── 📁 Gestión Documental
│   ├── 🏗️ SSO y Calidad
│   ├── 📐 Visor BIM
│   ├── 💬 Muro de Obra
│   ├── 📦 Materiales y Compras
│   │   ├── 🏪 Bodega
│   │   ├── 🚚 Logística Compras
│   │   └── 📥 Entradas Almacén
│   ├── 👷 Rendimiento de Campo
│   ├── 📋 Planilla de Destajos
│   └── 📤 Exportación Inteligente
├── 🤝 CRM y Ventas
│   ├── 🎯 CRM (Licitaciones)
│   └── 💼 Cotizaciones
├── 💳 Finanzas
│   ├── 💵 Financiero (Movimientos)
│   ├── 💰 Cuentas por Cobrar
│   ├── 💸 Cuentas por Pagar
│   ├── 📊 Profitability Analytics
│   └── 🧾 Impuestos
├── 👥 RRHH
├── 🏗️ Base de Precios
├── 📋 Plantillas de Proyectos
├── 📊 Dashboard Predictivo
├── 🔧 Administración
│   ├── ⚙️ Ajustes
│   ├── 📝 Error Log
│   ├── 📋 Auditoría
│   └── 🔐 Administración
├── 📤 Exportación Global
└── 🌤️ Weather
```

### 4.2 Nuevo Store Context: Proyecto Activo

```typescript
// En store.tsx — nuevo estado global
interface ErpContextValue {
  // ... existente
  currentProjectId: string | null;
  setCurrentProject: (id: string | null) => void;
  currentProject: Proyecto | null; // derivado
  // ... resto
}

// Los submódulos de proyecto leen currentProjectId automáticamente
// en vez de tener su propio filtro local
```

### 4.3 Esquema de Rutas Anidadas

```typescript
// En AppLayout.tsx — rutas anidadas mediante view:subview
SCREEN_KEYS = [
  'dashboard',
  'proyectos',                    // Lista de proyectos (hub)
  'proyectos:presupuestos',       // Subvista de proyecto:Presupuestos
  'proyectos:apu',                // Subvista de proyecto:APU
  'proyectos:seguimiento',        // Subvista de proyecto:Seguimiento
  'proyectos:hitos',              // Subvista de proyecto:Hitos
  'proyectos:riesgos',            // Subvista de proyecto:Riesgos
  'proyectos:ordenes-cambio',     // Subvista de proyecto:OC
  'proyectos:documentos',         // Subvista de proyecto:Documentos
  'proyectos:sso-calidad',        // Subvista de proyecto:SSO
  'proyectos:visor-bim',          // Subvista de proyecto:BIM
  'proyectos:muro',               // Subvista de proyecto:Muro
  'proyectos:bodega',             // Subvista de proyecto:Bodega
  'proyectos:logistica',          // Subvista de proyecto:Logística
  'proyectos:entradas-almacen',   // Subvista de proyecto:Entradas
  'proyectos:rendimiento-campo',  // Subvista de proyecto:Rendimiento
  'proyectos:planilla-destajos',  // Subvista de proyecto:Destajos
  'proyectos:exportacion',        // Subvista de proyecto:Exportación
  'crm',                          // Independiente
  'cotizaciones',                 // Independiente
  'financiero',                   // Independiente
  'cuentas-cobrar',               // Independiente
  'cuentas-pagar',                // Independiente
  'profitability',                // Independiente
  'impuestos',                    // Independiente
  'rrhh',                         // Independiente
  'baseprecios',                  // Independiente
  'plantillas',                   // Independiente
  'predictivo',                   // Independiente
  'admin-sistema',                // Independiente
  'ajustes',                      // Independiente
  'error-log',                    // Independiente
  'exportacion',                  // Independiente
  'weather',                      // Independiente
  // ... resto
] as const;
```

### 4.4 Sidebar Jerárquico

```typescript
// Sidebar.tsx — estructura jerárquica
const ITEMS: SidebarItem[] = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'proyectos', icon: Building2, label: 'Proyectos', 
    children: [
      { key: 'proyectos:informacion', icon: Info, label: 'Información General' },
      { key: 'proyectos:presupuestos', icon: DollarSign, label: 'Presupuestos',
        children: [
          { key: 'proyectos:presupuestos', icon: FileText, label: 'Presupuesto' },
          { key: 'proyectos:apu', icon: Calculator, label: 'APU Avanzado' },
        ]
      },
      { key: 'proyectos:seguimiento', icon: TrendingUp, label: 'Seguimiento' },
      { key: 'proyectos:hitos', icon: Calendar, label: 'Hitos' },
      { key: 'proyectos:riesgos', icon: AlertTriangle, label: 'Riesgos' },
      { key: 'proyectos:ordenes-cambio', icon: RefreshCw, label: 'Órdenes de Cambio' },
      // ...
    ]
  },
  // ...
];
```

---

## 5. Refactorización y Optimización del Código

### 5.1 Fase 1: Extracción de Componentes del Módulo Proyectos (Ejecutado Parcialmente)

**Estado actual:** Los siguientes componentes YA existen separados:
- `ProyectoCard.tsx` ✅
- `ProyectoListItem.tsx` ✅
- `ProyectoForm.tsx` ✅
- `ProyectoPauseModal.tsx` ✅
- `ProyectoStateBadge.tsx` ✅
- `ProyectoProgress.tsx` ✅
- `ProyectoActions.tsx` ✅
- `ProyectosKPI.tsx` ✅
- `ProyectosToolbar.tsx` ✅

**Pendiente:**
- `ProyectoList.tsx` — Contenedor grid/list con ordenamiento y filtrado
- `ProyectoDetail.tsx` — Vista de detalle de proyecto con tabs a submódulos
- Integrar `ProyectoFilter` (actualmente en `components/`) al store global

### 5.2 Fase 2: Eliminación de Código Muerto y Duplicación

| Archivo | Problema | Acción |
|---------|----------|--------|
| `src/erp/store/proyectoStateMachine.ts` | Dead code (176 líneas, nunca importado) | ❌ Eliminar |
| `estadoColor` en Proyectos.tsx + HeatMap.tsx | Duplicado | ✅ Mover a `proyectoColors.ts` |
| `lat`/`lng` vs `latitud`/`longitud` en types.ts | Duplicado de campos | ❌ Eliminar `latitud`/`longitud` |
| `proyectos_eliminados` en es.json línea 764 | Duplicado | ❌ Eliminar |
| `reglasFactores.ts` bypass de mutation queue | Arquitectura inconsistente | ♻️ Refactorizar a queue-first |
| 3 service files con patrón inconsistente | Arquitectura inconsistente | ♻️ Refactorizar a queue-first |

### 5.3 Fase 3: Estructura de Archivos Propuesta

```
src/erp/
├── store/
│   ├── schemas/              # ✅ Mantener (17 archivos canónicos)
│   ├── zustandStore.ts       # ✅ Mantener (~1725 líneas)
│   └── store.tsx             # ✅ Mantener (~723 líneas, + currentProjectId)
├── screens/
│   ├── Proyectos.tsx         # ♻️ Refactorizar (632→~250 líneas orquestador)
│   ├── proyectos/            # 🆕 Submódulos anidados bajo Proyectos
│   │   ├── PresupuestosView.tsx    # 🆕 Wrapper con contexto de proyecto
│   │   ├── SeguimientoView.tsx     # 🆕 Wrapper
│   │   ├── HitosView.tsx           # 🆕 Wrapper
│   │   ├── RiesgosView.tsx         # 🆕 Wrapper
│   │   ├── OrdenesCambioView.tsx   # 🆕 Wrapper
│   │   ├── GestionDocumentalView.tsx # 🆕 Wrapper
│   │   ├── SSOCalidadView.tsx      # 🆕 Wrapper
│   │   ├── VisorBIMView.tsx        # 🆕 Wrapper
│   │   ├── MuroObraView.tsx        # 🆕 Wrapper
│   │   ├── RendimientoCampoView.tsx # 🆕 Wrapper
│   │   ├── PlanillaDestajosView.tsx # 🆕 Wrapper
│   │   └── ExportacionView.tsx     # 🆕 Wrapper
│   ├── CRM.tsx               # ✅ Mantener independiente
│   ├── Cotizaciones.tsx      # ✅ Mantener independiente
│   ├── Financiero.tsx        # ✅ Mantener independiente
│   ├── Bodega.tsx            # ♻️ Mover a proyectos:bodega
│   ├── LogisticaCompras.tsx  # ♻️ Mover a proyectos:logistica
│   ├── EntradasAlmacenOC.tsx # ♻️ Mover a proyectos:entradas-almacen
│   ├── APUAvanzado.tsx       # ♻️ Mover a proyectos:apu
│   ├── BasePrecios.tsx       # ✅ Mantener independiente
│   ├── RRHH.tsx              # ✅ Mantener independiente
│   ├── CuentasCobrar.tsx     # ♻️ Mover bajo Financiero
│   ├── CuentasPagar.tsx      # ♻️ Mover bajo Financiero
│   ├── ProfitabilityAnalytics.tsx # ♻️ Mover bajo Financiero
│   ├── Impuestos.tsx         # ♻️ Mover bajo Financiero
│   ├── DashboardPredictivo.tsx # ✅ Mantener independiente
│   ├── ExportacionInteligente.tsx # ♻️ Mover a global
│   ├── ComercialFinanzas.tsx # ♻️ Unificar con CRM+Cotizaciones
│   ├── PlantillasProyectos.tsx # ✅ Mantener independiente
│   ├── ProveedorAnalytics.tsx # ♻️ Mover bajo Bodega/Compras
│   ├── Activos.tsx           # ✅ Mantener independiente
│   ├── Cuadros.tsx           # ♻️ Mover bajo Cotizaciones
│   ├── Notificaciones.tsx    # ✅ Mantener independiente (global)
│   ├── ErrorLog.tsx          # ♻️ Mover bajo Administración
│   ├── Administracion.tsx    # ✅ Mantener (hub admin)
│   ├── Ajustes.tsx           # ♻️ Mover bajo Administración
│   ├── Auditoria.tsx         # ♻️ Mover bajo Administración
│   ├── Weather.tsx           # 🆕 Dashboard widget
│   └── Login.tsx             # ✅ Mantener
├── components/
│   ├── proyectos/            # ✅ Mantener (10 componentes)
│   ├── Sidebar.tsx           # ♻️ Refactorizar a jerárquico
│   ├── Header.tsx            # ♻️ Añadir breadcrumb de proyecto activo
│   └── ...                   # ✅ Mantener resto
├── utils/
│   ├── proyectoColors.ts     # ✅ Existente
│   └── ...                   # ✅ Mantener
└── ui.ts                     # ♻️ Añadir constantes de navegación jerárquica
```

### 5.4 Patrón de Wrapper para Submódulos

Cada submódulo de proyecto se envuelve en un HOC `withProjectContext` que:

```typescript
// withProjectContext.tsx
const withProjectContext = (Component: React.FC, options: { required: boolean }) => {
  return (props: any) => {
    const { currentProjectId, currentProject } = useErp();
    
    if (!currentProjectId && options.required) {
      return <ProjectRequiredMessage />;
    }
    
    return (
      <div className="space-y-4">
        {/* Breadcrumb contextual: Proyecto > Submódulo */}
        <ProjectBreadcrumb 
          proyecto={currentProject}
          submodulo={options.label}
        />
        {/* Filtro rápido de proyecto (solo si required=false) */}
        {!options.required && <ProjectQuickFilter />}
        {/* Componente con proyectoId como prop implícito */}
        <Component 
          {...props} 
          proyectoId={currentProjectId}
          proyecto={currentProject}
        />
      </div>
    );
  };
};
```

### 5.5 Optimización de Bundle

| Estrategia | Impacto Estimado | Prioridad |
|------------|-----------------|-----------|
| Lazy loading de submódulos de proyecto | ~200KB menos en carga inicial | 🔴 Alta |
| Chunk separado para each submódulo de proyecto | ~50KB por submódulo, carga bajo demanda | 🔴 Alta |
| Eliminación de código muerto (`proyectoStateMachine.ts`) | ~5KB | 🟡 Media |
| Web Worker para compresión lz-string | Liberar main thread ~100ms | 🟡 Media |
| Virtual scrolling en Bodega y Movimientos (>1000 rows) | Reducir DOM nodes ~90% | 🟡 Media |

---

## 6. Rediseño de UX/UI y Entrada de Datos

### 6.1 Principios de Diseño

1. **Contexto de Proyecto Siempre Visible:** Header muestra proyecto activo con breadcrumb
2. **Navegación Jerárquica:** Sidebar colapsable con sub-niveles animados
3. **Entrada de Datos Unificada:** Formularios consistentes con Zod + react-hook-form
4. **Feedback Visual Inmediato:** Skeleton loading + transiciones + toast notifications
5. **Modo Offline Transparente:** Indicador de sincronización + cola de pendientes

### 6.2 Rediseño del Header

```
┌──────────────────────────────────────────────────────────────┐
│ [☰] CONSTRUSMART ERP    [🏗️ Proyecto Activo ▼]    [🔔 3] [👤]│
│ ─────────────────────────────────────────────────────────────  │
│ ERP / Proyectos / [Nombre Proyecto] / Presupuestos           │
└──────────────────────────────────────────────────────────────┘
```

**Nuevo componente `ProjectBreadcrumb`:**
```typescript
interface ProjectBreadcrumbProps {
  proyecto: Proyecto | null;
  submodulo: string;
  onNavigate: (path: string) => void;
}
```

### 6.3 Vista de Detalle de Proyecto (Hub)

Al hacer clic en un proyecto desde la lista, se navega a una vista de detalle con tabs:

```
┌──────────────────────────────────────────────────────────┐
│ ← Volver a Proyectos                                     │
│                                                          │
│ 🏗️ [Nombre Proyecto]           [🔵 Ejecución] [🏠 Residencial]│
│ Cliente: [Nombre] · Presupuesto: Q157.3M · Avance: 34%  │
│                                                          │
│ ┌─ Tabs ────────────────────────────────────────────────┐│
│ │ 📝 Info │ 💰 Presupuesto │ 📈 Seguimiento │ 📅 Hitos ││
│ │ ⚠️ Riesgos │ 🔄 OC │ 📁 Docs │ 🏗️ SSO │ 📐 BIM │ ││
│ │ 💬 Muro │ 📦 Materiales │ 👷 Rendimiento │ 📋 Destajos││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ ┌─ Contenido del Tab Activo ───────────────────────────┐│
│ │                                                       ││
│ │ (Renderiza el submódulo correspondiente)              ││
│ │                                                       ││
│ └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### 6.4 Unificación de Formularios

**Estándar de Formulario:**

```typescript
// Patrón unificado para todos los formularios
interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, name, required, error, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={name} className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
      {label}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-destructive mt-0.5">{error}</p>}
  </div>
);
```

**Secciones Colapsables:**
```typescript
interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}
// Implementado con transición de altura animada
```

### 6.5 Dashboard de Proyecto (Vista General)

Al entrar a un proyecto, una vista de dashboard específica con:

```
┌─ KPIs del Proyecto ──────────────────────────────────────────┐
│ [✅ Presupuesto Q157.3M] [📊 Avance 34%] [📅 Hitos 5/8]     │
│ [⚠️ Riesgos 3 Altos] [💰 Margen 6.5%] [📦 OC Pendientes 2]  │
└──────────────────────────────────────────────────────────────┘

┌─ Gráficos ──────────────────── ┌─ Alertas ─────────────────┐
│ 📈 Curva S (EVM)              │ ⚠️ Hito "Cimentación"     │
│ 📊 Presupuesto vs Real        │    vencido hace 3 días     │
│ 📉 Cash Flow Proyectado       │ 🚨 Stock crítico: Cemento │
└─────────────────────────────── └───────────────────────────┘

┌─ Timeline ───────────────────────────────────────────────────┐
│ ● Hito 1 ✅  ● Hito 2 ✅  ● Hito 3 ⏳  ● Hito 4 🔴  ● Hito 5 ⏳│
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Mejoras Funcionales Estratégicas

### 7.1 Flujo Comercial Unificado (CRM → Cotización → Presupuesto)

**Estado Actual:** 3 pantallas independientes con datos que deben fluir secuencialmente.

**Propuesta:**
```
CRM (Licitación) → Cotización Cliente → Presupuesto Técnico → Proyecto
      ↓                   ↓                       ↓
  Oportunidad        Documento              APU + Materiales
  Identificada       Comercial              + Sobrecostos
```

**Implementación:**
```typescript
// Nuevo: conversión one-click
const convertirLicitacionACotizacion = (licitacionId: string) => {
  const licitacion = licitaciones.find(l => l.id === licitacionId);
  // Pre-rellena cotización con datos del cliente
  addCotizacion({
    cliente: licitacion.cliente,
    proyectoId: licitacion.proyectoId,
    // ...
  });
};

const convertirCotizacionAPresupuesto = (cotizacionId: string) => {
  const cotizacion = cotizaciones.find(c => c.id === cotizacionId);
  // Crea presupuesto con renglones de la cotización
  addPresupuesto({
    proyectoId: cotizacion.proyectoId,
    montoReferencia: cotizacion.montoTotal,
    // ...
  });
};
```

### 7.2 Ciclo de Compra Integrado (OC → Recepción → Pago)

**Estado Actual:** Fragmentado entre Bodega, Logística, EntradasAlmacen, CuentasPagar.

**Propuesta:**
```
Solicitud Compra → OC → Recepción Almacén → Validación → Programación Pago → Pago
      ↓                ↓         ↓               ↓               ↓              ↓
  Presupuesto     Proveedor   Entrada         Factura        CuentasPagar    Movimiento
```

**Implementación:**
```typescript
// Vista unificada "Ciclo de Compra"
interface CicloCompraItem {
  ordenId: string;
  proveedor: string;
  monto: number;
  estado: 'solicitado' | 'aprobado' | 'enviado' | 'recibido_parcial' | 'recibido' | 'facturado' | 'pagado';
  fechaEstimada: string;
  recepcion?: RecepcionAlmacen;
  pago?: CuentaPagar;
}
```

### 7.3 Salud del Proyecto (Hitos + Riesgos + OC)

**Estado Actual:** 3 pantallas independientes.

**Propuesta:**
```typescript
// Correlación automática
interface SaludProyecto {
  hitosVencidos: Hito[];
  riesgosCriticos: Riesgo[];
  ocSinAprobar: OrdenCambio[];
  impactoFinanciero: number; // suma de OC × probabilidad riesgo
  semaforo: 'verde' | 'amarillo' | 'rojo';
}
```

### 7.4 Exportación Unificada

**Estado Actual:** pantalla independiente `ExportacionInteligente.tsx`. 
**Propuesta:** Botón de exportación en cada submódulo + exportación global.

### 7.5 Panel de Control Predictivo Integrado

**Estado Actual:** `DashboardPredictivo.tsx` independiente.
**Propuesta:** Widget predictivo dentro del Dashboard principal + dashboard de proyecto.

### 7.6 Reportería Automática por Proyecto

```typescript
// Generación automática de reportes
interface ReporteProyecto {
  proyecto: Proyecto;
  presupuesto: Presupuesto;
  avance: AvanceObra;
  hitos: Hito[];
  riesgos: Riesgo[];
  oc: OrdenCambio[];
  finanzas: {
    movimientos: Movimiento[];
    cuentasCobrar: CuentaCobrar[];
    cuentasPagar: CuentaPagar[];
  };
}

const generarReporteEjecutivo = (proyectoId: string): ReporteProyecto => {
  // Agrega datos de múltiples stores
  // Genera PDF/XLSX con jspdf + xlsx
};
```

---

## 8. Roadmap de Implementación

### Fase 1: Foundation (Sprint 1-2) 🎯

| Tarea | Esfuerzo | Dependencias |
|-------|----------|-------------|
| Añadir `currentProjectId` al store global | 4h | Ninguna |
| Crear `withProjectContext` HOC | 3h | Store |
| Refactorizar Sidebar a jerárquico | 8h | Diseño UX |
| Añadir breadcrumb de proyecto en Header | 4h | Store |
| Eliminar `proyectoStateMachine.ts` | 1h | Ninguna |
| Crear `ProyectoList.tsx` | 4h | Componentes existentes |
| Eliminar duplicados i18n + types | 2h | Ninguna |

### Fase 2: Migración de Submódulos (Sprint 3-4) 🏗️

| Tarea | Esfuerzo | Dependencias |
|-------|----------|-------------|
| Migrar Hitos → `proyectos:hitos` | 4h | Fase 1 |
| Migrar Riesgos → `proyectos:riesgos` | 4h | Fase 1 |
| Migrar Órdenes Cambio → `proyectos:ordenes-cambio` | 4h | Fase 1 |
| Migrar Muro Obra → `proyectos:muro` | 4h | Fase 1 |
| Migrar Seguimiento → `proyectos:seguimiento` | 4h | Fase 1 |
| Migrar Gestión Documental → `proyectos:documentos` | 4h | Fase 1 |
| Migrar SSO Calidad → `proyectos:sso-calidad` | 4h | Fase 1 |
| Migrar Visor BIM → `proyectos:visor-bim` | 2h | Fase 1 |

### Fase 3: Módulos de Materiales y Campo (Sprint 5-6) 🔧

| Tarea | Esfuerzo | Dependencias |
|-------|----------|-------------|
| Migrar APU Avanzado → `proyectos:apu` | 4h | Fase 1 |
| Migrar Bodega → `proyectos:bodega` | 6h | Fase 1 |
| Migrar Logística Compras → `proyectos:logistica` | 4h | Fase 1 |
| Migrar Entradas Almacén → `proyectos:entradas-almacen` | 3h | Fase 1 |
| Migrar Rendimiento Campo → `proyectos:rendimiento-campo` | 4h | Fase 1 |
| Migrar Planilla Destajos → `proyectos:planilla-destajos` | 4h | Fase 1 |
| Migrar Exportación → `proyectos:exportacion` | 3h | Fase 1 |

### Fase 4: Refinanciero y Comercial (Sprint 7-8) 💰

| Tarea | Esfuerzo | Dependencias |
|-------|----------|-------------|
| Unificar Financiero + CuentasCobrar + CuentasPagar | 8h | Fase 1 |
| Integrar Profitability bajo Financiero | 4h | Fase 1 |
| Integrar Impuestos bajo Financiero | 3h | Fase 1 |
| Flujo CRM → Cotización → Presupuesto | 8h | Fase 1 |
| Mover Cuadros bajo Cotizaciones | 2h | Fase 1 |
| Mover ProveedorAnalytics bajo Bodega/Compras | 4h | Fase 1 |

### Fase 5: Dashboard de Proyecto y Reportes (Sprint 9-10) 📊

| Tarea | Esfuerzo | Dependencias |
|-------|----------|-------------|
| Vista dashboard de proyecto con KPIs | 8h | Fase 2-3 |
| Panel "Salud del Proyecto" (Hitos+Riesgos+OC) | 6h | Fase 2 |
| Ciclo de Compra Integrado | 8h | Fase 3 |
| Reporte ejecutivo automático PDF/XLSX | 6h | Fase 2-3 |
| Widget predictivo en dashboard | 4h | Fase 4 |

### Fase 6: Optimización y Pulido (Sprint 11-12) ✨

| Tarea | Esfuerzo | Dependencias |
|-------|----------|-------------|
| Eliminación de código muerto (3 service files) | 4h | Fase 1-5 |
| Virtual scrolling en tablas grandes | 6h | Fase 2-3 |
| Web Worker para compresión | 4h | Ninguna |
| Tests de integración para nuevo routing | 8h | Fase 2-3 |
| Pruebas E2E en Playwright | 8h | Fase 2-5 |

---

## 9. Métricas de Éxito

| Métrica | Valor Actual | Objetivo | Cómo se Mide |
|---------|-------------|----------|-------------|
| Pantallas al mismo nivel | 38 | 22 (16 anidadas) | Conteo en SCREEN_KEYS |
| Módulos con filtro proyecto duplicado | 16 | 0 (hereda de store) | Búsqueda de `ProyectoFilter` |
| Líneas en Proyectos.tsx | 632 | ≤250 | `wc -l` |
| Componentes extraídos | 0 | ≥16 | Conteo en `components/proyectos/` |
| Tamaño chunk inicial | ~1.2MB | ~800KB | Build analyze |
| Tests | 637 | 700+ | `vitest run` |
| Tiempo de build | ~22s | ~18s | `npm run build` |
| Navegación entre submódulos | 2 clicks | 1 click | UX audit |
| Contexto de proyecto persistente | No | Sí | Validación manual |
| Flujo CRM→Cotización→Presupuesto | Manual | 1 click | Validación manual |

---

## 10. Conclusiones

1. **La arquitectura offline-first con store centralizado es correcta** y debe mantenerse como fundamento.

2. **El principal problema es la fragmentación de navegación:** 16 módulos relacionados con proyectos operan al mismo nivel jerárquico, obligando al usuario a re-seleccionar el proyecto en cada uno.

3. **La solución propuesta (jerarquía de navegación + contexto de proyecto global) reduce la fricción cognitiva** y prepara el sistema para flujos de datos integrados (CRM→Cotización→Presupuesto, OC→Recepción→Pago).

4. **El esfuerzo total estimado es de ~12 sprints (12 semanas)** para completar las 6 fases, con entregables incrementales en cada fase.

5. **El riesgo de regresión es bajo** porque los cambios son principalmente de navegación y contexto, no de lógica de negocio. El store centralizado y los tests existentes (637) protegen contra regresiones.

6. **Beneficio esperado:** Reducción del 30-40% en el tiempo de navegación del usuario, eliminación de ~800 líneas de código duplicado, y mejora significativa en la coherencia de la experiencia de usuario.

---

*Documento generado el 2026-08-07 — Análisis Arquitectónico Integral de CONSTRUSMART ERP*