# 📍 ESTADO ACTUAL — ERP CONSTRUSMART
> Actualizar este archivo AL FINAL de cada sesión.
> El próximo agente empieza leyendo esto.
> Última actualización: 2026-06-05

---

## 🔴 PRÓXIMO PASO (empezar aquí)

**Tarea activa:** P1 — Agregar validación Zod en los 3 archivos faltantes
**Archivos afectados:**
1. `src/erp/screens/LogisticaCompras.tsx`
2. `src/erp/screens/SSOCalidad.tsx`
3. `src/erp/screens/GestionDocumental.tsx`

**Patrón a seguir:** Ver `src/erp/screens/CRM.tsx` o `src/erp/screens/Administracion.tsx`
**Esfuerzo estimado:** ~3h en total (~1h por archivo)

---

## ✅ COMPLETADO EN SESIONES ANTERIORES

| Fecha | Qué se hizo |
|-------|------------|
| 2026-06-05 | XSS fix en export.ts |
| 2026-06-05 | useEffect cycle fix en Bodega.tsx (useRef) |
| 2026-06-05 | Zod validation en CRM.tsx |
| 2026-06-05 | Zod validation en Administracion.tsx |
| 2026-06-05 | UX/UI 34 hallazgos corregidos (dark mode, tipografía, ARIA, responsive) |
| 2026-06-05 | i18n implementado: es.json (672 keys) + en.json |
| 2026-06-05 | F-01 a F-16 features completados |
| 2026-06-05 | 76 tests unitarios pasando |
| 2026-06-05 | Archivos .amazonq/rules/ creados para memoria de agente |

---

## ❌ PENDIENTES EN ORDEN DE PRIORIDAD

| # | ID | Tarea | Esfuerzo | Tipo |
|---|----|-------|----------|------|
| 1 | P1 | Zod validation: LogisticaCompras.tsx | ~1h | Código |
| 2 | P1 | Zod validation: SSOCalidad.tsx | ~1h | Código |
| 3 | P1 | Zod validation: GestionDocumental.tsx | ~1h | Código |
| 4 | P7 | Refresh token rotation en Supabase | ~1h | Código |
| 5 | P2 | Optimizar imágenes con WebP/AVIF | ~2h | Código |
| 6 | P4 | Monitoreo con Sentry | ~2h | Código |
| 7 | P3 | Virtual scrolling en tablas grandes | ~3h | Código |
| 8 | P8 | Refactorizar store.tsx en módulos | ~4h | Código |
| 9 | P5 | Ejecutar migraciones SQL 000000000004→000000000008 en Supabase | - | Manual |
| 10 | P6 | Google OAuth domain verification | - | Manual |

---

## 🧠 CONTEXTO TÉCNICO RÁPIDO

### Patrón Zod ya implementado (copiar de CRM.tsx):
```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido').max(100),
  monto: z.number().positive('Debe ser positivo'),
})
type FormData = z.infer<typeof schema>

// En el componente:
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema)
})
```

### Archivos clave para referencia rápida:
- Estado global: `src/erp/store.tsx`
- Tipos: `src/erp/types.ts`
- Seguridad: `src/lib/security.ts`
- Estilos base: `src/index.css`
- Tailwind config: `tailwind.config.ts`

---

## ⚠️ NOTAS IMPORTANTES

- `store.tsx` tiene ~1485 líneas — no refactorizar sin que el usuario lo pida (es P8)
- Bundle es ~4MB debido a `web-ifc` (visor BIM) — es esperado, no es un bug
- Las migraciones SQL 000000000004→000000000008 están pendientes de ejecutar **manualmente** en Supabase Dashboard
- F-17 (i18n) aparece como pendiente en README pero YA ESTÁ implementado en código
- `CONSTRUSMART-DEVELOP/` es una copia del proyecto — trabajar solo en la raíz

---

## 📊 ESTADO DEL BUILD

```
Build:   ✅ 0 errores
Tests:   ✅ 76/76 pasando
Lint:    ✅ sin warnings críticos
Deploy:  ✅ https://erp-construsmart-wm-app-01.vercel.app/
```
