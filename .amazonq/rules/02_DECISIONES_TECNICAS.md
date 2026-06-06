# 🏛️ DECISIONES TÉCNICAS — ERP CONSTRUSMART
> Registro de decisiones tomadas. NO revertir sin consultar al usuario.
> Última actualización: 2026-06-05

---

## Decisiones de arquitectura

| # | Decisión | Razón | Fecha |
|---|----------|-------|-------|
| D-01 | Context API + localStorage (no Redux/Zustand) | Simplicidad, sin dependencias extra, offline-first | Pre-2026 |
| D-02 | Supabase como BaaS | Auth, DB, Storage, Realtime en un servicio | Pre-2026 |
| D-03 | shadcn/ui + TailwindCSS (no MUI/Ant) | Control total, bundle size, branding | Pre-2026 |
| D-04 | Lazy loading en todas las rutas | Performance, bundle splitting | 2026-06-05 |
| D-05 | web-ifc incluido en bundle (~3.6MB) | Necesario para visor BIM en browser | Pre-2026 |
| D-06 | PKCE flow para OAuth (no implicit) | Seguridad, recomendado por Supabase | Pre-2026 |
| D-07 | RLS a nivel Supabase + RBAC en frontend | Doble capa de seguridad | Pre-2026 |

---

## Decisiones de código

| # | Decisión | Archivo | Fecha |
|---|----------|---------|-------|
| C-01 | useRef para evitar ciclo en Bodega.tsx | `src/erp/screens/Bodega.tsx` | 2026-06-05 |
| C-02 | sanitizarTexto() en TODAS las vars de export.ts | `src/erp/export.ts` | 2026-06-05 |
| C-03 | Zod + react-hook-form como patrón estándar de forms | CRM.tsx, Administracion.tsx | 2026-06-05 |
| C-04 | i18n con JSON plano (no i18next) — keys en es.json/en.json | `src/lib/i18n/` | 2026-06-05 |
| C-05 | store.tsx monolítico (no refactorizado) — decisión pendiente P8 | `src/erp/store.tsx` | 2026-06-05 |
| C-06 | Tema naranja CONSTRUSMART: `--primary: 18 80% 52%` | `src/index.css` | 2026-06-05 |

---

## Decisiones de infraestructura

| # | Decisión | Archivo | Fecha |
|---|----------|---------|-------|
| I-01 | Vercel para deploy (no Netlify/AWS) | `.vercel/` | Pre-2026 |
| I-02 | Puerto dev: 8080 (no 3000/5173) | `vite.config.ts` | Pre-2026 |
| I-03 | CSP + HSTS + X-Frame-Options en vercel.json | `vercel.json` | Pre-2026 |
| I-04 | Service Worker en public/sw.js para PWA | `public/sw.js` | Pre-2026 |

---

## Decisiones descartadas

| # | Opción descartada | Por qué | Alternativa usada |
|---|-------------------|---------|-------------------|
| X-01 | Redux Toolkit | Overhead innecesario para este proyecto | Context API |
| X-02 | i18next | Dependencia extra, JSON plano es suficiente | JSON nativo |
| X-03 | Prisma/Drizzle | Ya hay Supabase como ORM | Supabase client |
| X-04 | Storybook | No es prioridad en este sprint | - |
