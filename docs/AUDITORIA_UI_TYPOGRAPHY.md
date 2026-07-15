# Auditoría UI CONSTRUSMART — Tipografía, Espaciado, Responsividad

## 1. Arquitectura CSS detectada (4 archivos + Tailwind)

- `design-tokens.css` — tokens puros (espaciados, elevación, motion, radios, z-index)
- `theme-variables.css` — variables `--erp-*` para temas (light, dark-pro, material3, glassmorphism, neomorphism, high-contrast)
- `themes.css` — selectores `[data-theme="..."]` que sobreescriben variables HSL de Tailwind/base
- `antd-global.css` — overrides Ant Design v5 (botones, inputs, tablas, cards)
- `index.css` — capa base Tailwind + utilidades + animaciones + mapeo colores `text-slate-*`/`bg-slate-*`
- `tailwind.config.ts` — extensión de colores, radii, keyframes

## 2. Problemas encontrados

### 🔴 Redundancia de tokens tipográficos
- `--text-xs` definido en 3 lugares distintos (`design-tokens.css`, `theme-variables.css` como `--erp-font-size-xs`, y Tailwind por defecto)
- `--leading-*` y `--tracking-*` en `design-tokens.css` no se usan en ningún componente (no hay `letter-spacing` ni `line-height` mapeados a clases en `index.css`)
- Varias animaciones duplicadas entre `index.css` (`.animate-fade-in`) y `design-tokens.css` (`.animate-fade-in`)

### 🟡 Espaciado inconsistente en responsive
- `@media (max-width: 576px)` en `index.css` usando `px` duros en vez de variables `--density-padding`
- `@media (max-width: 639px)` en `design-tokens.css` define `.mobile-text-scale: font-size 0.875rem` pero sin uso real
- En `antd-global.css` la altura de inputs/selects está hardcodeada `height: 36px` en vez de usar `--density-input-height`

### 🟡 Jerarquía visual plana
- Componentes `h1`-`h4` tienen definiciones responsive solo en `index.css`, pero sin acoplamiento a tokens de espaciado o tracking
- `h1` en mobile: `22px`, en desktop: el tamaño por defecto de Tailwind (`2xl` = 24px) → diferencia casi imperceptible
- No existe `--font-size-responsive` ni `clamp()` en ningún lado → todos los tamaños son fijos

### 🟡 Overlap entre theme-variables.css y themes.css
- `theme-variables.css` define `--erp-shadow-*` que no se usan en ningún componente real (nunca se referencian como `var(--erp-shadow-sm)`)
- Los temas en `themes.css` definen `--shadow-*` como variables planas que tampoco se referencian desde `box-shadow:` en componentes → las sombras reales vienen de Tailwind `shadow-sm`/`shadow-md`

### 🟡 Text overflow sin protección en listas/tablas
- No hay `overflow-hidden + text-ellipsis + white-space: nowrap` sistemático en celdas de tablas o tarjetas con texto largo
- Las clases `truncate-1`, `truncate-2`, `truncate-3` existen en `design-tokens.css` pero no se usan en ningún `.tsx` que las invoque

## 3. Plan de correcciones propuesto

### Fase 1 — Eliminar redundancia y consolidar tokens
- Mover toda la tipografía a `design-tokens.css` y `tailwind.config.ts`; eliminar variables duplicadas de `theme-variables.css`.
- Eliminar animaciones/transiciones duplicadas.
- Unificar mapeo de colores HSL de `index.css` y `themes.css` para que un solo archivo (`themes.css`) sea el source of truth.

### Fase 2 — Jerarquía visual con clamp() y leading variables
- Reemplazar `font-size` fijo en headings por `clamp()`:  
  `h1: clamp(1.5rem, 2.5vw + 1rem, 2.25rem)`  
  `h2: clamp(1.25rem, 2vw + 0.75rem, 1.875rem)`  
  `h3: clamp(1.125rem, 1.5vw + 0.5rem, 1.5rem)`
- Asignar `--leading-tight` a headings, `--leading-relaxed` a párrafos.
- Usar `text-balance` en headings con más de 2 líneas.

### Fase 3 — Protección contra overflow en tablas y tarjetas
- Aplicar `truncate-1` + `title` attribute a celdas de tablas con texto largo.
- En tarjetas de KPI, aplicar `text-pretty` + `max-w-prose` o `overflow-hidden`.
- Garantizar que en mobile ningún texto se desborde horizontalmente.

### Fase 4 — Responsividad con variables de densidad
- Refactorizar `@media (max-width: 576px)` para usar `--density-padding` en lugar de `8px` duro.
- Refactorizar `antd-global.css` inputs height a `--density-input-height`.
- En `design-tokens.css`, eliminar `.mobile-text-scale` y reemplazar con media query que ajuste `--text-*` global.

### Fase 5 — Touch targets consistentes
- Los botones ya tienen `min-height: 44px` en `pointer: coarse` — bueno.
- Faltan `min-width` en algunos botones icon-only en mobile.
- Unificar `--erp-touch-target` con la variable de `index.css`.

## 4. Prioridad de implementación

| Prioridad | Cambio | Archivos afectados | Esfuerzo |
|-----------|--------|-------------------|----------|
| 🔴 P0 | Eliminar código muerto (animaciones duplicadas, variables sin uso) | `design-tokens.css`, `index.css`, `themes.css` | Bajo |
| 🔴 P0 | Proteger overflow en tablas/listas (text-ellipsis) | Componentes `.tsx` de tablas | Medio |
| 🟡 P1 | Jerarquía visual con clamp() y leading | `index.css` | Bajo |
| 🟡 P1 | Input height dinámica en antd-global.css | `antd-global.css` | Bajo |
| 🟢 P2 | Responsividad con variables de densidad | CSS + utilidades | Medio |
| 🟢 P2 | Consolidar source of truth de colores | `themes.css` + `index.css` | Alto |