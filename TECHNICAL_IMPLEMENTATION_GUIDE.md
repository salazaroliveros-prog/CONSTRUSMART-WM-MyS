# 🔧 GUÍA TÉCNICA DE IMPLEMENTACIÓN
## Correcciones UX/UI Paso a Paso - CONSTRUSMART ERP

**Documento complementario a:** [UX_UI_AUDIT_CONSISTENCY.md](UX_UI_AUDIT_CONSISTENCY.md)

---

## 📐 PALETA DE COLORES NORMALIZADA

### Light Mode (Default)
```scss
// Cálida, naranja-cobre como identity
--background: 30 20% 98%;              // #fef3e8 crema muy claro
--foreground: 20 15% 12%;              // #2a1810 marrón oscuro

--primary: 18 80% 52%;                 // #E8752F naranja CONSTRUSMART
--primary-foreground: 0 0% 100%;       // white

--secondary: 30 30% 88%;               // #e8d5c4 beige claro
--secondary-foreground: 20 15% 20%;    // #3d2817 marrón medio

--accent: 170 45% 48%;                 // #14a8a8 teal/turquesa
--accent-foreground: 0 0% 100%;

--muted: 30 12% 95%;                   // #f5ede4 muy claro
--muted-foreground: 25 10% 48%;        // #7d6b5d gris cálido

--card: 30 10% 100%;                   // #fffbf7 blanco warm
--card-foreground: 20 15% 12%;

--destructive: 2 70% 52%;              // #e73d3d rojo
--destructive-foreground: 0 0% 100%;

--border: 30 12% 90%;                  // #f0e8df gris cálido claro
--input: 30 12% 90%;
--ring: 18 80% 52%;                    // naranja focus ring

// Status colors (NEW)
--success: 152 55% 42%;                // #2d9d6f verde success
--warning: 38 90% 55%;                 // #ffa500 amber warning  
--info: 217 100% 50%;                  // #0066ff blue info
--pending: 30 100% 50%;                // #ff9800 orange pending
```

### Dark Mode
```scss
// Azul-gris oscuro, mantener naranja como accent
--background: 220 20% 10%;             // #0d1117 casi negro azulado
--foreground: 210 40% 95%;             // #f0f4f8 blanco azulado

--primary: 24 80% 58%;                 // #E8852F naranja + luz (ajustado para legibilidad)
--primary-foreground: 220 20% 10%;

--secondary: 220 30% 25%;              // #1f2937 azul-gris medio
--secondary-foreground: 210 40% 95%;

--accent: 200 100% 50%;                // #00d4ff cyan accent (más visible en dark)
--accent-foreground: 220 20% 10%;

--muted: 220 30% 30%;                  // #2d3748 dark gray
--muted-foreground: 210 20% 70%;       // #9ca3af light gray

--card: 220 20% 14%;                   // #1a202c dark card
--card-foreground: 210 40% 95%;

--destructive: 0 84% 60%;              // #ff5555 bright red en dark
--destructive-foreground: 220 20% 10%;

--border: 220 20% 20%;                 // #2d3748 dark border
--input: 220 20% 20%;
--ring: 24 80% 58%;                    // naranja adjusted

// Status colors dark (NEW)
--success: 152 100% 50%;               // #00ff80 bright green
--warning: 38 100% 60%;                // #ffb81c bright amber
--info: 200 100% 55%;                  // #33ddff bright cyan
--pending: 24 100% 60%;                // #ff9d33 bright orange
```

**Cómo aplicar:**

```css
/* src/index.css - Update :root and .dark */

:root {
  /* Light theme vars - insert above */
  --primary: 18 80% 52%;
  --success: 152 55% 42%;
  --warning: 38 90% 55%;
  --info: 217 100% 50%;
  --pending: 30 100% 50%;
}

.dark {
  /* Dark theme vars */
  --primary: 24 80% 58%;
  --success: 152 100% 50%;
  --warning: 38 100% 60%;
  --info: 200 100% 55%;
  --pending: 24 100% 60%;
}
```

---

## 🔤 ESCALA TIPOGRÁFICA NORMALIZADA

### Actualizar tailwind.config.ts

```typescript
// tailwind.config.ts - extend section

extend: {
  // ... existing extend ...
  
  fontSize: {
    // [tamaño, { lineHeight, letterSpacing }]
    'xs': ['12px', { lineHeight: '16px', letterSpacing: '0.5px' }],
    'sm': ['14px', { lineHeight: '20px', letterSpacing: '0.25px' }],
    'base': ['16px', { lineHeight: '24px', letterSpacing: '0px' }],
    'lg': ['18px', { lineHeight: '28px', letterSpacing: '-0.25px' }],
    'xl': ['20px', { lineHeight: '28px', letterSpacing: '-0.5px' }],
    '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.75px' }],
    '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-1px' }],
  },
  
  fontWeight: {
    thin: '300',
    light: '300', 
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
}
```

### Tipografía por componente

| Component | Tamaño | Weight | Line-height | Uso |
|-----------|--------|--------|------------|-----|
| H1 (Page title) | `2xl` (24px) | 700 bold | 32px | Títulos de pantalla principal |
| H2 (Section) | `xl` (20px) | 600 semibold | 28px | Títulos de sección |
| H3 (Card title) | `lg` (18px) | 600 semibold | 28px | Encabezados de cards |
| Body (default) | `base` (16px) | 400 normal | 24px | Párrafos, descripciones |
| Label | `sm` (14px) | 500 medium | 20px | Labels de form, badge text |
| Caption | `xs` (12px) | 400 normal | 16px | Metadata, timestamps, hints |
| Button | `sm` (14px) | 600 semibold | 20px | Button text (todas variantes) |
| Code | `sm` (14px) | 500 medium | 20px | Inline code, stack traces |

### Clases de ayuda (crear en src/lib/typography.ts)

```typescript
export const typographyClasses = {
  h1: 'text-2xl md:text-3xl font-bold tracking-tight',
  h2: 'text-xl md:text-2xl font-semibold tracking-tight',
  h3: 'text-lg md:text-xl font-semibold tracking-tight',
  body: 'text-base leading-relaxed',
  label: 'text-sm font-medium text-foreground/90',
  caption: 'text-xs text-muted-foreground',
  button: 'text-sm font-semibold',
  code: 'text-sm font-mono bg-muted px-1.5 py-0.5 rounded',
} as const;

// Uso en componentes:
// className={typographyClasses.h3}
```

---

## 📏 ESCALA DE ESPACIADO NORMALIZADA

### Base Unit: 4px (0.25rem)
```typescript
// Multiples de 4px
const spacing = [
  '0px',    // 0
  '4px',    // xs - 1
  '8px',    // sm - 2
  '12px',   // md - 3
  '16px',   // lg - 4
  '20px',   // xl - 5
  '24px',   // 2xl - 6
  '32px',   // 3xl - 8
  '40px',   // 4xl - 10
  '48px',   // 5xl - 12
];
```

### Padding por componente

```typescript
// Responsive padding pattern: mobile -> tablet -> desktop
const componentPadding = {
  button: 'px-3 py-1.5 sm:px-4 sm:py-2',           // 12/6 -> 16/8
  card: 'p-4 sm:p-5 md:p-6',                       // 16 -> 20 -> 24
  cardHeader: 'p-4 sm:p-5 md:p-6 pb-3',           // 16 -> 20 -> 24, pb adjust
  cardContent: 'p-4 sm:p-5 md:p-6 pt-0',          // 16 -> 20 -> 24, pt=0
  input: 'px-3 py-2 sm:px-4 sm:py-2.5',           // 12/8 -> 16/10
  modal: 'p-6 md:p-8',                             // 24 -> 32
  page: 'p-4 md:p-8 lg:p-12',                     // mobile-first
};
```

### Gap espaciado (flex/grid)

```typescript
const gapSpacing = {
  tight: 'gap-2',      // 8px
  normal: 'gap-3',     // 12px
  relaxed: 'gap-4',    // 16px
  loose: 'gap-6',      // 24px
};
```

---

## 🎨 BORDER RADIUS NORMALIZACIÓN

```typescript
// tailwind.config.ts
borderRadius: {
  none: '0px',
  sm: 'calc(var(--radius) - 2px)',      // 10px default, 8px con --radius=10
  base: 'var(--radius)',                  // 12px
  md: 'calc(var(--radius) + 2px)',       // 14px
  lg: 'calc(var(--radius) + 4px)',       // 16px
  xl: 'calc(var(--radius) + 8px)',       // 20px
  full: '9999px',
}

// :root CSS variable
--radius: 0.75rem; /* 12px base */
```

| Uso | Border Radius | Tailwind Class |
|-----|---------------|----------------|
| Inputs, small elements | 8px (sm) | `rounded-sm` |
| Buttons, chips | 8-10px (base) | `rounded-md` |
| Cards | 12-16px (md-lg) | `rounded-lg` |
| Modals, popovers | 16-20px (lg-xl) | `rounded-xl` |
| Full circles | 50% | `rounded-full` |

---

## 🎬 NORMALIZACIÓN DE ANIMACIONES

### Definir en tailwind.config.ts

```typescript
keyframes: {
  'fade-in': {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  'slide-up': {
    from: { opacity: '0', transform: 'translateY(8px)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  'scale-in': {
    from: { opacity: '0', transform: 'scale(0.95)' },
    to: { opacity: '1', transform: 'scale(1)' },
  },
  'slide-left': {
    from: { opacity: '0', transform: 'translateX(8px)' },
    to: { opacity: '1', transform: 'translateX(0)' },
  },
},

animation: {
  'ultra-fast': 'fade-in 150ms ease-out',
  'fast': 'fade-in 200ms ease-out',
  'normal': 'fade-in 300ms ease-out',
  'slow': 'fade-in 500ms ease-out',
  
  'slide-up-fast': 'slide-up 200ms ease-out',
  'slide-up': 'slide-up 300ms ease-out',
  
  'scale-fast': 'scale-in 200ms ease-out',
  'scale': 'scale-in 300ms ease-out',
},
```

### Prefers Reduced Motion

```css
/* src/index.css - Agregar en @layer utilities */
@layer utilities {
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

### Uso en componentes

```tsx
// Aplicar basado en settings
const animationClass = appSettings.animationsEnabled 
  ? 'animate-normal' 
  : '';

// Componente
<div className={`${animationClass} transition-all duration-300`}>
  {children}
</div>
```

---

## 📱 BREAKPOINTS RESPONSIVE

### Tailwind breakpoints (usar estos)
```typescript
screens: {
  'xs': '320px',   // mobile pequeño
  'sm': '640px',   // mobile grande
  'md': '768px',   // tablet
  'lg': '1024px',  // desktop pequeño
  'xl': '1280px',  // desktop estándar
  '2xl': '1536px', // desktop grande
}
```

### Mobile-First Approach

```tsx
// ✅ CORRECTO - mobile first
<div className="text-sm sm:text-base md:text-lg">
  Content
</div>

// ❌ INCORRECTO - desktop first
<div className="md:hidden lg:flex">
  Only on lg
</div>
```

### Responsive utilities por componente

```typescript
// src/lib/responsive.ts
export const responsive = {
  // Card sizing
  cardWidth: 'w-full sm:w-auto',
  cardMaxWidth: 'max-w-sm sm:max-w-md md:max-w-lg',
  
  // Grid layout
  grid2Col: 'grid-cols-1 sm:grid-cols-2',
  grid3Col: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  grid4Col: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  
  // Typography
  heading: 'text-xl sm:text-2xl md:text-3xl',
  
  // Padding
  pagePadding: 'px-4 py-4 sm:px-6 md:px-8 lg:px-12',
  sectionPadding: 'p-4 sm:p-6 md:p-8',
};

// Uso
<h1 className={responsive.heading}>Title</h1>
<div className={responsive.grid3Col}>
  {items.map(item => <Card key={item.id} />)}
</div>
```

---

## 🔍 ACCESIBILIDAD - CHECKLIST IMPLEMENTACIÓN

### 1. Focus visible states (todos componentes interactivos)

```tsx
// src/components/ui/button.tsx - Agregar a CVA
focus-visible: "ring-2 ring-ring ring-offset-2 ring-offset-background outline-none"

// src/components/ui/input.tsx
className={cn(
  "... existing ...",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
)}
```

### 2. ARIA labels para iconos y botones

```tsx
// sidebar.tsx - Toggle button
<button 
  onClick={toggleSidebar}
  aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
  aria-expanded={sidebarOpen}
  aria-controls="sidebar-navigation"
>
  {/* icon */}
</button>

// Aplicar en TODOS los botones de icono sin text
<button aria-label="Cerrar diálogo" onClick={onClose}>
  <X />
</button>
```

### 3. Semantic HTML

```tsx
// ✅ CORRECTO
<nav id="main-navigation">
  <ul role="menubar">
    <li role="none"><a href="/">Home</a></li>
  </ul>
</nav>

// ❌ INCORRECTO
<div className="navigation">
  <div onClick={() => navigate('/')}>Home</div>
</div>
```

### 4. Color contrast validation

Usar axe DevTools para validar. Targets:
- Normal text: 4.5:1 (WCAG AA)
- Large text (18px+): 3:1 (WCAG AA)
- UI components: 3:1 (WCAG AA)

```typescript
// src/utils/wcag-contrast.ts
export function getContrastRatio(color1: string, color2: string): number {
  // Implementation using WCAG formula
  // Use a library like tinycolor2 or convert-color
}

export function isWCAGAA(ratio: number): boolean {
  return ratio >= 4.5; // Normal text
}

export function isWCAGAALargeText(ratio: number): boolean {
  return ratio >= 3; // Large text (18px+)
}
```

### 5. Heading hierarchy

```tsx
// ✅ CORRECTO - h1 > h2 > h3
<h1>Page Title</h1>
<section>
  <h2>Section Title</h2>
  <article>
    <h3>Article Title</h3>
  </article>
</section>

// ❌ INCORRECTO - saltan niveles
<h1>Page</h1>
<h3>Skipped h2!</h3>
```

---

## 📋 CHECKLIST DE VALIDACIÓN

### Pre-deployment QA

- [ ] **Color contrast**
  - [ ] Light mode: todos los textos vs fondo ≥ 4.5:1
  - [ ] Dark mode: idem
  - [ ] Focus indicators visibles en ambos modos
  
- [ ] **Responsive Design**
  - [ ] 320px (iPhone SE): sin scroll horizontal
  - [ ] 375px (iPhone 12): todos elementos visibles
  - [ ] 768px (iPad): layout adaptado
  - [ ] 1024px (desktop): espaciado correcto
  - [ ] 1920px (ultra-wide): max-width respetado

- [ ] **Tipografía**
  - [ ] Escala consistente en todos componentes
  - [ ] Line-height legible (1.5+ para body)
  - [ ] Font-weight apropiado (no todos bold)
  
- [ ] **Animaciones**
  - [ ] prefers-reduced-motion respetado
  - [ ] Duraciones normalizadas (150/200/300/500ms)
  - [ ] Sin animaciones jarring o demasiado rápidas
  
- [ ] **Dark Mode**
  - [ ] Todos los colores presentes
  - [ ] Contraste suficiente
  - [ ] Transición suave
  - [ ] Sin hardcoded colors
  
- [ ] **Accesibilidad**
  - [ ] Tab order lógico
  - [ ] Focus visible en todos elementos
  - [ ] ARIA labels en botones de icono
  - [ ] Heading hierarchy correcto
  - [ ] Formularios con labels asociadas

- [ ] **Rendimiento**
  - [ ] Google Lighthouse > 90
  - [ ] LCP < 2.5s
  - [ ] CLS < 0.1
  - [ ] FID < 100ms

---

## 🚀 COMANDOS DE VALIDACIÓN

```bash
# TypeCheck
npm run typecheck

# Lint
npm run lint:fix

# Build
npm run build

# Lighthouse
npx lighthouse https://localhost:5173 --chrome-flags="--headless"

# WCAG contrast check (usar axe browser extension)
# O instalar axe-core
npm install --save-dev @axe-core/react
```

---

## 📦 DEPENDENCIES A INSTALAR (OPCIONAL)

Para validación automática de accesibilidad:

```bash
npm install --save-dev @axe-core/react jest-axe
npm install --save-dev color-contrast-checker
```

```typescript
// Ejemplo: test de contraste
import { getContrastRatio } from 'polished';

const ratio = getContrastRatio('#E8752F', '#fff');
console.log(ratio >= 4.5 ? 'Pass' : 'Fail'); // Pass
```

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Hoy:** Aplicar cambios a `index.css` y `tailwind.config.ts`
2. **Mañana:** Actualizar componentes UI principales (button, card, input)
3. **Día 3:** Aplicar responsive breakpoints en layouts
4. **Día 4:** Accessibility audit + fixes
5. **Día 5:** QA y validación visual

**Tiempo estimado:** 5-7 días de desarrollo

