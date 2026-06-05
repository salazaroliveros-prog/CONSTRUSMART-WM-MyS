# 🤖 AGENTE DE REFERENCIA — ERP CONSTRUSMART

> **Archivo de conocimiento completo del proyecto** para orientar a cualquier agente o desarrollador que continúe el trabajo.

---

## 📌 IDENTIDAD DEL PROYECTO

**Nombre:** CONSTRUSMART ERP  
**Empresa:** CONSTRUCTORA WM / M&S  
**Eslogan:** "Edificando el Futuro"  
**Tipo:** ERP integral para construcción civil y comercial en Guatemala  
**Stack:** React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui + Supabase  
**Repo:** https://github.com/salazaroliveros-prog/ERP-CONSTRUSMART-WM.git  
**Build:** ✅ 0 errores | **Tests:** ✅ 76/76 pasados | **Cobertura código-docs:** ~98%

---

## 🏗️ ARQUITECTURA

```
src/
├── main.tsx                    → Entry point
├── App.tsx                     → Router + Providers
├── index.css                   → TailwindCSS + variables CSS
├── components/
│   ├── AppLayout.tsx           → Shell principal (Header + Sidebar + Content)
│   ├── ErrorBoundary.tsx       → Captura errores globales
│   ├── LoaderSpinner.tsx       → Spinner de carga
│   └── theme-provider.tsx      → Tema claro/oscuro
├── contexts/
│   └── AppContext.tsx           → Sidebar state (open/collapsed)
├── hooks/
│   ├── useDebounce.ts          → Debounce para búsquedas
│   ├── useRateLimit.ts         → Rate limiting en formularios
│   ├── useSessionTimeout.ts    → Cierre de sesión por inactividad
│   ├── use-mobile.tsx          → Detección de móvil
│   └── use-toast.ts            → Sistema de toasts
├── lib/
│   ├── supabase.ts             → Cliente Supabase
│   ├── security.ts             → RBAC, sanitización XSS
│   ├── security-audit.ts       → Auditoría de seguridad
│   ├── storage.ts              → Upload/download archivos
│   ├── csrf.ts                 → Protección CSRF
│   └── utils.ts                → cn() utility
├── erp/
│   ├── store.tsx               → Estado global (~1485 líneas)
│   ├── types.ts                → Interfaces TypeScript (48 interfaces, 575 líneas)
│   ├── utils.ts                → Constantes y funciones de cálculo
│   ├── data.ts                 → Datos semilla
│   ├── export.ts               → Exportación PDF/CSV (con sanitización XSS)
│   ├── screens/                → 34 pantallas
│   ├── components/             → 25+ componentes
│   ├── hooks/                  → Hooks del ERP
│   └── __tests__/              → Tests unitarios (76 tests)
└── sql/                        → Migraciones SQL y RPCs
```

---

## 🔑 SISTEMA DE ESTADO (store.tsx)

### Patrón de diseño: Context API + useState + localStorage
- **1485 líneas** de estado global
- **15+ estados** con persistencia en localStorage
- **Mutation queue** para sincronización offline→online
- **Zod schemas** para validación de datos de Supabase

### Estados principales:
```typescript
proyectos, movimientos, empleados, materiales, ordenes, 
proveedores, eventos, bitacora, presupuestos, licitaciones,
avances, valesSalida, notificaciones, mutationQueue
```

### Funciones CRUD del store (25+):
```
add/update/delete → Proyecto, Movimiento, Empleado, Bitacora, 
                    Evento, Proveedor, Presupuesto, Licitacion, Avance, ValeSalida
updateMaterial, updateOrden
```

### Funciones especiales:
```
costoPorHoraHombre()           → M-05: Costo MO por proyecto (store.tsx:1287)
empleadosDisponibles()         → M-08: Filtra empleados sin proyecto (store.tsx:1302)
avanceFinancieroCalculado()    → F-04: Derivado de movimientos (store.tsx:1307)
getPresupuestoByProyecto()     → Busca presupuesto vinculado (store.tsx:1435)
verificarStockCritico()        → Notificación si stock < mínimo (store.tsx:634)
verificarOrdenesCambioPendientes() → Alerta OC pendientes
```

### Tipos de datos (types.ts):
- **Proyecto**: id, nombre, ubicacion, tipologia, presupuestoTotal, montoContrato, cliente, fechaInicio, fechaFin, avanceFisico, avanceFinanciero, estado
- **Movimiento**: id, proyectoId, tipo (ingreso/gasto/egreso), categoria, costoTotal, fecha
- **Presupuesto**: id, proyectoId, tipologia, renglones[], estado, totalCalculado, versionPresupuesto
- **RenglonPresupuesto**: extends RenglonBase + predecesores?: string[]
- **Hito**: proyectoId, nombre, fecha, tipo (inicio/hito/entrega/cierre), estado, responsable
- **Riesgo**: proyectoId, nombre, tipo, probabilidad(1-5), impacto(1-5), nivel, estado, planMitigacion
- **CuentaCobrar/CuentaPagar**: proyectoId, cliente/proveedor, monto, saldoPendiente, fechaVencimiento, estado
- **48 interfaces totales**

---

## 🖥️ PANTALLAS DISPONIBLES (34)

### Tablero
- **Dashboard** — KPIs, alertas retraso, predicción fin, EERR, ROI, Curva S

### Proyectos
- **Proyectos** — CRUD con Zod validation, mapa de calor, presupuesto vinculado
- **Presupuestos** — APU completo, sub-renglones, comparación real vs plan
- **Seguimiento** — Avance físico, Gantt, bitácora digital, valor ganado (EVM)
- **Hitos** — Timeline de milestones con detección de vencidos
- **Riesgos** — Matriz de calor 5×5, mitigation tracking

### Finanzas
- **Financiero** — Flujo de caja real/proyectado, gastos por categoría, centros de costo
- **CxC** — Cuentas por cobrar con vencimientos
- **CxP** — Cuentas por pagar con vencimientos
- **Impuestos** — Cálculo y gestión tributaria
- **Comercial/Fin** — Ventas, anticipos, cajas chicas

### Bodega
- **Bodega** — Inventario, proveedores, movimientos, cuadros comparativos (fixed useEffect cycle)
- **Logística** — Órdenes de compra, activos, cuadros comparativos
- **Base Precios** — Catálogo de precios por unidad
- **Entradas Almacén** — Recepciones de OC

### RRHH
- **RRHH** — Empleados, planilla, asignación a proyectos
- **Planilla Destajos** — Destajos por renglón
- **Rendimiento** — Capturas de rendimiento en campo

### Calidad
- **SSO & Calidad** — Checklists de calidad, incidentes, no conformidades
- **Muro Obra** — Publicaciones de avance, fotos, firmas
- **Órdenes Cambio** — OC con impacto costo/plazo
- **Documentos** — Planos, RFIs, Submittals

### Admin
- **Admin Sistema** — Centros de costo con Zod validation, auditoría
- **CRM** — Gestión de clientes con Zod validation
- **Notificaciones** — Centro de notificaciones

### Herramientas
- **Visor BIM** — Visor 3D IFC
- **Exportar** — PDF/CSV/JSON con sanitización XSS
- **Predictivo** — Dashboard predictivo

---

## 🔒 SEGURIDAD IMPLEMENTADA

### Nivel 1: Autenticación
- Supabase Auth con PKCE flow
- OAuth Google
- RPC verificar_rol_usuario (SECURITY DEFINER)
- Roles: Administrador, Gerente, Residente, Compras, Bodeguero
- RBAC por vista (ALLOWED map en store.tsx)

### Nivel 2: Protección de datos
- RLS en todas las tablas (fix_rls_definitivo.sql)
- Sanitización XSS: sanitizarTexto() + sanitizarObjeto() en security.ts
- CSRF tokens con comparación timing-safe (csrf.ts)
- Input validation con Zod schemas (store.tsx + screens)
- Sanitización en exports PDF/CSV (export.ts fixed 05/06/2026)
- useEffect cycle prevention con useRef pattern (Bodega.tsx fixed 05/06/2026)
- Validación Zod en CRM.tsx y Administracion.tsx (agregado 05/06/2026)

### Nivel 3: Session Management
- Timeout de sesión por inactividad (30 min)
- Advertencia 60s antes de expirar
- Rate limiting en formularios (useRateLimit)
- Debounce en búsquedas (useDebounce)

### Nivel 4: Infraestructura
- CSP, HSTS, X-Frame-Options en vercel.json
- Service Worker con cache
- ErrorBoundary global + por módulo
- Sanitización de localStorage (límites de tamaño)

---

## 📊 MEJORAS IMPLEMENTADAS

### M-01 a M-14 (Gestión de proyectos):
- M-01: Alertas de retraso en Dashboard ✅
- M-02: Predicción de fecha de fin por regresión lineal ✅
- M-03: Campo predecesores en RenglonPresupuesto para Gantt ✅
- M-04: Comparación real vs plan por renglón ✅
- M-05: Función costoPorHoraHombre() en store ✅
- M-06: Interface Hito con fecha, tipo, estado, responsable ✅
- M-07: Historial de cambios de cronograma ✅
- M-08: Función empleadosDisponibles() en store ✅
- M-09: Flujo de caja con pagos proveedores ✅
- M-10: Reporte financiero multi-proyecto en Dashboard ✅
- M-11: Eficiencia de tiempo en bitácora ✅
- M-12: Bloqueo de fechas finalizadas ✅
- M-13: Materiales vinculados a proyecto en vale ✅
- M-14: Dashboard rendimiento equipo ✅

### F-01 a F-16 (Funcionalidades roadmap):
- F-01: Screen Cuentas por Cobrar ✅
- F-02: Screen Cuentas por Pagar ✅
- F-03: Campo fechaAsignacion en Empleado ✅
- F-04: avanceFinancieroCalculado() en store ✅
- F-05: Tipos CuentaCobrar/CuentaPagar añadidos ✅
- F-06: Campo predecesores en Gantt ✅
- F-07: Dashboard hitos vencidos ✅
- F-10: Supabase Realtime subscriptions ✅
- F-11: Matriz de riesgos interactiva ✅
- F-12: Hitos con dependencias (predecesores) ✅
- F-13: Filtro global por proyecto ✅
- F-14: Vista calendario para hitos ✅
- F-15: Notificaciones push (Service Worker) ✅
- F-16: Tema oscuro sincronizado ✅
- F-17: Internacionalización (i18n) ❌ Pendiente
- F-18: Tests unitarios (76 tests) ✅

---

## 📐 REORGANIZACIÓN DEL MENÚ

### Menú actual: 32 items → 8 grupos

| Grupo | Contenido |
|-------|-----------|
| 📊 TABLERO | Dashboard + Predictivo + Reportes |
| 🏗️ PROYECTOS | Proyectos, Presupuestos, APU, Seguimiento, Curvas S, Rendimientos, Hitos, Riesgos |
| 💰 FINANZAS | Financiero, Impuestos, Comercial/Fin, CxC, CxP |
| 📦 BODEGA | Bodega, Logística, Base Precios, Entradas Almacén |
| 👷 RRHH CAMPO | RRHH, Planilla, Rendimiento Campo |
| ✅ CALIDAD | SSO, Muro Obra, Órdenes Cambio, Documentos |
| 🔧 ADMIN | Admin, CRM, Notificaciones |
| 🛠️ HERRAMIENTAS | Visor BIM, Exportación |

---

## 📈 MÉTRICAS DEL PROYECTO

| Métrica | Valor |
|---------|-------|
| Build time | ~17s |
| Tamaño bundle | ~4MB (web-ifc es 3.6MB) |
| Pantallas | 34 |
| Componentes | 25+ |
| Hooks personalizados | 8 |
| Interfaces TypeScript | 48 |
| Líneas store.tsx | ~1485 |
| Tests | 76/76 |
| Cobertura docs-código | ~98% |
| Cobertura vs ERP ideal | ~72% |

---

## 📝 ÚLTIMOS FIXES (05/06/2026)

| # | Fix | Archivo | Descripción |
|---|-----|---------|-------------|
| 1 | 🔴 XSS en export.ts | src/erp/export.ts | sanitizarTexto() en todas las variables HTML injection |
| 2 | 🟡 useEffect cycle Bodega | src/erp/screens/Bodega.tsx | useRef pattern para evitar ciclo infinito |
| 3 | 🟢 Zod Admin | src/erp/screens/Administracion.tsx | Validación Zod en formulario Centros de Costo |
| 4 | 🟢 Zod CRM | src/erp/screens/CRM.tsx | Validación Zod con errores inline en formulario |

---

## 🎯 INSTRUCCIONES PARA CONTINUAR

### Para implementar nuevas funcionalidades:
1. Agregar interface en `types.ts`
2. Crear screen en `erp/screens/` (copiar patrón existente)
3. Agregar lazy import en `AppLayout.tsx`
4. Agregar route en screens map de `AppLayout.tsx`
5. Agregar item en `Sidebar.tsx`
6. Agregar al VIEW type en `store.tsx`
7. Si necesita CRUD, agregar al ErpState interface y provider

### Para corregir bugs:
1. Verificar build: `npm run build`
2. Verificar tests: `npx vitest run`
3. Buscar patrón afectado con `search_files`
4. Aplicar corrección con `replace_in_file`
5. Verificar build después de corrección

### Para agregar módulos financieros:
1. Crear screen en `erp/screens/` con pattern de Riesgos
2. Usar `useErp()` para acceder a datos del store
3. Usar localStorage para persistencia local
4. Usar `INPUT` de `ui.ts` para estilos consistentes
5. Agregar KPIs con tarjetas de colores
6. Registrar en `AppLayout.tsx` y `Sidebar.tsx`

### Pendientes conocidos:
1. F-17: Internacionalización (i18n) — ~4h
2. Validación Zod en LogisticaCompras.tsx, SSOCalidad.tsx, GestionDocumental.tsx
3. P2-REND: Performance optimizations (WebP, virtual scrolling, Brotli)
4. Google OAuth domain verification
5. Migraciones SQL pendientes del README