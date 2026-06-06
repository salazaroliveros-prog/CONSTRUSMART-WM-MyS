# 🤖 BOOTSTRAP AGENTE — ERP CONSTRUSMART (ACTUALIZADO 2026-06-07)
> Última auditoría exhaustiva: 2026-06-07
> Todos los pendientes verificados contra código fuente
> FALSOS POSITIVOS CORREGIDOS

---

## ⚡ LECTURA OBLIGATORIA AL INICIO DE SESIÓN

1. Lee este archivo completo (3 min)
2. Lee `.amazonq/rules/AUDITORIA_EXHAUSTIVA_2026-06-07.md` para verificación completa
3. Lee `.amazonq/rules/01_ESTADO_ACTUAL.md` para próximos pasos
4. Continúa donde se dejó — NO repitas trabajo ya hecho

---

## 📌 IDENTIDAD DEL PROYECTO

- **Nombre:** CONSTRUSMART ERP
- **Stack:** React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui + Supabase
- **Deploy:** https://erp-construsmart-wm.vercel.app/
- **Repo:** https://github.com/salazaroliveros-prog/ERP-CONSTRUSMART-WM.git
- **Build:** ✅ 0 errores | **Tests:** ✅ 76/76 | **Seguridad:** ✅ 100%

---

## 📂 ARCHIVOS DE MEMORIA DEL AGENTE

| Archivo | Propósito |
|---------|-----------|
| `00_AGENT_BOOTSTRAP.md` | Contexto base — se lee primero |
| `01_ESTADO_ACTUAL.md` | Estado actual, próximos pasos |
| `02_DECISIONES_TECNICAS.md` | Decisiones arquitectónicas |
| `AUDITORIA_EXHAUSTIVA_2026-06-07.md` | **NUEVO** — Verificación completa vs código |
| `03_PATRONES_CODIGO.md` | Patrones copy-paste |

---

## 🏗️ ARQUITECTURA RÁPIDA

```
src/
├── erp/
│   ├── store.tsx        → Estado global (Context API + localStorage + Supabase sync)
│   ├── types.ts         → 48 interfaces TypeScript
│   ├── screens/         → 34 pantallas (todas lazy-loaded)
│   ├── components/      → 25+ componentes
│   └── __tests__/       → 76 tests (vitest)
├── components/ui/       → shadcn/ui components
├── lib/
│   ├── supabase.ts      → Cliente Supabase (PKCE flow)
│   ├── security.ts      → RBAC + sanitización XSS
│   └── i18n/            → Traducciones (es.json, en.json: 672+ keys)
└── hooks/               → 8 hooks personalizados
```

---

## ✅ VERIFICADO COMPLETADO (NO REPETIR)

### Seguridad (100% implementado)
- ✅ Session timeout 30min, CSRF, rate limiting
- ✅ RLS en todas las tablas Supabase
- ✅ **Sanitización XSS:** sanitizarTexto() + sanitizarObjeto() (escalado HTML)
- ✅ CSP/HSTS en vercel.json
- ✅ ErrorBoundary global
- ✅ **Zod validation:** 100% en 3 archivos (LogisticaCompras, SSOCalidad, GestionDocumental)
- ✅ useEffect cycle fix (useRef pattern)

### Cascadas de Datos (100% implementado)
- ✅ **P1: Validación Stock** → addValeSalida() (store.tsx:2067-2078) — BLOQUEANTE
- ✅ **P2: Cascada OC→Stock** → updateOrden() (store.tsx:1993-2008) — AUTOMÁTICA
- ✅ **P3: Renderización Selectiva** → AppLayout.tsx:128-131 — FILTRA POR ROL
- ✅ **P4: AuthGuard** → AppLayout.tsx:117-121 — BLOQUEANTE
- ✅ **Cascada Avance→Proyecto** → store.tsx:1970-1992 — WEIGHTED AVERAGE

### Funcionalidades (100% implementado)
- ✅ **Zod + react-hook-form:** Patrón en CRM, Administracion, LogisticaCompras, SSOCalidad, GestionDocumental
- ✅ **i18n:** es.json + en.json (672+ keys)
- ✅ **Supabase Realtime:** Subscriptions en 8 tablas
- ✅ **Tests:** 76/76 pasando (Vitest)
- ✅ **Rutas:** 34/34 conectadas, todas lazy-loaded
- ✅ **RBAC:** 5 roles con permisos diferenciados

### UI/UX (100% implementado)
- ✅ Dark mode tokens normalizados
- ✅ Tipografía/espaciado/responsivo/animaciones
- ✅ WCAG AA focus states, ARIA labels
- ✅ Tema naranja CONSTRUSMART brand (#ff8c42)

---

## ❌ PENDIENTES REALES (NO CONFUNDIR CON TESTING)

| # | Item | Categoría | Prioridad | Esfuerzo | Estado |
|---|------|-----------|-----------|----------|--------|
| 1 | Refresh token rotation | Supabase | MEDIA | ~1h | TODO |
| 2 | WebP/AVIF optimización | Performance | BAJA | ~2h | TODO |
| 3 | Virtual scrolling tablas | Performance | BAJA | ~3h | TODO |
| 4 | Refactorizar store.tsx | Arquitectura | BAJA | ~4h | TODO (opcional) |

---

## ⏳ NO SON CÓDIGO QUE FALTE (OPERACIÓN/TESTING MANUAL)

| Item | Tipo | Responsable | Estado |
|------|------|-------------|--------|
| Migraciones SQL (000004-000008) | Operación BD | Usuario | Manual en Supabase |
| OAuth domain verification | Configuración | Usuario | Google Cloud Console |
| Smoke test cascadas | Testing | QA | Prueba manual en UI |
| AuthGuard test por rol | Testing | QA | 5 roles × 2 pantallas |

**IMPORTANTE:** Estos NO son "pendientes de desarrollo" — son operaciones de configuración/validación manual que el usuario ejecuta.

---

## 🔧 PATRONES DE CÓDIGO (COPY-PASTE)

### Zod validation (patrón estándar)
```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido').max(100, 'Máx 100'),
  monto: z.coerce.number().positive('Debe ser > 0'),
  estado: z.enum(['activo', 'inactivo']),
})
type FormData = z.infer<typeof schema>

// En componente:
const form = useForm<FormData>({ resolver: zodResolver(schema) })
const onSubmit = (data: FormData) => {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errs: Record<string, string> = {}
    result.error.errors.forEach(e => { errs[e.path[0] as string] = e.message })
    setErrors(errs)
    return
  }
  // data es type-safe ✓
}
```

### Acceder al store
```typescript
const {
  proyectos, materiales, valesSalida, ordenesCompra,
  addValeSalida, updateOrden, setView
} = useErp()
```

### Agregar nueva pantalla (4 pasos)
1. Crear `src/erp/screens/MiPantalla.tsx`
2. Lazy import en `AppLayout.tsx`
3. Agregar al VIEW type en `store.tsx`
4. Agregar al Sidebar.tsx

---

## 📋 REGLAS DEL AGENTE

1. **NUNCA** eliminar código existente sin pedirlo el usuario
2. **SIEMPRE** verificar build: `npm run build`
3. **SIEMPRE** actualizar `01_ESTADO_ACTUAL.md` al terminar sesión
4. **NO** agregar tests a menos que usuario lo pida
5. **NO** repetir trabajo marcado como ✅
6. TypeScript estricto + shadcn/ui + TailwindCSS
7. Mantener .md como única fuente de verdad

---

## 🚀 PRÓXIMAS ACCIONES

### Ahora (antes de deploy):
1. Ejecutar smoke test de cascadas manualmente
2. Validar AuthGuard con 5 roles
3. Build y tests: `npm run build && npm run test`

### Producción:
1. Ejecutar migraciones SQL en Supabase
2. Google OAuth domain verification
3. Deploy a Vercel

### Opcional (después de deploy):
1. Refresh token rotation (~1h)
2. Virtual scrolling en tablas grandes
3. WebP/AVIF optimization

---

**Status:** ✅ **APP LISTA PARA DEPLOY** | **Build:** 0 errores | **Tests:** 76/76

*Última actualización: 2026-06-07 (Auditoría exhaustiva completada)*
