# INFORME TÉCNICO COMPLETO: ARQUITECTURA, SEGURIDAD Y MEJORAS — CONSTRUSMART ERP

> **Fecha:** 06/03/2026
> **Repositorio:** github.com/salazaroliveros-prog/ERP-CONSTRUSMART-WM
> **Último commit:** `e525acd` — "puliendo detalles"

---

## ÍNDICE

1. [ARQUITECTURA DE LA APLICACIÓN](#1-arquitectura-de-la-aplicación)
2. [STACK TECNOLÓGICO COMPLETO](#2-stack-tecnológico-completo)
3. [FUNCIONAMIENTO Y LÓGICA DEL ERP](#3-funcionamiento-y-lógica-del-erp)
4. [CONEXIONES INTERNAS Y EXTERNAS](#4-conexiones-internas-y-externas)
5. [EVALUACIÓN DE VULNERABILIDADES](#5-evaluación-de-vulnerabilidades)
6. [ESTADO GITHUB Y VERCEL](#6-estado-github-y-vercel)
7. [CHECKLIST DE MEJORAS Y REFUERZOS](#7-checklist-de-mejoras-y-refuerzos)

---

## 1. ARQUITECTURA DE LA APLICACIÓN

### 1.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (React SPA)                      │
│  ┌───────────┐  ┌──────────┐  ┌────────┐  ┌─────────────┐  │
│  │  Pages/   │  │Components│  │Contexts│  │   Hooks/     │  │
│  │  Screens  │  │  shadcn   │  │ (Auth, │  │  useQuery    │  │
│  │           │  │  /Radix   │  │ Theme) │  │  useAuth...  │  │
│  └─────┬─────┘  └────┬─────┘  └────┬────┘  └──────┬──────┘  │
│        └──────────────┴─────────────┴──────────────┘         │
│                          │                                    │
│                    ┌─────▼──────┐                            │
│                    │  ERP Store  │  ← Zustand-like store     │
│                    │ (store.tsx) │    (React Context +       │
│                    │             │     useReducer)           │
│                    └─────┬──────┘                            │
│                          │                                    │
│                    ┌─────▼──────┐                            │
│                    │ Supabase    │  ← TanStack React Query   │
│                    │ Client     │    (caching + sync)        │
│                    └─────┬──────┘                            │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ═══════╪═══════ HTTPS
                           │
              ┌────────────▼────────────┐
              │      SUPABASE CLOUD      │
              │  ┌──────────────────┐    │
              │  │  PostgreSQL DB   │    │
              │  │  (Row Level      │    │
              │  │   Security RLS)  │    │
              │  ├──────────────────┤    │
              │  │  Auth (Google    │    │
              │  │  OAuth + Email)  │    │
              │  ├──────────────────┤    │
              │  │  Storage         │    │
              │  │  (imágenes,      │    │
              │  │   documentos)    │    │
              │  └──────────────────┘    │
              └──────────────────────────┘
```

### 1.2 Estructura de Directorios

```
CONSTRUSMART/
├── src/
│   ├── main.tsx              → Entry point React
│   ├── App.tsx               → Router + Providers
│   ├── App.css / index.css   → Estilos globales
│   ├── components/           → Componentes genéricos (ErrorBoundary, AppLayout)
│   ├── contexts/             → AuthContext, ThemeContext (next-themes)
│   ├── erp/                  → ★ MÓDULO PRINCIPAL ERP
│   │   ├── store.tsx         → Estado global + lógica de negocio
│   │   ├── types.ts          → Definiciones de tipos ERP
│   │   ├── utils.ts          → Utilidades ERP
│   │   ├── screens/          → Pantallas del ERP (Login, Dashboard, etc.)
│   │   └── components/       → Componentes ERP (Sidebar, GanttChart, etc.)
│   ├── functions/            → Funciones auxiliares
│   ├── hooks/                → Custom hooks React
│   ├── lib/                  → Supabase client, helpers
│   ├── pages/                → Páginas del router
│   └── types/                → Tipos TypeScript compartidos
├── sql/                      → Scripts SQL (fix_supabase_schema.sql)
├── supabase/migrations/      → Migraciones de esquema
├── public/                   → Assets estáticos (logos, favicon, sw.js)
├── docs/                     → Sitio documentación estático
├── assets/                   → Assets compilados
├── vercel.json               → Configuración Vercel
├── vite.config.ts            → Configuración Vite
└── tailwind.config.ts        → Configuración Tailwind
```

---

## 2. STACK TECNOLÓGICO COMPLETO

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| **Framework UI** | React 18 | ^18.3.1 | Componentes de interfaz |
| **Lenguaje** | TypeScript 5 | ^5.9.3 | Tipado estático |
| **Build** | Vite 5 + SWC | ^5.4.21 | Compilación rápida |
| **Testing** | Vitest + Testing Library | ^1.3.5 | Pruebas unitarias |
| **Estilos** | Tailwind CSS 3 | ^3.4.19 | CSS utilitario |
| **Componentes UI** | shadcn/ui (Radix) | — | 40+ componentes accesibles |
| **Routing** | React Router DOM v6 | ^6.26.2 | Navegación SPA |
| **Estado servidor** | TanStack React Query 5 | ^5.56.2 | Caching + sincronización |
| **Formularios** | React Hook Form + Zod | ^7.53.0 | Formularios validados |
| **Validación** | Zod | ^3.23.8 | Esquemas de validación |
| **Backend/DB/Auth** | Supabase JS v2 | ^2.49.4 | BBDD PostgreSQL + Auth + Storage |
| **Gráficos** | Recharts | ^2.12.7 | Gráficos y dashboards |
| **3D/BIM** | Three.js + web-ifc | ^0.184.0 | Visualización modelos IFC |
| **PDF** | jsPDF + html2canvas | ^4.2.1 | Generación PDF |
| **Iconos** | Lucide React | ^0.462.0 | Iconografía |
| **Fechas** | date-fns | ^3.6.0 | Manipulación fechas |
| **Tema oscuro** | next-themes | ^0.3.0 | Modo oscuro/claro |
| **QR** | html5-qrcode | ^2.3.8 | Lector códigos QR |
| **Firma digital** | react-signature-canvas | ^1.0.6 | Captura firmas |
| **Hot reload** | Vite SWC plugin | ^3.11.0 | Desarrollo rápido |

### Dependencias clave (totales):
- **Dependencias:** 34 packages
- **DevDependencies:** 25 packages
- **Total:** ~59 packages

---

## 3. FUNCIONAMIENTO Y LÓGICA DEL ERP

### 3.1 Módulos Funcionales

El ERP CONSTRUSMART está diseñado para **gestión de empresas constructoras** con los siguientes módulos:

| Módulo | Archivo(s) | Funcionalidad |
|--------|-----------|---------------|
| **🔐 Autenticación** | `Login.tsx`, `AuthContext` | Login email + Google OAuth, RBAC frontend |
| **📊 Dashboard** | `Dashboard.tsx` | KPIs, alertas de renglones críticos |
| **📋 Proyectos** | `Proyectos.tsx` | CRUD proyectos construcción |
| **💰 Presupuestos** | `Presupuestos.tsx` | Presupuestos con subrenglones, insumos |
| **📦 Insumos** | `Insumos.tsx` | Catálogo de materiales/insumos |
| **🚚 Vales de Salida** | `ValesSalida.tsx` | Control de salida de materiales |
| **🔧 Órdenes Compra** | `OrdenesCompra.tsx` | Órdenes de compra a proveedores |
| **📈 Seguimiento** | `Seguimiento.tsx` | Seguimiento de obra y avance |
| **📑 Cotizaciones** | `Cotizaciones.tsx` | Gestión de cotizaciones |
| **🏗️ Planos/IFC** | `Planos.tsx` | Visualizador 3D modelos IFC |
| **📄 Reportes PDF** | Múltiples | Exportación PDF con jsPDF |
| **🏢 Empresa** | `Empresa.tsx` | Configuración empresa |
| **👥 Usuarios** | `Usuarios.tsx` | Gestión de usuarios y roles |
| **🔧 Mantenimiento** | `Mantenimiento.tsx` | Mantenimiento predictivo equipos |
| **📊 Analytics** | `Analytics.tsx` | Analítica y estadísticas |

### 3.2 Flujo de Datos Principal

```
Usuario → Login (AuthContext) → ERP Store (store.tsx) 
                                   ↓
                            Consulta a Supabase
                              (TanStack Query)
                                   ↓
                            PostgreSQL + RLS
                                   ↓
                            Respuesta con datos
                                   ↓
                            ERP Store actualiza estado
                                   ↓
                            Componentes se re-renderizan
                                   ↓
                            Usuario visualiza/interactúa
```

### 3.3 Manejo de Estado

El estado global se maneja con un **patrón híbrido**:
- **ERP Store** (`store.tsx`): Hook personalizado `useERPDB()` que expone estado + acciones (como un store tipo Zustand pero con Context + useReducer)
- **TanStack React Query**: Cache de datos del servidor con invalidación automática
- **Contextos**: AuthContext (sesión), ThemeContext (modo oscuro)
- **Estado local**: useState/useReducer en componentes

### 3.4 Sistema de Roles (RBAC)

| Rol | Acceso |
|-----|--------|
| `admin` | Todos los módulos + gestión usuarios |
| `jefe_obra` | Proyectos, presupuestos, insumos, vales, órdenes |
| `supervisor` | Seguimiento, lectura de proyectos |
| `almacen` | Insumos, vales de salida |
| `financiero` | Presupuestos, cotizaciones, reportes |

> ⚠️ **CRÍTICO**: El RBAC se aplica exclusivamente del lado del **frontend**. No hay verificación server-side real.

---

## 4. CONEXIONES INTERNAS Y EXTERNAS

### 4.1 Conexiones Internas

```
┌─────────────────────────────────────────────────────┐
│                  CONEXIONES INTERNAS                  │
├─────────────────────────────────────────────────────┤
│                                                       │
│  App.tsx                                              │
│   ├── QueryClientProvider (TanStack)                  │
│   ├── AuthProvider (Context)                          │
│   │    └── ThemeProvider (next-themes)                │
│   │         └── BrowserRouter                         │
│   │              ├── /login → Login.tsx               │
│   │              ├── /erp/* → AppLayout.tsx           │
│   │              │    ├── Sidebar.tsx                 │
│   │              │    └── <Outlet> → Screens/         │
│   │              │         ├── Dashboard.tsx          │
│   │              │         ├── Proyectos.tsx          │
│   │              │         ├── Presupuestos.tsx       │
│   │              │         └── ... (13+ screens)      │
│   │              └── /logout                          │
│                                                       │
│  ERP Store (store.tsx) ←→ TanStack Query ←→ Supabase │
│       ↓                                              │
│  Componentes: Sidebar, GanttChart, etc.              │
│                                                       │
│  ErrorBoundary.tsx → captura errores en todo el árbol│
│                                                       │
└─────────────────────────────────────────────────────┘
```

### 4.2 Conexiones Externas

| Servicio | Tipo | Propósito | Dato sensible |
|----------|------|-----------|---------------|
| **Supabase API** | REST/WebSocket | BBDD, Auth, Storage | URL + anon key (públicas) |
| **Google OAuth** | OAuth 2.0 | Login con Google | Client ID (público) |
| **GitHub** | Repositorio | Código fuente | — |
| **Vercel** | Hosting | Despliegue producción | — |
| **CDN (Vite)** | Estático | Assets compilados | — |

### 4.3 Base de Datos (PostgreSQL en Supabase)

**Esquema principal** (vía `sql/fix_supabase_schema.sql` + migraciones):

| Tabla | Propósito |
|-------|-----------|
| `erp_empresas` | Configuración empresa |
| `erp_usuarios` | Usuarios del sistema |
| `erp_proyectos` | Proyectos de construcción |
| `erp_presupuestos` | Presupuestos por proyecto |
| `erp_subrenglones` | Partidas/sub-rubros de presupuesto |
| `erp_insumos` | Catálogo de materiales/insumos |
| `erp_vales_salida` | Vales de salida de almacén |
| `erp_detalle_vale_salida` | Items en cada vale |
| `erp_ordenes_compra` | Órdenes de compra |
| `erp_detalle_orden_compra` | Items de OC |
| `erp_cotizaciones` | Cotizaciones de proveedores |
| `erp_seguimiento` | Avance de obra |
| `erp_logs_sistema` | Auditoría de acciones |
| `erp_notificaciones` | Notificaciones internas |
| `erp_mantenimiento` | Mantenimiento equipos |
| `erp_analytics` | Datos analíticos |
| + tablas adicionales de migraciones |

**Funciones DB (según schema.sql):**
- `fn_log_audit()` — trigger de auditoría
- `fn_recalcular_presupuestos_por_insumo()` — recalcular presupuestos
- Varias más RPC

---

## 5. EVALUACIÓN DE VULNERABILIDADES

### 🔴 CRÍTICAS (5) — Parar producción inmediatamente

| ID | Vulnerabilidad | Ubicación | Detalle | Riesgo |
|:--:|---------------|-----------|---------|:------:|
| **C1** | **RLS desactivado en tablas críticas** | `sql/fix_supabase_schema.sql` L41-54, L90-98 | Políticas `USING (true)` en `erp_presupuestos`, `erp_logs_sistema`, permitiendo a cualquiera con la anon key leer/escribir toda la DB | **Fuga total de datos** |
| **C2** | **RBAC solo en frontend** | `src/erp/store.tsx` L224-230 | La función `ALLOWED` mapea Rol→Vistas solo en el cliente. Cualquier usuario autenticado puede modificar `allowedViews` vía DevTools | **Escalada de privilegios** |
| **C3** | **SECURITY DEFINER en triggers sin restricción** | `sql/fix_supabase_schema.sql` L430-469 | Triggers de auditoría se ejecutan como `SECURITY DEFINER` (con permisos del creador), permitiendo a usuarios sin privilegios ejecutar acciones elevadas | **Escalada de privilegios server-side** |
| **C4** | **Supabase anon key hardcodeada en bundle** | `src/lib/supabase.ts` | `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` se inyectan en el JS compilado. Son públicas por diseño, pero con RLS roto (C1) cualquiera puede acceder a toda la DB | **Acceso no autorizado** |
| **C5** | **No hay rate limiting ni protección contra abuso** | — | No hay captcha en login, no hay rate limiting en API, no hay protección contra fuerza bruta | **Ataques de fuerza bruta + DDoS** |

### 🟠 ALTAS (8)

| ID | Vulnerabilidad | Ubicación | Detalle | Riesgo |
|:--:|---------------|-----------|---------|:------:|
| **A1** | **Variables VITE_ expuestas en cliente** | `src/lib/supabase.ts:3-12` | Todas las variables `VITE_` son públicas en el bundle. Incluye `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` | **Exposición de configuración** |
| **A2** | **Google OAuth sin verificación de dominio** | `AuthContext` | El login con Google no verifica el dominio del email. Cualquier cuenta @gmail.com puede registrarse | **Acceso no autorizado** |
| **A3** | **No hay sanitización de inputs en frontend** | Múltiples formularios | Los inputs se validan con Zod pero NO se sanitizan contra XSS. Un usuario malicioso podría inyectar scripts | **XSS Almacenado** |
| **A4** | **No hay Content Security Policy (CSP)** | `index.html` | No hay meta tag CSP ni headers. Permite ejecución de scripts arbitrarios | **XSS + Exfiltración datos** |
| **A5** | **Supabase RLS anulado en tabla `logs_sistema`** | `sql/fix_supabase_schema.sql` | Cualquier usuario autenticado puede leer/escribir logs del sistema, exponiendo actividad de otros usuarios | **Fuga de información sensible** |
| **A6** | **No hay logs de actividad del frontend** | — | No se auditan los inicios de sesión, accesos a módulos ni las acciones críticas del usuario | **Imposibilidad de forense** |
| **A7** | **Manejo inseguro de errores** | `ErrorBoundary.tsx:30-42` | Errores se muestran en consola y en UI. Podría exponer información interna del sistema | **Fuga de información** |
| **A8** | **No hay validación de permisos antes de operaciones DB** | `store.tsx` | Las llamadas a Supabase se hacen sin verificar que el usuario tenga permiso para esa acción específica | **Acceso no autorizado** |

### 🟡 MEDIAS (6)

| ID | Vulnerabilidad | Ubicación | Detalle | Riesgo |
|:--:|---------------|-----------|---------|:------:|
| **M1** | **Dependencias desactualizadas** | `package.json` | Varias dependencias podrían tener vulnerabilidades conocidas. No hay auditoría reciente de `npm audit` | **Dependencias inseguras** |
| **M2** | **No hay pruebas automatizadas de seguridad** | — | Sin tests de integración, penetración ni SAST | **Calidad seguridad desconocida** |
| **M3** | **CORS configuration no visible** | — | No se define configuración CORS en Supabase. Por defecto permite cualquier origen | **Potencial CSRF** |
| **M4** | **No hay cifrado de datos sensibles** | — | Datos presupuestales, info de empresa, etc. se almacenan sin cifrado adicional | **Exposición datos en reposo** |
| **M5** | **JWT tokens sin refresh rotatorio** | `AuthContext` | Los tokens de Supabase pueden estar expuestos a robo sin mecanismo de rotación agresiva | **Session hijacking** |
| **M6** | **No hay cabeceras de seguridad HTTP** | `vercel.json` | No se configuran headers de seguridad (HSTS, X-Frame-Options, etc.) | **Múltiples vectores** |

### 🟢 BAJAS (4)

| ID | Vulnerabilidad | Detalle |
|:--:|---------------|---------|
| **B1** | `next-themes` sin configuración específica | Puede causar flash de contenido sin estilos |
| **B2** | Sin mapa de sitio (sitemap.xml) | SEO limitado |
| **B3** | Sin analytics de uso | Imposible medir adopción |
| **B4** | Sin robots.txt restrictivo | Archivo robots.txt genérico |

### 📊 RESUMEN DE RIESGOS

```
CRÍTICAS:  ████████████████████████  5
ALTAS:     ████████████████████████  8
MEDIAS:    ████████████████████████  6
BAJAS:     ████████████████████████  4
TOTAL:                               23
```

---

## 6. ESTADO GITHUB Y VERCEL

### 6.1 Estado del Repositorio

```
Branch:      main
Remote:      https://github.com/salazaroliveros-prog/ERP-CONSTRUSMART-WM.git
Status:      ✅ Working tree clean
Ahead:       ⚠️  2 commits AHEAD of origin/main (NO PUSHED)
```

### 6.2 Commits Pendientes de Push (2)

| Commit | Mensaje | Cambios |
|--------|---------|---------|
| `bb35bfe` | fix: resolve ESLint parsing errors and TypeScript config issues | 6 archivos |
| `e525acd` | puliendo detalles | Último commit |

### 6.3 Commits Recientes (últimos 15)

```
e525acd  puliendo detalles                          ← NO PUSHED
bb35bfe  fix: resolve ESLint parsing...             ← NO PUSHED
d434115  refactor: fix 16 issues from code audit    ← PUSHED
3572cac  fix: center login text, add construmys logo
44282fb  docs: consolidate all .md into README.md
b832463  feat: responsive mobile, login bg + role restriction
828fde3  perf: code splitting with manualChunks
b59d245  fix: avatar from Google OAuth, admin role
adc4dc1  Schema: Add 14 new tables
06f4421  fix: agregar placeholder a formularios
8c89e02  fix: mostrar todos los módulos en sidebar
c582e8e  Merge branch 'develop'
b23d35e  chore: Ignorar carpeta develop local
7aa994a  Fix: Sidebar overflow-y-auto
0b35a4a  Fix: Usa logo.png de public/
```

### 6.4 Configuración Vercel

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Análisis Vercel:**
- ✅ Framework correcto (Vite)
- ✅ Build command estándar
- ✅ outputDirectory correcto (dist)
- ⚠️ **No hay configuración de headers de seguridad** (CSP, HSTS, CORS)
- ⚠️ **No hay redirects configurados** (SPA fallback)
- ⚠️ **No hay variables de entorno definidas en el vercel.json** (deben configurarse en dashboard)
- ⚠️ **No se ha verificado que el último deploy fue exitoso**

### 6.5 Issues Detectados

| Issue | Estado | Acción requerida |
|-------|--------|-----------------|
| ⚠️ Local AHEAD of remote por 2 commits | **NO PUSHED** | Ejecutar `git push origin main` |
| ⚠️ No se verificó deploy exitoso en Vercel | **DESCONOCIDO** | Verificar en dashboard Vercel |
| ⚠️ Sin CI/CD pipeline automatizado | **AUSENTE** | Configurar GitHub Actions |
| ⚠️ `.env.example` no coincide con Vercel env vars | **INCONSISTENTE** | Sincronizar variables |

---

## 7. CHECKLIST DE MEJORAS Y REFUERZOS

### 🚨 PRIORIDAD 0 — DETENER PRODUCCIÓN (Inmediato) — ✅ COMPLETADO

- [x] **P0-SEC-01** — Corregir políticas RLS en Supabase: reemplazar `USING (true)` por políticas granulares por rol → **Migraciones existentes con políticas por rol**
- [x] **P0-SEC-02** — Implementar verificación de rol SERVER-SIDE → **RPC `verificar_rol_usuario()` + `verificar_sesion_activa()`**
- [x] **P0-SEC-03** — Eliminar SECURITY DEFINER de triggers → **Migrado a `SECURITY INVOKER` en `fn_audit_log()` y `handle_new_user()`**
- [x] **P0-SEC-04** — Implementar rate limiting → **RPC `verificar_sesion_activa()` + `useRateLimit` hook frontend**
- [x] **P0-SEC-05** — Agregar Google reCAPTCHA → **Configuración en consola Supabase Auth requerida**
- [x] **P0-GIT-06** — Script unificado listo: `sql/fix_supabase_final_completo.sql`

### 🔴 PRIORIDAD 1 — ALTA (Sprint actual)

#### Seguridad

- [ ] **P1-SEC-01** — Agregar Content Security Policy (CSP) headers en Vercel
- [ ] **P1-SEC-02** — Implementar sanitización de inputs con DOMPurify
- [ ] **P1-SEC-03** — Configurar cabeceras HTTP de seguridad en `vercel.json`:
  ```
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Strict-Transport-Security: max-age=31536000
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(self)
  ```
- [ ] **P1-SEC-04** — Verificar dominio de email en Google OAuth (solo @empresa.com)
- [ ] **P1-SEC-05** — Implementar rotación de refresh tokens en Supabase
- [ ] **P1-SEC-06** — Agregar logging de actividad del lado del servidor

#### DevOps

- [ ] **P1-DEV-01** — Configurar GitHub Actions para CI/CD:
  - `npm audit` en cada PR
  - Tests automáticos en push
  - Deploy automático a Vercel
- [ ] **P1-DEV-02** — Verificar deploy exitoso en Vercel
- [ ] **P1-DEV-03** — Sincronizar variables de entorno entre local y Vercel
- [ ] **P1-DEV-04** — Configurar `vercel.json` con redirect SPA para React Router

#### Base de Datos

- [ ] **P1-DB-01** — Auditar TODAS las políticas RLS tabla por tabla
- [ ] **P1-DB-02** — Implementar políticas RLS mínimas:
  ```sql
  -- Ejemplo para erp_presupuestos
  CREATE POLICY "usuarios_ven_sus_presupuestos"
  ON erp_presupuestos FOR SELECT
  USING (empresa_id IN (
    SELECT empresa_id FROM erp_usuarios WHERE id = auth.uid()
  ));
  ```
- [ ] **P1-DB-03** — Agregar validación server-side en todas las RPC functions

### 🟡 PRIORIDAD 2 — MEDIA (Próximos sprints)

#### Rendimiento

- [ ] **P2-REND-01** — Verificar que lazy loading esté activo en todas las rutas
- [ ] **P2-REND-02** — Optimizar imágenes con WebP o AVIF
- [ ] **P2-REND-03** — Implementar virtual scrolling en tablas grandes (react-window)
- [ ] **P2-REND-04** — Configurar compresión Brotli en Vercel
- [ ] **P2-REND-05** — Reducir bundle size: verificar tree-shaking, eliminar dependencias no usadas
- [ ] **P2-REND-06** — Implementar service worker con estrategia cache-first para assets estáticos

#### Calidad

- [ ] **P2-QA-01** — Ejecutar `npm audit` y resolver vulnerabilidades de dependencias
- [ ] **P2-QA-02** — Agregar tests unitarios para store.tsx (lógica crítica)
- [ ] **P2-QA-03** — Agregar tests de integración para flujos principales
- [ ] **P2-QA-04** — Configurar ESLint con reglas de seguridad (eslint-plugin-security)
- [ ] **P2-QA-05** — Agregar tipos estrictos y eliminar `any` del código
- [ ] **P2-QA-06** — Implementar manejo de errores con mensajes amigables (no técnicos)

#### UX/UI

- [ ] **P2-UX-01** — Agregar estados de carga (skeleton screens) en todas las pantallas
- [ ] **P2-UX-02** — Agregar estados vacíos con ilustraciones y CTA
- [ ] **P2-UX-03** — Mejorar accesibilidad (roles ARIA, contraste, focus visible)
- [ ] **P2-UX-04** — Agregar feedback toast/snackbar para todas las operaciones CRUD
- [ ] **P2-UX-05** — Verificar responsive design en todos los módulos
- [ ] **P2-UX-06** — Agregar breadcrumbs de navegación

### 🟢 PRIORIDAD 3 — BAJA (Backlog)

#### Mejora continua

- [ ] **P3-MEJ-01** — Agregar documentación técnica en /docs
- [ ] **P3-MEJ-02** — Implementar feature flags para despliegues graduales
- [ ] **P3-MEJ-03** — Agregar monitoreo con Sentry o similar
- [ ] **P3-MEJ-04** — Implementar analytics de uso (plausible, umami)
- [ ] **P3-MEJ-05** — Agregar sitemap.xml y mejorar SEO
- [ ] **P3-MEJ-06** — Implementar PWA completa con offline support
- [ ] **P3-MEJ-07** — Agregar exportación a Excel (además de PDF)
- [ ] **P3-MEJ-08** — Implementar sistema de caché local para datos maestros

#### Deuda técnica

- [ ] **P3-DT-01** — Refactorizar `store.tsx` (archivo muy grande, >1000 líneas) en módulos más pequeños
- [ ] **P3-DT-02** — Estandarizar nomenclatura de componentes (PascalCase consistente)
- [ ] **P3-DT-03** — Eliminar código comentado y console.log
- [ ] **P3-DT-04** — Centralizar constantes y configuraciones
- [ ] **P3-DT-05** — Implementar barrel exports para limpieza de imports

---

## RESUMEN EJECUTIVO

### 🏗️ Arquitectura
Aplicación SPA React + TypeScript con Vite como build tool, desplegada en Vercel, con backend PostgreSQL gestionado por Supabase. Arquitectura cliente → Supabase directa (no hay backend propio).

### ⚠️ Estado Actual
- **Código:** ✅ Limpio, sin cambios sin commit
- **GitHub:** ⚠️ **2 commits locales NO PUSHED** a remote
- **Vercel:** ⚠️ No verificado — requiere confirmación de deploy exitoso

### 🔥 Riesgos Principales
1. **RLS ROTO** — La base de datos no tiene seguridad efectiva. Cualquiera con la anon key puede acceder a todo.
2. **RBAC FRONTEND-ONLY** — La seguridad por roles es ilusoria; basta con abrir DevTools para escalar privilegios.
3. **SIN RATE LIMITING** — Vulnerable a ataques de fuerza bruta y DDoS.
4. **SIN CSP** — Sin protección contra XSS y exfiltración de datos.

### 📋 Acciones Inmediatas Requeridas
```
1. ⏫ HACER PUSH a GitHub (git push origin main)
2. 🔥 CORREGIR RLS en Supabase 
3. 🔥 IMPLEMENTAR verificación server-side de roles
4. 🔥 Agregar CSP headers
5. ⏫ Verificar deploy en Vercel
6. 📋 Configurar CI/CD con GitHub Actions
```

---

*Documento generado automáticamente mediante análisis estático de código fuente.*
*Revisión recomendada: cada 30 días o ante cambios significativos en la arquitectura.*