# CONSTRUSMART-WM - Knowledge Graph (Updated)

## 1. Arquitectura General

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Router hash + AuthGate
├── components/
│   ├── AppLayout.tsx        # Shell: Header + Sidebar + main
│   ├── ErrorBoundary.tsx    # Lazy screen wrapper
│   └── ui/                  # shadcn primitives
├── erp/
│   ├── store.tsx            # ErpProvider: contexto React + persistencia
│   ├── store/
│   │   ├── schemas/         # Zod canónicos (bodega, rrhh, admin, …)
│   │   └── zustandStore.ts  # Estado global Zustand + forceSync
│   ├── types.ts             # Interfaces TypeScript
│   ├── screens/             # 34 pantallas lazy-loaded
│   ├── components/          # Header, Sidebar, Charts, Forms…
│   └── utils.ts / export.ts
├── hooks/
│   ├── useAuth.ts           # Google OAuth (single-user admin)
│   ├── useSupabaseRealtime.ts
│   └── useSessionTimeout.ts
├── lib/
│   ├── supabase.ts          # Cliente Supabase
│   ├── store-health.ts      # scheduleHealthCheck
│   └── i18n/                # es.json / en.json
├── styles/
│   ├── themes.css
│   └── responsive.css
└── __tests__/               # 619 tests (15 archivos)
```

## 2. Estado Global y Persistencia
### ErpProvider (`src/erp/store.tsx`)
- **View**: hash routing (`#dashboard`, `#proyectos`, …)
- **User**: Google OAuth (admin único)
- **Persistencia**: localStorage comprimido (lz-string) por entidad
- **Syncing**: `forceSync()` envía mutationQueue a Supabase

### Auth (`src/hooks/useAuth.ts`)
- Google OAuth → `supabase.auth.signInWithOAuth('google')`
- `buildUserFromSession` lee `user_metadata`:
  - `nombre`: `full_name || name || email.split('@')[0]`
  - `avatar`: `picture || avatar_url`
  - `rol`: fijo `'Administrador'`
- **Sin RBAC**: cualquier sesión admin tiene acceso total a TODAS las vistas (`ALL_VIEWS`)

## 3. Entry Points y Flujos Críticos

### Login → Dashboard
```
Login.tsx (click Google)
  → useAuth.signInWithGoogle()
    → supabase.auth.signInWithOAuth('google')
      → redirect Google
        → redirect app con token
          → buildUserFromSession()
            → setUser(validated)
              → ErpProvider user = authUser (admin)
                → Header avatar/nombre real
                  → window.location.hash = '#dashboard'
```

### Post-Login Admin
- **allowedViews**: TODAS las vistas (`ALL_VIEWS`)
- **Default view**: `dashboard`
- **Avatar**: Google `picture` o customPhoto desde localStorage
- **Nombre**: Google `full_name`

## 4. Archivos Clave para Modificaciones

| Cambio | Archivo |
|--------|---------|
| Auth/roles | `src/hooks/useAuth.ts`, `src/erp/store.tsx` |
| Vistas | `src/erp/store.tsx` (View type), `AppLayout.tsx` |
| Gráficas | `src/erp/components/Charts.tsx`, `src/erp/screens/Dashboard.tsx` |
| Datos | `src/erp/store/zustandStore.ts`, schemas Zod |
| UI | `Ajustes.tsx`, `Header.tsx`, `Sidebar.tsx` |

## 5. Estado Actual (2026-06-18)
- **Login**: Google único admin →redirect dashboard automático
- **Avatar**: Google real + fallback custom
- **Nombre**: Google real
- **Vistas**: Acceso total, sin roles ni RBAC (usuario único administrador)
- **Build**: 0 errores
- **Tests**: 619/619 PASS
- **CI**: green
- **Vercel**: deploy automático

## 6. Convenciones
- Sin comentarios en código fuente
- Schemas Zod en `src/erp/store/schemas/`
- Vista default: `dashboard`
- Logout: supabase signOut + setUser(null)
- i18n: `t()` con `{{key}}`
