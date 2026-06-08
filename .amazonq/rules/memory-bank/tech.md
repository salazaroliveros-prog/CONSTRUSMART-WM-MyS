# CONSTRUSMART ERP — Technology Reference

## Core Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | ^18.3.1 |
| Language | TypeScript | ^5.9.3 |
| Build Tool | Vite | ^5.4.21 |
| Styling | TailwindCSS | ^3.4.19 |
| UI Primitives | shadcn/ui (Radix UI) | various |
| UI Library | Ant Design (antd) | ^5.29.3 |
| Routing | React Router v6 | ^6.26.2 |
| State (Context) | React Context + useState | built-in |
| State (Redux) | Redux Toolkit | ^2.12.0 |
| Backend/Auth/DB | Supabase | ^2.49.4 |
| Testing | Vitest | ^3.2.6 |
| Linting | ESLint | ^9.39.4 |
| Deploy | Vercel | — |

---

## Key Dependencies

### Forms & Validation
- `react-hook-form` ^7.53.0 — form state management
- `zod` ^3.23.8 — schema validation (used with `@hookform/resolvers`)

### Data & Charts
- `recharts` ^2.12.7 — charts (cash flow, S-curves, KPIs)
- `@tanstack/react-query` ^5.56.2 — server state / cache
- `date-fns` ^3.6.0 — date utilities
- `dayjs` ^1.11.21 — date utilities (Ant Design compat)

### Export
- `jspdf` ^4.2.1 — PDF generation
- `jspdf-autotable` ^5.0.8 — PDF tables
- `html2canvas` ^1.4.1 — screenshot to canvas
- `xlsx` ^0.18.5 (devDependency) — Excel export

### BIM / 3D
- `three` ^0.184.0 — 3D rendering
- `web-ifc` ^0.0.77 — IFC file parsing
- Manual chunks: `three` and `web-ifc` split separately in build

### Maps
- `leaflet` ^1.9.4 + `react-leaflet` ^5.0.0
- `@types/leaflet` ^1.9.21

### Security
- `dompurify` ^3.2.4 — XSS sanitization
- `@sentry/react` ^10.56.0 — error monitoring

### i18n
- `i18next` ^26.3.1 + `react-i18next` ^17.0.8
- Languages: `es.json` + `en.json` (672+ keys each)

### Animations
- `framer-motion` ^12.40.0

### PWA / QR
- `html5-qrcode` ^2.3.8 — QR scanner
- Service worker at `public/sw.js`
- Web App Manifest at `public/manifest.json`

### Utilities
- `uuid` ^11.1.0 — ID generation
- `clsx` ^2.1.1 + `tailwind-merge` ^2.5.2 → `cn()` helper in `lib/utils.ts`
- `class-variance-authority` ^0.7.1 — variant-based class generation
- `lucide-react` ^0.462.0 — icon library
- `sonner` ^1.5.0 — toast notifications
- `next-themes` ^0.3.0 — dark/light mode

---

## Development Commands

```bash
npm run dev          # Dev server at http://localhost:8080
npm run build        # Production build → dist/
npm run build:dev    # Build in development mode
npm run preview      # Preview production build locally
npm run typecheck    # TypeScript check (no emit)
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run test         # Vitest run (all tests once)
npm run security:audit   # npm audit --audit-level=high
npm run security:check   # better-npm-audit
```

---

## Environment Variables

```env
# .env (required)
VITE_SUPABASE_URL=https://neygzluxugodiwcuctbj.supabase.co
VITE_SUPABASE_KEY=<anon_key>
```

All env vars are prefixed `VITE_` for Vite client exposure.

---

## Build Configuration (vite.config.ts)

- **JSX:** esbuild automatic transform (`jsxImportSource: "react"`) — no Babel plugin needed
- **Path alias:** `@` → `./src`
- **Port:** 8080
- **Chunk splitting:**
  - `three` → separate chunk
  - `web-ifc` → separate chunk
  - `ofimatica` → `jspdf`, `html2canvas`, `xlsx`
  - `antd` → `antd`, `@ant-design/icons`
- **Chunk size warning limit:** 2000 KB

---

## TypeScript Configuration

- `tsconfig.json` — project references root
- `tsconfig.app.json` — app source (strict mode)
- `tsconfig.node.json` — Vite config / scripts

---

## Testing (Vitest)

- Config: `vitest.config.ts`
- Test location: `src/erp/__tests__/`
- Test files: `store.test.ts`, `store.presupuestos.test.ts`, `store.ordenes.test.ts`, `financiero.test.ts`, `integrity.test.ts`, `utils.test.ts`
- Total: 76 tests
- Run once (no watch): `npm run test`

---

## Supabase Configuration

- **Auth flow:** PKCE (`flowType: 'pkce'`)
- **Client:** singleton in `src/lib/supabase.ts`
- **Realtime:** enabled on 31 tables via `REPLICA IDENTITY FULL`
- **RLS:** row-level security on all tables, policies by role from `public.profiles`
- **Storage:** optional buckets for file uploads
- **Migrations directory:** `supabase/migrations/` (run in numeric order)

### Migration Order
1. `000000000001_full_schema_base_and_policies.sql` — Base schema + RLS
2. `000000000002_complementary_tables_and_realtime.sql` — Additional tables + realtime

---

## CI/CD

- **Pipeline:** `.github/workflows/ci-cd.yml`
- **Deploy:** Vercel (auto-deploy on push to `main`)
- **Vercel config:** `vercel.json` + `.vercelignore`
- **Output dir:** `dist/`

---

## Code Quality Tools

- **ESLint:** `eslint.config.js` with `eslint-plugin-react`, `eslint-plugin-react-hooks`, `typescript-eslint`
- **PostCSS:** `postcss.config.js` with autoprefixer
- **Tailwind:** `tailwind.config.ts`

---

## shadcn/ui Configuration

- Config file: `components.json`
- Components location: `src/components/ui/`
- Style: New York style variant
- Uses Radix UI primitives throughout

---

## Node / npm Requirements

- Node: `>=18.0.0`
- npm: `>=9.0.0`
- Package type: `"module"` (ESM)
