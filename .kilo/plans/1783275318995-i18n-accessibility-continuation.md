# Plan: Refinar y corregir inconsistencias visuales y de funcionamiento (continuación)

## Estado actual

En la sesión anterior se completó parcialmente el refinamiento del código:

- **✅ P1 — aria-labels**: Agregados en 7 botones icon-only sin accesibilidad (Activos, CuentasCobrar, CuentasPagar, Hitos, Riesgos).
- **✅ P3 — AppLayout realtime**: Corregido `'destajos'` → `'erp_destajos'` en `useSupabaseRealtime`.
- **🔄 P2 — i18n hardcoded strings**: 
  - Agregado `useTranslation()` + reemplazos `t()` en: Ajustes, Hitos, CuentasCobrar, CuentasPagar, PlanillaDestajos, PlantillasProyectos.
  - Agregadas claves i18n en `es.json` y `en.json` para: `activos`, `hitos`, `riesgos`, `cuentas`, `planilla`, `ajustes`, `plantillas`.
  - Pendiente: completar `en.json` falta `riesgos.eliminar`.

## Tareas pendientes inmediatas

1. **Completar en.json** — Agregar `"eliminar": "Delete"` en la sección `riesgos` (falta cerrar el parity con `es.json`).
2. **Verificación de claves** — Confirmar que todas las secciones usadas en `t()` (activos, hitos, riesgos, cuentas, planilla, ajustes, plantillas) existen en ambos idiomas.
3. **Typecheck** — Ejecutar `npx tsc --noEmit` desde la raíz del proyecto.
4. **Tests** — Ejecutar `npx vitest run` para confirmar 0 errores.

## Cambios aplicados (esta sesión)

- `src/erp/screens/Activos.tsx` — aria-labels + `aria-hidden` en iconos.
- `src/erp/screens/CuentasCobrar.tsx` — `useTranslation` + Modal confirm i18n + aria-label.
- `src/erp/screens/CuentasPagar.tsx` — `useTranslation` + Modal confirm i18n + aria-label.
- `src/erp/screens/Hitos.tsx` — `useTranslation` + Modal confirm i18n + aria-label.
- `src/erp/screens/Riesgos.tsx` — aria-label en botón eliminar.
- `src/erp/screens/PlanillaDestajos.tsx` — `useTranslation` + Modal confirm i18n con interpolación.
- `src/erp/screens/PlantillasProyectos.tsx` — `useTranslation` + modals/toasts/prompt i18n + title attrs.
- `src/erp/screens/Ajustes.tsx` — Modal reset título/contenido i18n.
- `src/components/AppLayout.tsx` — tabla realtime corregida.
- `src/lib/i18n/es.json` + `src/lib/i18n/en.json` — agregadas secciones/claves nuevas.

## Riesgos

- `en.json` no tenía sección `activos` completa; se agregó completa para evitar fallbacks a clave.
- Algunos `prompt()` nativos no tienen reemplazo i18n nativo en Ant Design; se usa fallback inglés/español.
- `t('destajos.confirmar_eliminar_contenido', { cuadrilla, codigo })` usa interpolación i18next.

## Validación esperada

- `npx tsc --noEmit`: 0 errores.
- `npx vitest run`: suite completa verde.
- No quedan `window.confirm()` nativos.
- Todos los botones icon-only en pantallas auditadas tienen `aria-label`.
