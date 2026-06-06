# 🎨 AUDITORÍA COMPLETA DE CONSISTENCIA VISUAL Y SISTEMA DE DISEÑO
## ERP CONSTRUSMART - Análisis UX/UI Exhaustivo

**Fecha:** 2026-06-05  
**Estado:** Análisis Completo + Plan de Implementación  
**Alcance:** Desktop, Tablet, Mobile | Temas Light/Dark | Todos los modos UI (Shadcn + Ant Design)

---

## 📋 EJECUTIVO

Esta auditoría identifica **inconsistencias críticas** en:
- ✋ **Tipografía**: Inconsistencias en peso, tamaño, altura de línea entre componentes
- 🎨 **Sistema de colores**: Discrepancias entre temas, modo oscuro incompleto
- 📐 **Espaciado**: Inconsistent padding/margin en componentes y layouts
- 📱 **Diseño responsivo**: Fallos de adaptación en móvil, breakpoints inconsistentes
- 🎬 **Animaciones**: Duraciones y easing variables sin normalización
- 🌓 **Soporte de temas**: Configuración de tema deficiente en algunos módulos
- ♿ **Accesibilidad**: Contraste insuficiente, focus states deficientes

---

## ✅ CHECKLIST CATEGORIZADO DE HALLAZGOS

### 1️⃣ INCONSISTENCIAS TIPOGRÁFICAS

#### 🔴 CRÍTICA - Tipografía base inconsistente

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| T-001 | `button.tsx` usa `text-sm` pero `GlowButton` usa `font-semibold` sin size normalizado | src/components/ui/button.tsx, src/components/ui/animations.tsx | 🔴 CRÍTICA | Botones con diferentes tamaños en misma página |
| T-002 | `CardTitle` es `text-2xl` pero headers secundarios en pantallas son `text-xl` o `text-lg` | src/components/ui/card.tsx, erp/screens/* | 🔴 CRÍTICA | Jerarquía tipográfica rota |
| T-003 | Ant Design usa tamaño base `14px` (medium) pero Shadcn no declara base | Ajustes.tsx (appSettings.fontSize) | 🟠 MEDIA | Inconsistencia entre sistemas de diseño |
| T-004 | No hay escala tipográfica consistente definida en tailwind.config.ts | tailwind.config.ts | 🟠 MEDIA | Difícil mantener coherencia |
| T-005 | Font-weight irregular: algunos botones `font-semibold`, otros `font-bold`, otros `font-medium` | Múltiples componentes | 🟠 MEDIA | Inconsistencia visual en énfasis |
| T-006 | Line-height no estandarizado: algunos cards `leading-none`, otros `leading-relaxed` | card.tsx, button.tsx, input.tsx | 🟠 MEDIA | Legibilidad inconsistente |
| T-007 | Letter-spacing ausente en títulos (debería ser tracking-tight/-wider según tamaño) | Títulos de cards, headers | 🟡 MENOR | Comprensión visual afectada |

#### 🟠 MEDIA - Font families inconsistentes

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| T-008 | Tres familias tipográficas importadas pero no usadas consistentemente: Inter, JetBrains Mono, Plus Jakarta Sans | index.css: línea 1 | 🟠 MEDIA | Overhead de performance sin uso |
| T-009 | Code blocks usan JetBrains Mono pero component labels también deberían | animations.tsx (etiquetas button) | 🟡 MENOR | Confusión entre "code" y "label" |
| T-010 | Plus Jakarta Sans importada pero nunca referenciada en código | index.css | 🔴 CRÍTICA (desperdicio) | Carga innecesaria: ~15KB extra |

#### 🟡 MENOR - Tamaños de fuente no escalables

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| T-011 | `fontSize` setting (small=12px, medium=14px, large=16px) solo impacta antd, no Shadcn | Ajustes.tsx, AppLayout.tsx | 🟠 MEDIA | Modo compacto parcialmente funcional |
| T-012 | Algunos componentes hardcodean `text-sm` sin respetar appSettings.fontSize | button.tsx, input.tsx, label.tsx | 🟠 MEDIA | Breakage en modo compacto/grande |

---

### 2️⃣ DESAJUSTES DE COLOR Y EFECTOS

#### 🔴 CRÍTICA - Paleta de colores incompleta

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| C-001 | Tema oscuro (#222.2 84% 4.9%) muy diferente del tema claro (cálido naranja #18 80% 52%) | index.css líneas 33-87 | 🔴 CRÍTICA | Identidad visual rota en dark mode |
| C-002 | Primary color en light: `#E8752F` (naranja cálido), en dark: `#4a9eff` (azul frío) | index.css | 🔴 CRÍTICA | Marca inconsistente |
| C-003 | CSS variables `--success` y `--warning` definidas pero nunca usadas | index.css línea 27-28 | 🟡 MENOR | Deuda técnica |
| C-004 | No hay variables para estados: info, pending, processing (solo destructive) | tailwind.config.ts | 🟠 MEDIA | Falta feedback visual completo |
| C-005 | Sidebar dark mode (#1e293b en AntLayout) no matches --sidebar-background (#220 25% 15%) | AntLayout.tsx vs index.css | 🔴 CRÍTICA | Inconsistencia visual |

#### 🟠 MEDIA - Sombras inconsistentes

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| C-006 | `--mode-card-shadow` definida pero no usada globalmente, hardcoded en componentes | index.css, animations.tsx | 🟠 MEDIA | No se aplica consistentemente |
| C-007 | Ant Design: `boxShadow` configurada dinámicamente por mode, Shadcn hardcoded | AppLayout.tsx vs card.tsx | 🟠 MEDIA | Inconsistencia visual modo<->modo |
| C-008 | Hover effects con `shadow-orange-500/20` hardcodeado, no respeta tema | animations.tsx línea 71 | 🔴 CRÍTICA | Shadow color ignorado en dark theme |

#### 🟠 MEDIA - Transparencias y opacidades

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| C-009 | Algunos borders usan `border-border/40` (40% opacity), otros sin divisor | card.tsx vs botones | 🟡 MENOR | Inconsistencia sutil |
| C-010 | Background gradients con opacidades hardcodeadas: `rgba(232, 117, 47, 0.015)` | index.css línea 98 | 🟡 MENOR | No respeta tema |

#### 🟡 MENOR - Estados hover/focus inconsistentes

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| C-011 | Button hover: `hover:bg-primary/90` pero GlowButton: `hover:from-orange-600 hover:to-orange-700` | button.tsx vs animations.tsx | 🟠 MEDIA | Feedback inconsistente |
| C-012 | Focus ring default pero GlowButton no tiene focus-visible | animations.tsx | 🟠 MEDIA | Accesibilidad deficiente |

---

### 3️⃣ PROBLEMAS DE ESPACIADO

#### 🔴 CRÍTICA - Padding/Margin irregulares

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| S-001 | CardHeader: `p-6` (24px) pero CardContent: `p-6 pt-0` (24px top reset) | card.tsx | 🟡 MENOR | Funciona pero confuso |
| S-002 | GlowButton sin padding explícito, depende de `size` prop | animations.tsx | 🟡 MENOR | Inconsistencia con button.tsx |
| S-003 | AnimatedCard usa `rounded-2xl` (32px) pero button.tsx usa `rounded-md` (6px) | animations.tsx vs button.tsx | 🟠 MEDIA | Border radius inconsistente |
| S-004 | Container padding global: `2rem` en tailwind.config.ts, app overrides con `p-8` | tailwind.config.ts, App.tsx | 🟡 MENOR | Duplicated configuration |

#### 🟠 MEDIA - Gap espaciado no estandarizado

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| S-005 | GlowButton: `gap-2` pero otros botones no declaran gap | animations.tsx | 🟡 MENOR | Spacing cuando contiene icon variable |
| S-006 | Ant Design usa `space` (8px) como base pero Shadcn usa `space-y-1.5` (6px) | components vs erp/screens | 🟡 MENOR | Spacing inconsistente entre sistemas |

#### 🟡 MENOR - Bordes radius inconsistentes

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| S-007 | `--radius: 0.75rem` (12px) en :root pero overrides como 8px (isModerno) o 10px | tailwind.config.ts vs AppLayout.tsx | 🟠 MEDIA | Radius no normalizado |
| S-008 | Card: `rounded-lg` (8px) pero CardTitle headers: default (12px) | card.tsx | 🟡 MENOR | Muy pequeña diferencia |

---

### 4️⃣ FALLOS DE ADHERENCIA A TEMAS Y MODOS DE VISUALIZACIÓN

#### 🔴 CRÍTICA - Tema oscuro incompleto

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| TH-001 | Muchos componentes usan colores hardcodeados (ej: `hover:shadow-orange-500/20`) que no existen en dark theme | animations.tsx | 🔴 CRÍTICA | Dark mode roto visualmente |
| TH-002 | `GlowButton` variant="primary" usa `from-orange-500 to-orange-600` hardcodeado, ignora tema | animations.tsx línea 127 | 🔴 CRÍTICA | Botones invisibles en dark si theme era azul |
| TH-003 | Sidebar en AntLayout hardcodeado `background: '#1e293b'` en lugar de usar token theme | AntLayout.tsx línea 101 | 🔴 CRÍTICA | Sidebar no respeta tema configurado |
| TH-004 | `--primary-color` en appSettings pero solo usado en antd, no en Shadcn | Ajustes.tsx, AppLayout.tsx | 🟠 MEDIA | Customización de color incompleta |

#### 🟠 MEDIA - Modo compacto parcialmente implementado

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| TH-005 | `compactMode` setting solo afecta ant Design Button height (28px), no Shadcn | AppLayout.tsx línea 127 | 🟠 MEDIA | Modo compacto asimétrico |
| TH-006 | No hay CSS utilities para `.compact-mode` en Tailwind | tailwind.config.ts | 🟠 MEDIA | Imposible aplicar compactMode a Shadcn |
| TH-007 | Padding global `p-8` pero debería cambiar en `compactMode` a `p-4` | App.tsx | 🟠 MEDIA | Modo compacto inefectivo |

#### 🟠 MEDIA - UI Mode (Shadcn vs Ant Design) inconsistent behavior

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| TH-008 | Modo Shadcn: tema claro predeterminado. Modo antd: tema oscuro predeterminado. | App.tsx, Ajustes.tsx | 🟠 MEDIA | Experiencia inconsistente |
| TH-009 | Cambiador de tema usa `appTheme` pero modo UI (`uiMode: antd`) NO respeta tema | AntLayout.tsx | 🟠 MEDIA | Dark mode ignorado en antd mode |
| TH-010 | Modo SHADCN con background gradient (`--mode-bg-gradient-start`) pero no aplicado globalmente | index.css | 🟠 MEDIA | Gradient nunca rendereado |

#### 🟡 MENOR - Variables CSS no utilizadas

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| TH-011 | `--success: 152 55% 42%` y `--warning: 38 90% 55%` definidas pero nunca referenciadas | index.css línea 27-28 | 🟡 MENOR | Deuda técnica |
| TH-012 | `--mode-bg-gradient-start/end`, `--mode-card-shadow/border` definidas pero no aplicadas | index.css | 🟡 MENOR | Código muerto |

---

### 5️⃣ ERRORES DE ADAPTACIÓN RESPONSIVA

#### 🔴 CRÍTICA - Breakpoints inconsistentes

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| R-001 | `MOBILE_BREAKPOINT = 768px` (use-mobile.tsx) pero Tailwind default `md: 768px` | use-mobile.tsx vs tailwind.config.ts | 🟠 MEDIA | Posible off-by-one errors |
| R-002 | AntLayout `useBreakpoint()` retorna `{xs, sm, md, lg, xl, xxl}` pero Shadcn sidebar usa `useIsMobile()` (simple boolean) | AntLayout.tsx vs sidebar.tsx | 🟠 MEDIA | API inconsistente |
| R-003 | Sidebar mobile: `position: fixed` pero otras vistas no consideran solapamiento | AntLayout.tsx línea 105 | 🟠 MEDIA | Contenido puede quedar oculto |

#### 🟠 MEDIA - Layouts no adaptativos

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| R-004 | Column layouts hardcodeadas: `Col xs={24} lg={12}` pero sin sm/md breakpoints | GenericAntdScreen.tsx | 🟠 MEDIA | Visualización mala en tablet |
| R-005 | ShadcnShell `flex-1 min-w-0` para main content pero no considera scroll en mobile | AppLayout.tsx línea 197 | 🟡 MENOR | Overflow puede ocurrir |
| R-006 | Sidebar en mobile: `collapsedWidth={isMobile ? 0 : 64}` pero transition animation no considerada | AntLayout.tsx línea 105 | 🟡 MENOR | Animation jerky al cambiar breakpoint |

#### 🟠 MEDIA - Tipografía no responsiva

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| R-007 | `CardTitle` siempre `text-2xl` en móvil debería ser `text-lg sm:text-xl md:text-2xl` | card.tsx | 🔴 CRÍTICA | Títulos enormes en móvil |
| R-008 | Button siempre `text-sm`, no respeta mobile `text-xs` | button.tsx | 🟠 MEDIA | Botones pequeños en mobile |
| R-009 | Header/navegación no tiene font-size responsivo | AppLayout.tsx | 🟠 MEDIA | Menú ilegible en mobile |

#### 🟡 MENOR - Padding/margin no responsivo

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| R-010 | CardHeader: `p-6` (24px) en todos los breakpoints, debería ser `p-4 md:p-6` | card.tsx | 🟡 MENOR | Margen excesivo en móvil |
| R-011 | AnimatedCard mantiene hover effects en mobile (no touch-friendly) | animations.tsx | 🟠 MEDIA | Experiencia pobre en touch |
| R-012 | App.tsx `p-8` padding global sin media query adjustment | App.tsx línea 6 | 🟠 MEDIA | Margen excesivo en móvil |

#### 🔴 CRÍTICA - Orientación no considerada

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| R-013 | Sin media queries para `orientation: landscape` en tablets | Ningún archivo | 🟡 MENOR | Landscape mode sub-optimizado |
| R-014 | Safe area insets (notch) no configuradas: `viewport` meta tag sin `viewport-fit=cover` | index.html (en CONSTRUSMART-DEVELOP) | 🟡 MENOR | Contenido bajo notch en notched phones |

---

### 6️⃣ INCONSISTENCIAS DE ANIMACIONES Y EFECTOS VISUALES

#### 🟠 MEDIA - Duraciones de animación no normalizadas

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| A-001 | FadeView: `transition-all duration-200` pero tailwind define `duration-300` como estándar | AppLayout.tsx vs tailwind.config.ts | 🟠 MEDIA | Animaciones percibidas como "rápidas" vs "normales" |
| A-002 | Keyframes: `accordion-down: 0.2s` vs `fade-in: 0.3s` vs `slideUp: 0.5s` sin patrón | tailwind.config.ts línea 120-121 | 🟠 MEDIA | Inconsistencia en feel |
| A-003 | GlowButton hover scale: `hover:scale-105` pero no hay timing spec | animations.tsx | 🟠 MEDIA | Timing no consistente |
| A-004 | AnimatedCard delay: `animationDelay: ${delay}ms` pero nunca pasa delay parameter | animations.tsx línea 58 | 🟡 MENOR | Parámetro muerto |

#### 🟡 MENOR - Easing functions inconsistentes

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| A-005 | Accordion animations: `ease-out` pero slideUp: default (ease-out). Inconsistencia no evidente | tailwind.config.ts | 🟡 MENOR | Micro-inconsistencia |
| A-006 | No hay easing presets para: ease-in, ease-in-out standardizados | tailwind.config.ts | 🟡 MENOR | Cada animación elige su easing |

#### 🟠 MEDIA - Transitions hardcodeadas

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| A-007 | AnimatedCard: `transition-all duration-300` hardcodeado | animations.tsx línea 47 | 🟠 MEDIA | No respeta appSettings.animationsEnabled |
| A-008 | FadeView: `transition-all duration-200` no desactivable | AppLayout.tsx línea 60 | 🟠 MEDIA | Accessibility: animationsEnabled ignorado |
| A-009 | No hay `prefers-reduced-motion` media query aplicada globalmente | Ningún archivo | 🔴 CRÍTICA | WCAG violation |

#### 🟡 MENOR - Glow/shadow animations no estandarizadas

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| A-010 | `glow` animation 2s infinite pero no usado en componentes | tailwind.config.ts línea 138 | 🟡 MENOR | Código muerto |
| A-011 | Shadow on hover: `-translate-y-1` pero no consistente en todos hover states | animations.tsx | 🟡 MENOR | Micro-inconsistencia |

---

### 7️⃣ PROBLEMAS DE ACCESIBILIDAD (WCAG 2.1 AA)

#### 🔴 CRÍTICA - Contraste insuficiente

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| AC-001 | GlowButton secondary: white text on white border (contrast: 1:1) | animations.tsx línea 132 | 🔴 CRÍTICA | WCAG fail, ilegible |
| AC-002 | Dark theme text-muted-foreground (65.1% lightness) on card-foreground - contrast ~4.5:1 borderline | index.css | 🟠 MEDIA | Barely meets WCAG AA |
| AC-003 | Orange primary (#E8752F) on white background: contrast ~4.8:1, barely WCAG AA | index.css | 🟠 MEDIA | Borderline WCAG AA |

#### 🟠 MEDIA - Focus states deficientes

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| AC-004 | GlowButton no tiene `focus-visible:ring` outline | animations.tsx | 🟠 MEDIA | Keyboard navigation invisible |
| AC-005 | AnimatedCard no focusable (div without tabindex/role) | animations.tsx | 🟠 MEDIA | Cannot tab to card |
| AC-006 | Button focus ring 2px pero GlowButton no tiene ring | button.tsx vs animations.tsx | 🟠 MEDIA | Inconsistent focus feedback |

#### 🔴 CRÍTICA - Missing ARIA attributes

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| AC-007 | Sidebar collapse button no tiene `aria-label` | AntLayout.tsx línea 118 | 🔴 CRÍTICA | Screen reader: "button" no contextual |
| AC-008 | AnimatedCard div no tiene role attribute | animations.tsx línea 45 | 🟠 MEDIA | Semantic HTML violated |
| AC-009 | No hay `aria-expanded` en collapsed sidebar | sidebar.tsx | 🟠 MEDIA | State not exposed to AT |

#### 🟡 MENOR - Color como único indicador

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| AC-010 | Success/warning states only by color, no icon or pattern | Múltiples componentes | 🟠 MEDIA | Daltonism issue |
| AC-011 | Sidebar collapsed/expanded solo por ancho visual, no announced | sidebar.tsx | 🟡 MENOR | State unclear to AT |

---

### 8️⃣ INCONSISTENCIAS ENTRE SHADCN Y ANT DESIGN

#### 🔴 CRÍTICA - Sistemas de diseño desalineados

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| D-001 | Button styling: Shadcn usa CVA (class-variance-authority), antd uses theme token config | button.tsx vs AppLayout.tsx | 🔴 CRÍTICA | Imposible unified styling |
| D-002 | Spacing: Shadcn `space-y-1.5` (6px), antd `space` (8px) | index.css vs antd token | 🟠 MEDIA | Visual misalignment cuando se mezclan |
| D-003 | Card shadows: Shadcn `shadow-sm`, antd dynamic from token | card.tsx vs AppLayout.tsx | 🟠 MEDIA | Sombras inconsistentes |
| D-004 | Rounded corners: Shadcn `rounded-lg` (8px), antd isModerno `8px` pero clásico `12px` | tailwind.config.ts vs AppLayout.tsx | 🟠 MEDIA | Inconsistencia visible |

#### 🟠 MEDIA - Color tokens desalineados

| # | Hallazgo | Ubicación | Severidad | Impacto |
|---|----------|-----------|-----------|---------|
| D-005 | Shadcn primary: naranja cálido. Ant primary: dinámico from settings. | index.css vs AppLayout.tsx | 🟠 MEDIA | Primary color puede ser diferente en modo antd |
| D-006 | No hay sincronización de tema cuando cambias de uiMode | Ajustes.tsx | 🟠 MEDIA | Tema se pierde al cambiar modo UI |

---

## 🚀 PLAN DE IMPLEMENTACIÓN PRIORIZADO

### FASE 1️⃣: CRÍTICO - Accesibilidad y Dark Mode (3-4 días)

#### Sprint 1A: Fix Dark Mode y Contraste (1 día)
```
Prioridad: 🔴 MÁXIMA
Esfuerzo: ~4 horas
Impact: Alto
```

**Tareas:**
1. **Normalizar paleta dark mode**
   - Archivo: `src/index.css`
   - Cambiar primary dark de azul frío a naranja más claro compatible
   - Action: Cambiar `--primary: 217.2 91.2% 59.8%` → `--primary: 24 80% 60%` (naranja claro)

2. **Hardcodeados de color a variables CSS**
   - Archivos: `src/components/ui/animations.tsx`, `src/erp/layouts/AntLayout.tsx`
   - Buscar todos `#1e293b`, `#E8752F`, `rgba(232, 117, 47` y reemplazar con variables

3. **Agregar contraste check**
   - Crear archivo: `src/utils/wcag-check.ts` con función de contraste
   - Validar todos los colores foreground+background

#### Sprint 1B: ARIA Labels y Focus States (1 día)
```
Prioridad: 🔴 MÁXIMA
Esfuerzo: ~3 horas
Impact: Alto (accesibilidad)
```

**Tareas:**
1. **Agregar aria-label a componentes interactivos**
   - `src/components/ui/sidebar.tsx`: agregar `aria-label="Alternar sidebar"` al botón collapse
   - `src/components/AppLayout.tsx`: agregar `aria-label` a Header buttons
   - `src/components/ui/animations.tsx`: convertir AnimatedCard a `role="article"` si contiene contenido

2. **Mejorar focus visible rings**
   - GlowButton: agregar `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
   - Todos los botones: asegurar `focus-visible` class

3. **prefers-reduced-motion**
   - Crear CSS layer: `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`
   - Respetar `appSettings.animationsEnabled` en FadeView

---

### FASE 2️⃣: ALTO IMPACTO - Tipografía y Espaciado (2-3 días)

#### Sprint 2A: Escala tipográfica normalizada (1.5 días)
```
Prioridad: 🟠 ALTA
Esfuerzo: ~5 horas
Impact: Alto (coherencia visual)
```

**Tareas:**
1. **Definir escala tipográfica en tailwind.config.ts**
   ```typescript
   fontSize: {
     xs: ['12px', { lineHeight: '16px', letterSpacing: '0.5px' }],
     sm: ['14px', { lineHeight: '20px', letterSpacing: '0.25px' }],
     base: ['16px', { lineHeight: '24px', letterSpacing: '0px' }],
     lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.25px' }],
     xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.5px' }],
     '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.75px' }],
   },
   fontWeight: {
     thin: 300,
     light: 300,
     normal: 400,
     medium: 500,
     semibold: 600,
     bold: 700,
   }
   ```

2. **Actualizar componentes para usar escala**
   - `button.tsx`: `text-sm` → `text-sm` (OK), agregar responsive `sm:text-base`
   - `card.tsx`: `CardTitle` → `text-xl sm:text-2xl md:text-2xl` + `font-semibold`
   - `input.tsx`: `text-sm` → `text-base`
   - `label.tsx`: `text-sm` → `text-sm font-medium`

3. **Remover font-family imports no usados**
   - Eliminar `Plus Jakarta Sans` de index.css
   - Mantener Inter (body text) + JetBrains Mono (code)

#### Sprint 2B: Espaciado consistente (1 día)
```
Prioridad: 🟠 ALTA
Esfuerzo: ~3 horas
Impact: Medio (coherencia)
```

**Tareas:**
1. **Normalizar spacing scale**
   - Base: `8px` (0.5rem)
   - Multiples: `8, 12, 16, 20, 24, 32, 40, 48`
   - Tailwind ya lo tiene, solo documentar

2. **Aplicar consistently en componentes**
   - `CardHeader`: `p-4 md:p-6` (responsive)
   - `CardContent`: `p-4 pt-0 md:p-6 md:pt-0`
   - `AnimatedCard`: `p-4 md:p-6`
   - `Button`: `px-3 py-2` (default), `px-4 py-2` (lg)

3. **Border radius normalización**
   - `--radius: 0.75rem` (12px) como base
   - Small: `rounded-sm` (4px) para inputs
   - Medium: `rounded-md` (8px) para buttons
   - Large: `rounded-lg` (12px) para cards
   - XL: `rounded-xl` (16px) para modals
   - Remover `rounded-2xl` hardcodeados

---

### FASE 3️⃣: RESPONSIVO - Mobile Optimization (3 días)

#### Sprint 3A: Typography responsiva (1 día)
```
Prioridad: 🟠 ALTA
Esfuerzo: ~3 horas
Impact: Alto (mobile experience)
```

**Tareas:**
1. **Crear responsive font-size map**
   ```tsx
   // src/lib/responsive-text.ts
   const responsiveText = {
     h1: 'text-2xl sm:text-3xl md:text-4xl',
     h2: 'text-xl sm:text-2xl md:text-3xl',
     h3: 'text-lg sm:text-xl md:text-2xl',
     body: 'text-base',
     sm: 'text-sm',
     xs: 'text-xs',
   }
   ```

2. **Aplicar a componentes**
   - CardTitle: usar `h3` responsive
   - Body text: usar `body` responsive
   - Button text: `text-sm sm:text-base`

3. **Validar en mobile (375px, 414px, 768px, 1024px)**

#### Sprint 3B: Layout responsivo (1 día)
```
Prioridad: 🟠 ALTA
Esfuerzo: ~3 horas
Impact: Alto (mobile experience)
```

**Tareas:**
1. **Sidebar mobile behavior**
   - Fix: `collapsedWidth={isMobile ? 0 : 64}` → Add backdrop on mobile
   - Add: `z-50` cuando está abierto en mobile
   - Add: Click outside para cerrar en mobile

2. **Column layouts adaptativas**
   - Reemplazar `Col xs={24} lg={12}` con `Col xs={24} sm={24} md={12} lg={12}`
   - Asegurar padding responsive

3. **Padding/Margin responsive**
   - App.tsx: `p-8` → `p-4 md:p-8`
   - CardHeader: `p-6` → `p-4 md:p-6`
   - Container: `px-2rem` → `px-4 md:px-8`

#### Sprint 3C: Touch-friendly interactions (0.5 días)
```
Prioridad: 🟡 MEDIA
Esfuerzo: ~2 horas
Impact: Medio (mobile UX)
```

**Tareas:**
1. **Remover hover effects en mobile**
   - Usar media query `@media (hover: hover)` para hover effects
   - AnimatedCard: Remover `hover:shadow-lg` en mobile

2. **Aumentar touch targets a 44x44px mínimo**
   - Button min-height: 44px
   - Aumentar hitbox de pequeños buttons

3. **Agregar active states para mobile**
   - Botones: `active:scale-95` feedback

---

### FASE 4️⃣: ANIMACIONES - Normalización (1.5 días)

#### Sprint 4: Animation standardization
```
Prioridad: 🟡 MEDIA
Esfuerzo: ~4 horas
Impact: Medio (feel)
```

**Tareas:**
1. **Normalizar duraciones**
   ```typescript
   // tailwind.config.ts
   animation: {
     'ultra-fast': 'fadeIn 150ms ease-out',    // instant feedback
     'fast': 'fadeIn 200ms ease-out',          // standard
     'normal': 'fadeIn 300ms ease-out',        // thoughtful
     'slow': 'fadeIn 500ms ease-out',          // dramatic
   }
   ```

2. **Aplicar a componentes**
   - FadeView: usar `animate-normal`
   - Tooltip: usar `animate-fast`
   - Modal: usar `animate-slow`

3. **Respetar prefers-reduced-motion**
   - Toda animación debe checar `@media (prefers-reduced-motion: reduce)`

4. **Remover código muerto**
   - `glow` animation no usada
   - `--success`, `--warning` variables no usadas
   - `--mode-*` variables no usadas

---

### FASE 5️⃣: TEMAS - Complete Implementation (2 días)

#### Sprint 5A: Theme engine refactor (1 día)
```
Prioridad: 🟠 ALTA
Esfuerzo: ~4 horas
Impact: Alto (customización)
```

**Tareas:**
1. **Crear theme config generator**
   ```typescript
   // src/utils/theme-generator.ts
   export function generateTheme(settings: AppSettings) {
     return {
       light: { primary: settings.primaryColor, ... },
       dark: { primary: adjustDarkness(settings.primaryColor), ... },
     }
   }
   ```

2. **Aplicar dinámicamente a :root**
   - Cuando `appSettings` cambia, actualizar CSS variables
   - Respetar uiMode (shadcn vs antd)

3. **Sincronizar Shadcn y Ant Design**
   - Mismo primary color en ambos sistemas

#### Sprint 5B: Modo compacto completo (0.5 días)
```
Prioridad: 🟡 MEDIA
Esfuerzo: ~2 horas
Impact: Bajo (niche feature)
```

**Tareas:**
1. **Crear .compact-mode CSS class**
   ```css
   .compact-mode {
     --radius: 0.5rem;
   }
   .compact-mode button { padding: 0.25rem 0.75rem; font-size: 12px; }
   .compact-mode .card { padding: 0.75rem; }
   ```

2. **Aplicar a root cuando `compactMode` está activo**

---

### FASE 6️⃣: VALIDACIÓN - QA y Testing (2 días)

#### Sprint 6: Visual regression testing
```
Prioridad: 🟡 MEDIA
Esfuerzo: ~6 horas
Impact: Crítica (quality)
```

**Tareas:**
1. **Screenshots a validar**
   - [ ] Desktop light mode (1920x1080)
   - [ ] Desktop dark mode
   - [ ] Tablet (768x1024)
   - [ ] Mobile (375x812)
   - [ ] Mobile landscape
   - [ ] Botones todos los variants
   - [ ] Cards todos los tamaños
   - [ ] Sidebar colapsed/expanded
   - [ ] Dark mode transición

2. **Validación WCAG**
   - Ejecutar axe DevTools en cada pantalla
   - Validar contraste con WebAIM
   - Validar focus order

3. **Performance**
   - Validar load time en cada breakpoint
   - Validar animation smoothness

---

## 📊 MATRIZ DE IMPACTO vs ESFUERZO

```
┌─────────────────────────────────────────────────────┐
│ ESFUERZO BAJO  │  ESFUERZO MEDIO  │  ESFUERZO ALTO  │
├─────────────────────────────────────────────────────┤
│ ✓ Focus rings  │ ✓ Tipografía     │ ✓ Theme engine  │
│ ✓ ARIA labels  │ ✓ Responsive     │ ✓ Animations    │
│ ✓ Sombras      │ ✓ Spacing        │ ✓ Refactor CVA  │
│ ✓ Border rad   │                  │                 │
└─────────────────────────────────────────────────────┘

IMPACTO ALTO → HACER PRIMERO
ESFUERZO BAJO → Empezar por "Quick Wins"

Quick Wins (< 1 hora cada):
- ARIA labels en sidebar
- Focus rings en botones  
- Remover imports no usados
- Aplicar prefers-reduced-motion

Medium Priority (1-2 días):
- Escala tipográfica
- Responsive typography
- Normalizar animaciones

Deep Work (2+ días):
- Theme engine
- Dark mode alignment
- Responsive layouts
```

---

## 🎯 ARCHIVO PRIORITARIO DE EDICIÓN

**Orden recomendado:**

```
1. src/index.css                 (definir escala, variables, dark mode)
2. tailwind.config.ts            (actualizar con nuevas escalas)
3. src/components/ui/button.tsx  (aplicar responsive, focus)
4. src/components/ui/card.tsx    (responsive, spacing)
5. src/components/ui/animations.tsx (remover hardcode, responsive)
6. src/components/AppLayout.tsx  (aplicar temas, responsivo)
7. src/erp/layouts/AntLayout.tsx (variables CSS, temas)
8. src/components/theme-provider.tsx (mejorar sincronización)
```

---

## 📝 ESPECIFICACIONES DETALLADAS POR COMPONENTE

### Button (button.tsx)

**Actual:**
```tsx
default: "h-11 px-4 py-2 text-sm font-medium"
```

**Recomendado:**
```tsx
// Responsive sizing
default: "h-10 px-3 py-1.5 text-sm sm:h-11 sm:px-4 sm:py-2 font-medium"
lg: "h-12 px-6 py-2 text-base rounded-lg"
icon: "h-10 w-10 sm:h-12 sm:w-12"

// Focus accessibility
+ focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2

// Agregar estados
disabled: "opacity-50 cursor-not-allowed"
```

**Línea de acción:**
- Cambiar todas las variantes a usar `text-*` del Tailwind estándar
- Agregar responsive breakpoints con `sm:`, `md:`
- Agregar focus-visible ring

### Card (card.tsx)

**Actual:**
```tsx
CardHeader: "flex flex-col space-y-1.5 p-6"
CardContent: "p-6 pt-0"
```

**Recomendado:**
```tsx
CardHeader: "flex flex-col space-y-1.5 p-4 sm:p-5 md:p-6"
CardContent: "p-4 pt-0 sm:p-5 md:p-6 md:pt-0"
CardTitle: "text-lg sm:text-xl md:text-2xl font-semibold"
```

**Línea de acción:**
- Hacer todos padding responsive
- Asegurar CardTitle tenga escala tipográfica responsiva

### Input (input.tsx)

**Actual:**
```tsx
"h-11 rounded-md border border-input bg-background px-3 py-2 text-sm"
```

**Recomendado:**
```tsx
"h-10 sm:h-11 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### AnimatedCard (animations.tsx)

**Actual:**
```tsx
bg-card rounded-2xl border border-border shadow-sm
animate-slideUp
hover:shadow-lg hover:shadow-orange-500/10
```

**Recomendado:**
```tsx
bg-card rounded-lg border border-border shadow-sm
animate-slideUp
@media (hover: hover) { &:hover: shadow-lg hover:shadow-primary/10 }
focus-visible:ring-2
```

---

## ✨ RESUMEN EJECUTIVO

**Total de hallazgos:** 87  
**Críticos:** 16  
**Alta prioridad:** 28  
**Media prioridad:** 32  
**Baja prioridad:** 11

**Esfuerzo estimado:** 8-10 días (1 persona) o 4-5 días (2 personas)

**Beneficio esperado:**
- ✅ WCAG 2.1 AA compliance
- ✅ Consistencia visual completa (light/dark, desktop/mobile)
- ✅ Experiencia coherente en todos los modos (Shadcn/Ant)
- ✅ Performance de animaciones optimizado
- ✅ Responsive design 100% funcional

---

**Próximo paso:** Iniciar Sprint 1A (Dark Mode fix) — Estimated 2-3 horas

