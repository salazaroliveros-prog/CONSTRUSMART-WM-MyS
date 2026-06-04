# 📐 PLAN DE REORGANIZACIÓN Y ROADMAP COMPLETO

> **Fecha:** 06/04/2026
> **Build:** ✅ Exitoso | **Tests:** ✅ 10/10 | **Cobertura actual:** ~66%

---

## 1. 🏗️ REORGANIZACIÓN DEL MENÚ LATERAL

### Problema actual: 30 items en el sidebar → sobrecarga cognitiva

### Propuesta: Agrupar en 8 módulos principales con subvistas

```
┌─────────────────────────────────────┐
│  📊 TABLERO                         │  ← Dashboard + Predictivo + Reportes
├─────────────────────────────────────┤
│  🏗️ PROYECTOS                       │  ← Proyectos, Presupuestos, APU, Seguimiento,
│  ├── Proyectos                      │     Curvas S, Rendimientos, Hitos, Riesgos
│  ├── Presupuestos + APU             │
│  ├── Seguimiento + Curvas S         │
│  ├── Rendimientos                   │
│  ├── Hitos del Proyecto             │
│  └── Gestión de Riesgos             │
├─────────────────────────────────────┤
│  💰 FINANZAS                         │  ← Financiero, Impuestos, Comercial/Fin
│  ├── Control Financiero             │
│  ├── Impuestos                      │
│  └── Comercial/Finanzas             │
├─────────────────────────────────────┤
│  📦 BODEGA Y LOGÍSTICA              │  ← Bodega, Logística, Base Precios,
│  ├── Inventario (Bodega)            │     Entradas Almacén
│  ├── Logística y Compras            │
│  ├── Base de Precios                │
│  └── Entradas Almacén               │
├─────────────────────────────────────┤
│  👷 RRHH Y CAMPO                    │  ← RRHH, Planilla Destajos, Rendimiento Campo
│  ├── Recursos Humanos               │
│  ├── Planilla por Destajos          │
│  └── Rendimiento en Campo           │
├─────────────────────────────────────┤
│  ✅ CALIDAD Y DOCUMENTOS            │  ← SSO, Muro Obra, Órdenes Cambio,
│  ├── SSO & Calidad                  │     Gestión Documental
│  ├── Muro de Obra                   │
│  ├── Órdenes de Cambio              │
│  └── Documentos y Planos            │
├─────────────────────────────────────┤
│  🔧 ADMINISTRACIÓN                  │  ← Admin, CRM, Notificaciones
│  ├── Administración del Sistema     │
│  ├── CRM (Clientes)                 │
│  └── Notificaciones                 │
├─────────────────────────────────────┤
│  🛠️ HERRAMIENTAS                    │  ← Visor BIM, Exportación, Base Precios
│  ├── Visor BIM                      │
│  └── Exportación Inteligente        │
└─────────────────────────────────────┘
```

### Beneficios:
- De **30 items** a **8 grupos** (reducción del 73%)
- Navegación más intuitiva por área de negocio
- Cada grupo tiene máximo 4-6 sub-opciones
- Fácil de escalar agregando subvistas sin saturar el menú

---

## 2. 📋 LISTADO COMPLETO DE IMPLEMENTACIONES FALTANTES

### 2.1 🔴 Prioridad Alta — Impactan directamente la cobertura

| # | Función faltante | Área | Impacto | Archivos necesarios |
|---|---|---|---|---|
| **F-01** | Screen de Cuentas por Cobrar | Financiero | +5% | `src/erp/screens/CuentasCobrar.tsx` |
| **F-02** | Screen de Cuentas por Pagar | Financiero | +4% | `src/erp/screens/CuentasPagar.tsx` |
| **F-03** | Vinculación empleado ↔ proyecto con fechas | Seguimiento | +3% | `store.tsx` - fechaAsignacion en Empleado |
| **F-04** | Cálculo automático de avance financiero | Seguimiento | +3% | `store.tsx` - derivado de movimientos |
| **F-05** | Reporte financiero EERR exportable | Financiero | +3% | `ExportacionInteligente.tsx` - nuevo template |
| **F-06** | Dependencias funcionales en Gantt | Cronograma | +3% | `PertGanttChart.tsx` - usar predecesores |

### 2.2 🟡 Prioridad Media — Mejoran procesos existentes

| # | Función faltante | Área | Impacto | Archivos necesarios |
|---|---|---|---|---|
| **F-07** | Dashboard de hitos vencidos | Seguimiento | +2% | `Dashboard.tsx` - tarjeta de hitos |
| **F-08** | Alerta de déficit financiero (ya existe parcial) | Financiero | +2% | `Financiero.tsx` - ya implementado |
| **F-09** | Exportación a Excel nativo (.xlsx) | General | +2% | Nuevo hook o librería |
| **F-10** | Sincronización en tiempo real (Supabase Realtime) | General | +3% | `store.tsx` - subscripciones |
| **F-11** | Módulo de Riesgos → Dashboard de matriz | Seguimiento | +2% | Ya creado en `Riesgos.tsx` |
| **F-12** | Módulo de Hitos → integrar con Gantt | Cronograma | +2% | `Hitos.tsx` + `PertGanttChart.tsx` |

### 2.3 🟢 Prioridad Baja — UX y refinamiento

| # | Función faltante | Área | Impacto | Archivos necesarios |
|---|---|---|---|---|
| **F-13** | Filtro por proyecto en todas las pantallas | UX | +1% | Hook `useFiltroProyecto` |
| **F-14** | Vistas de calendario para hitos y eventos | UX | +1% | `Calendar.tsx` - filtro por tipo |
| **F-15** | Notificaciones push reales (Service Worker) | General | +2% | `sw.js` + `push API` |
| **F-16** | Tema oscuro / modo claro sincronizado | UX | +1% | `theme-provider.tsx` |
| **F-17** | Internacionalización (i18n) | UX | +1% | Librería i18n |
| **F-18** | Tests unitarios para nuevos módulos | Calidad | +2% | `__tests__/` |

---

## 3. 📊 PROYECCIÓN DE COBERTURA

### Estado actual vs Meta

| Área | Actual | + Alta (6) | + Media (6) | + Baja (6) | Meta |
|------|:------:|:----------:|:-----------:|:----------:|:----:|
| Procesos de seguimiento | 61% | +8% → 69% | +6% → 75% | +3% → 78% | **78%** |
| Procesos financieros | 73% | +12% → 85% | +2% → 87% | +2% → 89% | **89%** |
| Procesos físicos/cronograma | 65% | +3% → 68% | +2% → 70% | +1% → 71% | **71%** |
| **Promedio general** | **66%** | **+8% → 74%** | **+4% → 78%** | **+2% → 80%** | **~80%** |

### Implementaciones rápidas (F-01 a F-06): +8% → 74%

| # | Esfuerzo estimado | prioridad |
|---|---|---|
| F-01 | 20 min (screen similar a Riesgos) | 🔴 Alta |
| F-02 | 20 min (screen similar a Riesgos) | 🔴 Alta |
| F-03 | 10 min (modificar interface + store) | 🔴 Alta |
| F-04 | 15 min (cálculo derivado en store) | 🔴 Alta |
| F-05 | 15 min (template en ExportacionInteligente) | 🔴 Alta |
| F-06 | 20 min (usar campo predecesores en PertGantt) | 🔴 Alta |

---

## 4. 🚀 PLAN DE ACCIÓN RECOMENDADO

### Fase 1 — Reorganización del menú (1 hora)
1. Refactorizar `Sidebar.tsx` con estructura de grupos
2. Actualizar `AppLayout.tsx` para soportar subvistas
3. Crear componente `MenuItem` con submenú colapsable
4. Migrar tipos `View` para soportar sub-vistas (ej: `proyectos:presupuestos`)

### Fase 2 — Implementaciones rápidas F-01 a F-06 (2 horas)
1. Crear screens de Cuentas por Cobrar y Pagar
2. Mejorar tipos Empleado con fechaAsignacion
3. Cálculo automático avance financiero
4. Template EERR en exportación
5. Integrar predecesores en PertGantt

### Fase 3 — Mejoras medias F-07 a F-12 (3 horas)
1. Dashboard de hitos
2. Exportación Excel
3. Supabase Realtime subscriptions
4. Integrar Hitos con Gantt

### Fase 4 — UX y refinamiento F-13 a F-18 (4 horas)
1. Filtro global por proyecto
2. Notificaciones push
3. Tests unitarios