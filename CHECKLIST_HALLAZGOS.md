# CHECKLIST DE HALLAZGOS - CONSTRUSMART ERP

> **Fecha:** 2026-06-03
> **Estado del código:** Build exitoso ✅ | TypeScript sin errores ✅ | Lint 90 warnings | Tests 10/10 pasados ✅

---

## 📊 ESTADO GENERAL

| Área | Estado | Problemas detectados |
|------|--------|-------------------|
| Build | ✅ | 0 errores |
| TypeScript | ✅ | 0 errores |
| Lint | ✅ | 90 warnings (solo imports no usados) |
| Seguridad | ✅ Parcial | RLS mejorado pero requiere ejecución en Supabase |
| Deuda técnica | ⚠️ | Imports no usados, código muerto |

---

## ✅ ERRORES CRÍTICOS CORREGIDOS

### 1. ArrowUpDown no definido - BasePrecios.tsx:226 ✅ CORREGIDO
**Archivo:** `src/erp/screens/BasePrecios.tsx`
**Línea:** 226
**Estado:** ✅ Agregado `ArrowUpDown` al import lucide-react

---

## 🟠 INCONSISTENCIAS DE TIPOS (types.ts vs data.ts vs DB)

### 2. InsumoBase.fechaActualizacion ✅ CORREGIDO
**Archivo:** `src/erp/types.ts:21-30`
**Problema:** La interface `InsumoBase` usa `fechaActualizacion` en BasePrecios.tsx:95,136 pero no estaba en la interface
**Estado:** ✅ Campo agregado a interface

### 3. Material.precio vs precioUnitario
**Archivo:** `src/erp/types.ts:142-152`
**Problema:** Interface usa `precio` pero PLAN_REFUERZO.md indica `precioUnitario` como estándar
**Notas:** El store.tsx mapea correctamente de `precio` → `precioUnitario` en el schema, pero la interface debería ser consistente

### 4. Campo lat/lng en Proyecto (tipos vs store)
**Archivo:** `src/erp/types.ts:92-110`
**Problema:** El tipo tiene `lat`, `lng` y `latitud`, `longitud` - redundancia
**Solución:** Mantener solo `latitud`/`longitud` o estandarizar a `lat`/`lng`

---

## 🟡 WARNINGS DE LINT (Técnicos pero no críticos)

### Imports no utilizados (90 warnings)
| Archivo | Import no usado | Acción |
|---------|---------------|--------|
| BasePrecios.tsx | `ArrowUpDown` | ✅ Corregido |
| APUAvanzado.tsx | `TrendingUp`, `X`, `Plus`, `Trash2` | Eliminar |
| Administracion.tsx | `updateCentroCosto` | Eliminar o implementar |
| CurvasS.tsx | `Clock`, `CalendarDays`, `FileText`, `Printer`, `real` | Eliminar |
| DashboardPredictivo.tsx | `TrendingUp`, `Target` | Eliminar |
| EntradasAlmacenOC.tsx | `setRecepciones`, `recepcionKey` | Eliminar |
| ExportacionInteligente.tsx | `Mail`, `Check`, `ChevronDown`, `ChevronUp`, `CARD` | Eliminar |
| LogisticaCompras.tsx | `ActivoHerramienta`, `CuadroComparativo`, `CotizacionItem`, `PagoProveedor`, `supabase` | Eliminar |
| OrdenesCambio.tsx | `Search`, `AlertTriangle`, `FileText`, `Users` | Eliminar |
| Presupuestos.tsx | `CubicacionAutomatica`, `HistorialPresupuestosModal`, `updateProyecto`, `histOpen`, `handleApplyVersion` | Eliminar |
| RendimientoCampo.tsx | `presupuestos`, `getPlantillasByRenglon`, `getValesByRenglon` | Eliminar |
| SSOCalidad.tsx | Múltiples imports no usados | Limpiar |
| VisorBIM.tsx | `RenglonPresupuesto`, `Check`, `X`, `Search`, `proyectoActual` | Eliminar |

---

## 🟢 INCONSISTENCIAS CORREGIDAS VERIFICADAS

| # | Corrección | Estado |
|---|------------|--------|
| 1 | Fix `subrenglones` → `subRenglones` | ✅ Verificado - no existe el typo en el código actual |
| 2 | Import `Proyecto` en Proyectos.tsx | ✅ Verificado - ya importado correctamente |
| 3 | Migrar Presupuestos a Mutation Queue | ✅ Verificado - ya usa `enqueueMutation` |
| 4 | Casos Avance/Licitacion en processQueue | ✅ Verificado - ya implementados (líneas 892-940) |
| 5 | Race condition processQueue | ✅ Corregido - `setMutationQueue` dentro del try |
| 6 | `proyectoIds` en Empleado | ✅ Verificado - interface tiene `proyectoIds: string[]` |
| 7 | `proyectoIds` en Material | ✅ Verificado - interface tiene `proyectoIds: string[]` |
| 8 | `factura` en Movimiento | ✅ Verificado - interface tiene `factura?: string` |
| 9 | `participantes` en EventoCalendario | ✅ Verificado - interface tiene `participantes: string[]` |
| 10 | `fotos`/`firma` en BitacoraEntry | ✅ Verificado - interface los tiene |
| 11 | `factorSobrecosto` en Proyecto | ✅ Verificado - interface opcional |

---

## 🔍 ALINEACIÓN ESQUEMA SUPABASE VS CÓDIGO

**Verificado:** El esquema actual de Supabase está **completamente alineado** con las interfaces del código.

| Campo indicado en PLAN_REFUERZO.md | Estado en Supabase | Estado en types.ts | Notas |
|-------------------------------------|-------------------|-------------------|-------|
| `erp_empleados.proyecto_ids` | ✅ SÍ (`_uuid`) | ✅ `proyectoIds: string[]` | Alineado |
| `erp_materiales.proyecto_ids` | ✅ SÍ (`_uuid`) | ✅ `proyectoIds: string[]` | Alineado |
| `erp_movimientos.factura` | ✅ SÍ (`text`) | ✅ `factura?: string` | Alineado |
| `erp_eventos_calendario.participantes` | ✅ SÍ (`_uuid`) | ✅ `participantes: string[]` | Alineado |
| `erp_bitacora.fotos`, `firma` | ✅ SÍ | ✅ `fotos: string[]`, `firma?: string` | Alineado |
| `erp_proyectos.factor_sobrecosto` | ✅ SÍ (`jsonb`) | ✅ `factorSobrecosto?: FactorSobrecosto` | Alineado |

---

## 🛡️ VERIFICACIÓN DE SEGURIDAD

### Archivos de seguridad implementados
| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `src/lib/security.ts` | RBAC server-side, sanitización XSS | ✅ Implementado |
| `index.html` | CSP + headers meta | ✅ Implementado |
| `vercel.json` | Headers HSTS/CSP/XSS + rewrites SPA | ✅ Implementado |
| `.github/workflows/ci-cd.yml` | CI/CD con audit, lint, tests, deploy | ✅ Implementado |

### Migraciones RLS pendientes de ejecución
| Archivo | Estado |
|---------|--------|
| `supabase/migrations/202606030001_rls_complete_coverage.sql` | 🆕 Pendiente ejecutar en Supabase |
| `supabase/migrations/202606030002_rls_policies_by_role.sql` | 🆕 Pendiente ejecutar en Supabase |
| `supabase/migrations/202606030003_rls_delta.sql` | 🆕 Pendiente ejecutar en Supabase |
| `supabase/migrations/202606030004_rls_alignment.sql` | 🆕 Pendiente ejecutar en Supabase |
| `supabase/migrations/202606030005_rls_rpc_verificar_rol.sql` | 🆕 RPC verificar_rol_usuario faltante |

---

## 🏗️ COMPONENTES PRINCIPALES (Mapeo arquitectónico)

```
src/
├── main.tsx                    → Entry point React
├── App.tsx                     → Router + Providers
├── lib/
│   ├── supabase.ts             → Cliente Supabase + helper functions
│   └── security.ts             → RBAC server-side, sanitización XSS
├── erp/
│   ├── store.tsx               → Estado global + lógica negocio (1346 líneas)
│   ├── types.ts                → Definiciones de interfaces (558 líneas)
│   ├── data.ts                 → Datos semilla
│   ├── utils.ts                → Utilidades
│   ├── screens/                → 28 pantallas del ERP
│   └── components/             → 20+ componentes específicos
└── components/
    └── ErrorBoundary.tsx       → Captura errores global
```

---

## ✅ ACCIONES RECOMENDADAS

### Inmediatas (P0)
1. ✅ Corregido: ArrowUpDown import en BasePrecios.tsx
2. ✅ Corregido: fechaActualizacion agregada a InsumoBase interface
3. Ejecutar migraciones RLS en Supabase (202606030001-0005)
4. Configurar secrets en GitHub: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VERCEL_TOKEN`
5. Hacer push a GitHub: `git push origin main`

### Deuda técnica futura
6. Refactorizar store.tsx en módulos más pequeños
7. Eliminar imports no usados en 15 archivos
8. Agregar tests unitarios para lógica crítica del store
9. Configurar ESLint con reglas de seguridad (eslint-plugin-security)