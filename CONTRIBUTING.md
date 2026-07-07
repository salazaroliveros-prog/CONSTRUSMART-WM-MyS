# Guía de Contribución — CONSTRUSMART ERP

## Stack Tecnológico

- **Frontend:** React 18.3 + TypeScript 5.5 + Vite 5.4
- **UI:** Ant Design 5.29 + Tailwind CSS + Shadcn UI
- **Estado:** Context Store (ErpProvider) + Zustand
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **Tests:** Vitest + Testing Library + Playwright
- **Exportación:** jsPDF + html2canvas + xlsx

## Convenciones de Código

### Sin comentarios en código
No usar `//` o `/* */` en código fuente. La documentación va en archivos `.md` separados.

### Schemas Zod
- Los schemas canónicos viven en `src/erp/store/schemas/`
- NO redefinir schemas inline en componentes
- Usar `z.enum([...] as const)` para enums
- Todo schema debe alinearse 1:1 con su interfaz TypeScript

### Store
- `src/erp/store.tsx`: ErpProvider, contexto, loadFromStorage, mutation queue
- `src/erp/zustandStore.ts`: Estado global con persistencia
- Nuevas entidades: usar `loadFromStorage` con schema canónico
- `forceSync` envía INSERT/UPDATE/DELETE a Supabase

### Vistas
- `View` type en store.tsx
- Lazy import en AppLayout.tsx
- `ALLOWED` por rol en security.ts

### i18n
- `t()` con formato interpolación `{{key}}`
- Keys en `src/lib/i18n/es.json` y `en.json`

## Flujo de Trabajo

1. **Fork** el repositorio
2. **Branch** desde `main`: `git checkout -b feature/nombre`
3. **Desarrollo** siguiendo las convenciones
4. **Tests**: `npm run test` — todos deben pasar
5. **Typecheck**: `npm run typecheck` — 0 errores
6. **Build**: `npm run build` — exitoso
7. **Commit** con mensaje descriptivo
8. **Push** y **Pull Request**

## Commits

Usar prefijos descriptivos:
- `P0:` — Alta prioridad (bugs, bloqueantes)
- `P1:` — Media prioridad (features)
- `P2:` — Baja prioridad (docs, mejoras menores)
- `FIX:` — Corrección de bugs
- `TEST:` — Tests únicamente

## Tests

- Unitarios: `src/__tests__/*.test.ts(x)`
- Store: `src/erp/__tests__/*.test.ts`
- E2E: `e2e/*.spec.ts` (Playwright)
- Ejecutar: `npm run test`
- Cobertura: `npm run test -- --coverage`

## Estructura de Directorios

```
src/
  __tests__/          # Tests unitarios globales
  components/         # Componentes compartidos (Animations, AppLayout, ui/)
  erp/
    components/       # Componentes específicos ERP (Sidebar, Header, Charts)
    screens/          # 38 pantallas lazy-loaded
    store/            # Schemas Zod + store
    services/         # Servicios (motorCalculo, weather, etc.)
    utils.ts          # Utilidades + AppSettings type
    zustandStore.ts   # Estado global
  hooks/              # Custom hooks
  lib/                # Utilidades (themes, i18n, supabase, etc.)
  styles/             # CSS (design-tokens, themes, responsive)
  workers/            # Web Workers
```

## Preguntas

Abrir un issue en GitHub con label `question`.