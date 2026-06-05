# ERP CONSTRUSMART — Gestión Constructora Integral

ERP web para gestión constructora con módulos de proyectos, presupuestos APU, finanzas, RRHH, bodega, seguimiento EVM, CRM, logística y más. Frontend React + TypeScript + Vite con capa de datos local y sincronización opcional a Supabase.

**Deploy:** https://erp-construsmart-wm-app-01.vercel.app/

---

## Stack

- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui
- React Router v6
- Supabase (autenticación + base de datos + storage)
- Zod + react-hook-form
- html2canvas + jspdf (exportación PDF)
- Three.js + web-ifc (visor BIM IFC)

---

## Configuración Rápida

```bash
# 1. Clonar e instalar
npm install

# 2. Variables de entorno (.env)
VITE_SUPABASE_URL=https://neygzluxugodiwcuctbj.supabase.co
VITE_SUPABASE_KEY=<anon_key>

# 3. Iniciar dev
npm run dev   # http://localhost:8080

# 4. Build producción
npm run build
```

### Google OAuth

Supabase Dashboard → Authentication → URL Configuration:
- **Site URL:** `http://localhost:8080`
- **Redirect URLs:** `http://localhost:8080/**`, `https://erp-construsmart-wm-app-01.vercel.app/**`

Google Cloud Console → OAuth 2.0 Client ID:
- **Authorized redirect URI:** `https://neygzluxugodiwcuctbj.supabase.co/auth/v1/callback?provider=google`

### Migraciones SQL

Ejecutar en orden desde `supabase/migrations/`:
1. `000000000001_database.sql` — Schema base
2. `000000000002_proyecto_presupuesto.sql` — Vinculación proyecto-presupuesto
3. `000000000003_add_remaining_tables.sql` — 14 tablas (auditoría, destajos, cajas chicas, activos, cotizaciones, anticipos, pagos, ventas, centros costo)
4. `000000000004_seed_data.sql` — Datos semilla (24 insumos, 15 rendimientos, proyectos demo)
5. `000000000005_presupuestos_subrenglones.sql` — Sub-renglones en presupuestos
6. `000000000006_add_erp_vales_salida.sql` — Vales de salida
7. `000000000007_fix_avatar_url_roles.sql` — Fix avatar + roles

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server (puerto 8080) |
| `npm run build` | Build producción |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |

---

## Arquitectura

### Relación 1:N — Proyecto ↔ Presupuestos

```
erp_proyectos                      erp_presupuestos
┌──────────────────┐              ┌──────────────────────┐
│ id (PK)          │──┐           │ id (PK)              │
│ nombre           │  │           │ proyecto_id (FK)     │←┘
│ cliente          │  └───────────│ tipologia            │
│ tipologia        │  1:N         │ renglones (JSONB)    │
│ presupuestoActualId (FK)──┐     │ total_calculado      │
│ presupuestoTotal   │      │     │ estado               │
│ estado             │      │     │ version_presupuesto  │
└────────────────────┘      │     │ UNIQUE(proyecto_id,  │
                            │     │   version)           │
                            │     └──────────────────────┘
                            │
                            └──── Referencia al presupuesto activo
```

### Store/Context Pattern

```
ErpProvider (Root State)
├─ proyectos, presupuestos, movimientos, empleados, materiales
├─ ordenesCompra, proveedores, eventos, bitacora
├─ selectedProyectoId — para vinculación proyecto→presupuesto
├─ presupuestos[] — todos los presupuestos con proyectosId FK
├─ addPresupuesto(data) → INSERT Supabase + updateProyecto()
├─ updatePresupuesto(id, patch) → UPDATE Supabase
├─ deletePresupuesto(id) → DELETE Supabase
└─ getPresupuestoByProyecto(id) → selector para UI
```

### Flujo de Navegación

```
Proyectos                         Presupuestos
  └─ Lista                          └─ Proyecto preseleccionado
     └─ Click [📊 Presupuesto]          ├─ Tipología cargada
        └─ setSelectedProyectoId()      ├─ Renglones anteriores
           └─ setView('presupuestos')   └─ Guardar → actualiza proyecto
```

---

## Módulos del Sistema (18 componentes)

| # | Módulo | Archivo | Estado |
|---|--------|---------|--------|
| 1 | Dashboard (KPIs + Curva S + Alertas + Módulos) | `Dashboard.tsx` | ✅ |
| 2 | Proyectos (CRUD + mapa calor + avances) | `Proyectos.tsx` | ✅ |
| 3 | Presupuestos (motor APU 45 renglones, FSR + vinculación) | `Presupuestos.tsx` | ✅ |
| 4 | Financiero (Cash Flow real/proyectado, alertas déficit) | `Financiero.tsx` | ✅ |
| 5 | RRHH (empleados, FSR, asignación proyectos) | `RRHH.tsx` | ✅ |
| 6 | Bodega (Pareto 80/20, OC por rol, alertas stock) | `Bodega.tsx` | ✅ |
| 7 | Seguimiento (EVM + Gantt + bitácora + calidad + SSO) | `Seguimiento.tsx` | ✅ |
| 8 | CRM / Pipeline Kanban (5 columnas, KPIs) | `CRM.tsx` | ✅ |
| 9 | Login/Registro + RBAC (5 roles) | `Login.tsx` | ✅ |
| 10 | Logística/Compras (activos, cotizaciones, pagos) | `LogisticaCompras.tsx` | ✅ |
| 11 | Rendimiento Campo (destajos, vales, plantillas) | `RendimientoCampo.tsx` | ✅ |
| 12 | Comercial/Finanzas (ventas, anticipos, cajas chicas) | `ComercialFinanzas.tsx` | ✅ |
| 13 | Administración (centros costo, auditoría, validación) | `Administracion.tsx` | ✅ |
| 14 | GanttChart (cronograma interactivo) | `GanttChart.tsx` | ✅ |
| 15 | CriticalRenglonAlert (alertas desviaciones) | `CriticalRenglonAlert.tsx` | ✅ |
| 16 | PresupuestoCard (tarjeta vinculada en proyectos) | `PresupuestoCard.tsx` | ✅ |
| 17 | IFCViewer (visor BIM Three.js + web-ifc) | `IFCViewer.tsx` | ✅ |
| 18 | AppLayout + Sidebar + Header | Layout | ✅ |

---

## Funcionalidades Detalladas

### Presupuestos y Sub-Renglones

Los **sub-renglones** permiten desglosar materiales por cada renglón del presupuesto:

- **Agregar:** Click [+ Material] en renglón expandido
- **Campos:** Material, Cant/u, Unidad, Precio
- **Cálculo automático:** Total = cantidadUnitaria × cantidadRenglon × precioUnitario
- **Consolidación:** Resumen automático agrupa materiales por nombre+unidad
- **Exportación:** PDF incluye resumen de materiales + desglose APU; CSV incluye sección `=== RESUMEN DE MATERIALES ===`

**Mejoras implementadas:**
- Catálogo de 24 insumos base con precios de referencia
- Validación de precios (0, negativo, >Q10,000)
- Plantillas de sub-renglones (Concreto, Acero, Muro, Encofrado)
- Historial de cambios en presupuestos
- Comparativa entre versiones

### APU Avanzado (Análisis de Precios Unitarios)

- Catálogo de 24 insumos base por rubro
- Factor de sobrecosto configurable por proyecto (indirectos, admin, imprevistos, utilidad)
- Cálculo: CD = materiales + MO + equipo, PV = CD × factor_sobrecosto
- Histórico de precios con gráfica de tendencia (5 trimestres)

### Cubicación Automática

| Tipo | Fórmula |
|------|---------|
| Concreto | m³ = largo × ancho × alto (con desperdicio %) |
| Acero | kg = ∅² × cantidad × longitud × 0.006165 |
| Mampostería | piezas = área × factor piezas/m² × (1 + desperdicio%) |
| Encofrado | m² = 2(l×a + a×h) área de contacto |
| Excavación | m³ = l×a×h × factor expansión |

### Control de Campo (Móvil/PWA)

- **Bitácora digital:** Fecha, clima, personal, maquinaria, tareas, fotos, firma electrónica, geolocalización
- **Avance de obra:** % físico, cantidad ejecutada, foto geolocalizada, avance financiero automático
- **Control de materiales:** Recepción vs OC, vales de salida, conteo cíclico, kits por renglón, alertas stock crítico
- **Checkpoints de calidad:** Checklist por actividad, SSO diario, firma supervisor+residente, evidencia fotográfica
- **Offline-first:** IndexedDB, cola de sincronización (mutationQueue), sync automático al reconectar

### Seguimiento y EVM

- Curva S programada vs real con función sigmoide
- Flujo de caja proyectado vs ejecutado (12 meses)
- Alertas predictivas: desviación >10%, proyección sobrecosto, quema horas hombre
- Valor Ganado (EVM): Variación de Costo y Tiempo

### Cadena de Suministro

- Órdenes de compra con flujo de aprobación por rol
- Cuadro comparativo de proveedores con cotizaciones múltiples
- Entradas de almacén vs OC con validación de cantidades
- Vales de salida imputados a renglón específico
- Control de activos y herramientas por operador/cuadrilla

### Finanzas y Comercial

- Cash Flow real/proyectado con alertas de déficit
- Cajas chicas con carga de facturas y aprobación
- Gestión y amortización de anticipos
- Pipeline de ventas (disponible/reservado/vendido/entregado)
- Programación de pagos a proveedores con alertas vencidos
- Planilla de destajos (pago semanal por volumen)
- Automatización ISR (25%) e IVA (12%)

### Seguridad y Roles (RBAC)

| Rol | Acceso |
|-----|--------|
| Administrador | Todo el sistema + auditoría |
| Gerente | Dashboard, proyectos, finanzas, informes |
| Residente | Campo, bitácora, avances, calidad |
| Compras | Bodega, órdenes de compra, proveedores |
| Bodeguero | Inventarios, vales, recepciones |

### Notificaciones en Tiempo Real

- Sistema in-app con panel de notificaciones y badge en Header
- Web Notification API (permiso del navegador)
- Eventos: checklist rechazado, orden de cambio pendiente, stock crítico, desviación rendimiento, avance registrado
- Persistencia en localStorage

### Colaboración

- **Muro de obra:** Feed cronológico, texto+fotos+documentos, comentarios, menciones @usuario, filtros por tipo
- **Órdenes de cambio:** Solicitud con impacto costo/plazo, flujo aprobación (Residente→Gerente→Admin), trazabilidad
- **Notificaciones:** Likes, comentarios, badges por tipo

### Cumplimiento y Calidad

- **SSO:** Reporte incidentes, checklist diario (11 items), estadísticas días sin accidentes, botón emergencia con geolocalización
- **Control calidad:** Pruebas laboratorio (concreto, suelos, acero), no conformidades (NC→plan→cierre), liberación de partidas
- **Gestión documental:** Planos por disciplina+versión, RFI (Request for Information), Submittals, historial de versiones

### BIM / IFC

- Visor IFC en navegador con Three.js + web-ifc
- Orbitar, zoom, seccionar (clipping plane), auto rotate
- Vincular elementos BIM con renglones de presupuesto
- Comparativa avance físico: modelo BIM vs campo
- Cubicación desde modelo IFC

### Dashboard Predictivo y BI

- Proyección costo final (EAC = BAC/CPI)
- Estimación fecha finalización basada en rendimiento actual
- Riesgos: actividades con mayor desviación histórica
- Exportación inteligente: reportes automáticos semanales, formatos JSON/CSV/PDF

---

## Google OAuth Setup

Ver `SUPABASE_GOOGLE_OAUTH_SETUP.md` (archivo eliminado — contenido consolidado aquí):

### Supabase Dashboard
- **Site URL:** `http://localhost:8080`
- **Redirect URLs:** `http://localhost:8080`, `http://localhost:8080/**`, `https://erp-construsmart-wm-app-01.vercel.app`, `https://erp-construsmart-wm-app-01.vercel.app/**`

### Google Cloud Console
- **Authorized JavaScript origins:** `http://localhost:8080`, `http://localhost`, `https://erp-construsmart-wm-app-01.vercel.app`
- **Authorized redirect URIs:** `https://neygzluxugodiwcuctbj.supabase.co/auth/v1/callback?provider=google`

### Troubleshooting
- **Callback URL mismatch:** Redirect URI en Google Cloud no coincide con Supabase
- **Sigue redirigiendo al login:** Verificar Site URL = `http://localhost:8080` en Supabase Dashboard
- **PKCE flow:** Implementado con `flowType: 'pkce'` y `exchangeCodeForSession()`

---

## Pendientes Conocidos

| # | Item | Tipo | Estado |
|---|------|------|--------|
| 1 | Ejecutar migración seed data en Supabase (`000000000004_seed_data.sql`) | Operación | ❌ Pendiente |
| 2 | Ejecutar migraciones (000000000006, 000000000007, 000000000008) | Operación | ❌ Pendiente |
| 3 | Tablas sin sync Supabase (erp_seguimiento, erp_renglones, erp_insumos, erp_sub_renglones) | Feature | ❌ Pendiente |
| 4 | Overlay de planos vs modelo en Visor BIM | Feature | ❌ Pendiente |
| 5 | F-17: Internacionalización (i18n) | Feature | ❌ Pendiente |
| 6 | Google OAuth verificación de dominio | Seguridad | ❌ Pendiente |
| 7 | Refresh token rotation en Supabase | Seguridad | ❌ Pendiente |

---

## Notas de Seguridad

- No se usan claves o tokens hardcodeados
- API Key Supabase movida a `.env`
- RLS implementado con políticas por rol
- Logs de auditoría imborrables (`logs_sistema` + trigger `fn_log_audit`)
- Modo offline/local soportado sin Supabase

---

*Última actualización: 2026-06-02*
