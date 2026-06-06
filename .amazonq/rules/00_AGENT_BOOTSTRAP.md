# 🤖 BOOTSTRAP AGENTE — ERP CONSTRUSMART
> Este archivo se carga automáticamente en CADA sesión de Amazon Q.
> NO modificar sin actualizar también AGENTE_CONSTRUSMART_ERP.md
> Última sesión: 2026-06-05

---

## ⚡ LECTURA OBLIGATORIA AL INICIO DE SESIÓN

1. Lee este archivo completo (3 min)
2. Lee `.amazonq/rules/01_ESTADO_ACTUAL.md` para ver qué hay pendiente
3. Continúa donde se dejó — NO repitas trabajo ya hecho

---

## 📌 IDENTIDAD DEL PROYECTO

- **Nombre:** CONSTRUSMART ERP
- **Stack:** React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui + Supabase
- **Deploy:** https://erp-construsmart-wm-app-01.vercel.app/
- **Repo:** https://github.com/salazaroliveros-prog/ERP-CONSTRUSMART-WM.git
- **Build:** ✅ 0 errores | **Tests:** ✅ 76/76 | **Docs-código:** ~98%

---

## 🗂️ ARCHIVOS DE MEMORIA DEL AGENTE

| Archivo | Propósito |
|---------|-----------|
| `.amazonq/rules/00_AGENT_BOOTSTRAP.md` | **Este archivo** — Contexto base, se lee primero |
| `.amazonq/rules/01_ESTADO_ACTUAL.md` | Estado pendiente, próximo paso, sesión activa |
| `AGENTE_CONSTRUSMART_ERP.md` | Referencia técnica completa (arquitectura, tipos, pantallas) |
| `TODO_CHECKLIST.md` | Todas las tareas con estado actual |
| `CONTEXT.md` | Contexto UX/UI auditoría |

---

## 🏗️ ARQUITECTURA RÁPIDA

```
src/
├── erp/
│   ├── store.tsx        → Estado global (~1485 líneas), Context API + localStorage
│   ├── types.ts         → 48 interfaces TypeScript (575 líneas)
│   ├── screens/         → 34 pantallas
│   ├── components/      → 25+ componentes
│   └── __tests__/       → 76 tests
├── components/ui/       → shadcn/ui components
├── lib/
│   ├── supabase.ts      → Cliente Supabase
│   └── security.ts      → RBAC + sanitización XSS
└── hooks/               → 8 hooks personalizados
```

---

## ✅ QUÉ YA ESTÁ HECHO (NO REPETIR)

### Seguridad (100% completo)
- Session timeout 30min, CSRF, rate limiting, debounce
- RLS en todas las tablas Supabase
- Sanitización XSS en export.ts, security.ts
- CSP/HSTS en vercel.json
- ErrorBoundary global
- Zod validation en CRM.tsx y Administracion.tsx
- useEffect cycle fix en Bodega.tsx (useRef pattern)

### UX/UI (100% completo — 34 hallazgos)
- Dark mode tokens normalizados
- Tipografía/espaciado/responsivo/animaciones
- WCAG AA focus states, ARIA labels
- Tema naranja CONSTRUSMART brand
- Theme generator + WCAG contrast checker

### Features (F-01 a F-16 completos)
- CxC, CxP, Riesgos, Hitos, Filtro global
- Supabase Realtime, Notificaciones push
- Tests unitarios (76/76)
- i18n: `src/lib/i18n/es.json` (672 keys) + `en.json` ✅ IMPLEMENTADO

---

## ❌ PENDIENTES (VER 01_ESTADO_ACTUAL.md para detalle)

| # | Item | Esfuerzo |
|---|------|----------|
| P1 | Zod validation en LogisticaCompras.tsx, SSOCalidad.tsx, GestionDocumental.tsx | ~3h |
| P2 | Imágenes WebP/AVIF | ~2h |
| P3 | Virtual scrolling en tablas grandes | ~3h |
| P4 | Sentry monitoreo | ~2h |
| P5 | Migraciones SQL pendientes (000000000004 al 000000000008) ejecutar en Supabase | Manual |
| P6 | Google OAuth domain verification | Manual |
| P7 | Refresh token rotation Supabase | ~1h |
| P8 | Refactorizar store.tsx en módulos | ~4h |

---

## 🔧 PATRONES DE CÓDIGO (COPY-PASTE)

### Agregar nueva pantalla:
1. Crear `src/erp/screens/NuevaPantalla.tsx` (copiar patrón de `Riesgos.tsx`)
2. Lazy import en `src/components/AppLayout.tsx`
3. Agregar al VIEW type en `src/erp/store.tsx`
4. Agregar item en `src/erp/components/Sidebar.tsx`

### Agregar validación Zod (patrón existente):
```typescript
// Ver CRM.tsx o Administracion.tsx para el patrón exacto
import { z } from 'zod'
const schema = z.object({ nombre: z.string().min(1, 'Requerido') })
type FormData = z.infer<typeof schema>
```

### Acceder al store:
```typescript
const { proyectos, addProyecto, updateProyecto } = useErp()
```

---

## 📋 REGLAS DEL AGENTE

1. **NUNCA** eliminar código existente sin que el usuario lo pida explícitamente
2. **SIEMPRE** verificar build después de cambios: `npm run build`
3. **SIEMPRE** actualizar `01_ESTADO_ACTUAL.md` al terminar una sesión
4. **NO** agregar tests a menos que el usuario lo pida
5. **NO** repetir trabajo marcado como ✅ en TODO_CHECKLIST.md
6. Usar el mismo estilo de código que el proyecto (TypeScript estricto, shadcn/ui, TailwindCSS)
7. Mantener archivos .md actualizados como única fuente de verdad
