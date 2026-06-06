# ⚡ GUÍA RÁPIDA DE REFERENCIA
## Búsqueda y Reemplazo de Inconsistencias - CONSTRUSMART ERP

**Uso:** Copiar-pegar patterns de búsqueda en VS Code para identificar y corregir rápidamente

---

## � Progreso de implementación
- ✅ Ajuste de color primario en modo oscuro
- ✅ Prefer-reduced-motion global añadido
- ✅ Botones responsivos actualizados
- ✅ Tarjetas con padding responsive
- ✅ Ant Design usa tokens dinámicos y menú accesible

---

## �🔍 BUSCAR Y REEMPLAZAR (Regex)

### 1. Buscar hardcoded colors en componentes

**Búsqueda Regex:**
```regex
(shadow-|hover:|text-)(?:orange|blue|slate|gray|red)-\d{1,3}(?:[^a-z]|$)
```

**Archivos a revisar:**
- `src/components/ui/animations.tsx`
- `src/erp/layouts/AntLayout.tsx`
- `src/components/AppLayout.tsx`

**Reemplazo:** Cambiar por variable CSS `var(--primary)` o `text-primary`

---

### 2. Buscar sizing sin responsividad

**Búsqueda Regex:**
```regex
(text-|px-|py-|p-|m-)(xs|sm|base|lg|xl|2xl)(?!\s+(sm:|md:|lg:|xl:))
```

**Significado:** Encuentra clases de tamaño sin breakpoints móviles

**Ejemplo de corrección:**
```tsx
// ❌ ANTES
<button className="px-4 py-2 text-sm">Click</button>

// ✅ DESPUÉS
<button className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm">Click</button>
```

---

### 3. Buscar components sin focus states

**Búsqueda Regex:**
```regex
className=.*"(?!.*focus-visible).*button
```

**Archivos:** Todos los `.tsx` con componentes interactivos

**Fix:**
```tsx
className={cn(
  "... existing classes ...",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
)}
```

---

### 4. Buscar padding sin responsive

**Búsqueda Regex:**
```regex
p-\d+(?!\s+(sm:|md:|lg:))
```

**Ejemplo:**
```tsx
// ❌ ANTES
<div className="p-6">Content</div>

// ✅ DESPUÉS
<div className="p-4 sm:p-5 md:p-6">Content</div>
```

---

### 5. Buscar tipos de animación inconsistentes

**Búsqueda Regex:**
```regex
animate-(fadeIn|slideUp|scaleIn|fade-in|slide-in|scale-in)
```

**Normalización:**
- `fadeIn` → `animate-fade-in`
- `slideUp` → `animate-slide-up`
- `scaleIn` → `animate-scale-in`
- Todos con duración: `150ms|200ms|300ms|500ms`

---

## 📝 PATRONES DE BÚSQUEDA SIN REGEX

### Buscar hardcoded height/width

| Patrón | Archivos | Reemplazo |
|--------|----------|-----------|
| `h-11` en todos lados | button, input | `h-10 sm:h-11` |
| `w-12` en todos | icon buttons | `w-10 sm:w-12` |
| `text-2xl` en mobil | cards | `text-lg sm:text-xl md:text-2xl` |

---

### Buscar estilos en línea que deberían ser clases

| Patrón | Ubicación | Solución |
|--------|-----------|----------|
| `style={{ padding` | Cualquier componente | Usar `className="p-*"` |
| `style={{ fontSize` | Labels, text | Usar `text-*` + escala |
| `style={{ color: '#` | Backgrounds, text | Usar variables CSS o clases Tailwind |

---

### Buscar animaciones no normalizadas

| Patrón | Ubicación | Corrección |
|--------|-----------|-----------|
| `duration-200` | FadeView | Cambiar a `duration-300` estándar |
| `duration-100` | Transiciones | Cambiar a `duration-200` |
| `duration-700` | Animaciones | Cambiar a `duration-500` máximo |

---

## 🎬 COMANDOS VS CODE

### Find & Replace (Ctrl+H) - Ejemplos rápidos

#### Ejemplo 1: Remover imports no usados
```
Find: import.*'Plus Jakarta Sans'.*
Replace: (dejar vacío)
Files: src/index.css
```

#### Ejemplo 2: Normalizar border-radius
```
Find: rounded-2xl
Replace: rounded-lg
Files: src/components/**/*.tsx
```

#### Ejemplo 3: Agregar focus states
```
Find: className=\{cn\(\s*buttonVariants\(\{ variant, size, className \}\)\s*\)\s*\}
Replace: className={cn(buttonVariants({ variant, size, className }), "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2")}
Files: src/components/ui/button.tsx
```

---

## 🎨 VALIDACIÓN DE CAMBIOS (Checklist)

### After cada cambio major, validar:

```
[ ] npm run typecheck        # Sin errores
[ ] npm run lint:fix         # Formateado
[ ] npm run build            # Build successful
[ ] Visualmente en browser:
    [ ] Light mode OK
    [ ] Dark mode OK
    [ ] 375px (mobile) OK
    [ ] 768px (tablet) OK
    [ ] 1920px (desktop) OK
    [ ] Focus visible al tab
```

---

## 🚀 QUICK ACTIONS (Copiar-pegar ready)

### Action 1: Normalizar Button component

**Archivo:** `src/components/ui/button.tsx`

**Reemplazar en CVA:**
```typescript
// ANTES
size: {
  default: "h-11 px-4 py-2",
  sm: "h-10 rounded-md px-3",
  lg: "h-12 rounded-md px-8",
  icon: "h-12 w-12",
},

// DESPUÉS
size: {
  default: "h-10 px-3 py-1.5 sm:h-11 sm:px-4 sm:py-2",
  sm: "h-9 rounded-md px-2.5 text-xs sm:h-10 sm:px-3",
  lg: "h-12 rounded-md px-6 sm:px-8 text-base",
  icon: "h-10 w-10 sm:h-12 sm:w-12",
},
```

**Agregar a CVA base:**
```typescript
// Agregar este focus-visible a la base (antes de variants)
"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
```

---

### Action 2: Normalizar Card component

**Archivo:** `src/components/ui/card.tsx`

**CardTitle:**
```tsx
// ANTES
className={cn(
  "text-2xl font-semibold leading-none tracking-tight text-foreground",
  className
)}

// DESPUÉS
className={cn(
  "text-lg sm:text-xl md:text-2xl font-semibold leading-tight tracking-tight text-foreground",
  className
)}
```

**CardHeader:**
```tsx
// ANTES
className={cn("flex flex-col space-y-1.5 p-6", className)}

// DESPUÉS
className={cn("flex flex-col space-y-1.5 p-4 sm:p-5 md:p-6", className)}
```

**CardContent:**
```tsx
// ANTES
className={cn("p-6 pt-0", className)}

// DESPUÉS
className={cn("p-4 pt-0 sm:p-5 md:p-6 md:pt-0", className)}
```

---

### Action 3: Normalizar Dark Mode

**Archivo:** `src/index.css`

**En sección `:root`:**
```css
/* Cambiar esta línea */
--primary: 18 80% 52%;

/* A agregar estas */
--success: 152 55% 42%;
--warning: 38 90% 55%;
--info: 217 100% 50%;
--pending: 30 100% 50%;
```

**En sección `.dark`:**
```css
/* Cambiar primary dark */
--primary: 217.2 91.2% 59.8%;  /* ← CAMBIAR A: */
--primary: 24 80% 58%;         /* naranja ajustado */

/* Agregar estos */
--success: 152 100% 50%;
--warning: 38 100% 60%;
--info: 200 100% 55%;
--pending: 24 100% 60%;
```

---

### Action 4: Agregar prefers-reduced-motion

**Archivo:** `src/index.css`

**Agregar en `@layer utilities`:**
```css
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

---

### Action 5: Agregar ARIA labels a sidebar

**Archivo:** `src/components/AppLayout.tsx`

**En botón toggle sidebar:**
```tsx
// ANTES
<button onClick={toggleSidebar} className="...">
  <Menu />
</button>

// DESPUÉS
<button 
  onClick={toggleSidebar} 
  className="..."
  aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
  aria-expanded={sidebarOpen}
  aria-controls="sidebar-navigation"
>
  <Menu />
</button>
```

---

## 📊 VERIFICACIÓN POST-CAMBIOS

### Ejecutar en terminal para validar:

```bash
# Validar tipos
npm run typecheck

# Linter
npm run lint

# Build test
npm run build

# Visual inspection en dev
npm run dev
# Abrir http://localhost:5173
# Probar en DevTools (375px, 768px, 1920px)
# Probar dark mode toggle
# Probar keyboard navigation (Tab)
```

---

## 🎯 CHECKPOINTS DE VALIDACIÓN

### Checkpoint 1: Dark Mode (Fase 1)
```
[ ] Colores no hardcodeados en animations.tsx
[ ] Primary color visible en dark
[ ] CardTitles legibles en ambos modos
[ ] Sidebar color respeta tema
[ ] Shadows visibles en dark mode
[ ] Ejecutar: npm run build (sin errores)
```

### Checkpoint 2: Accesibilidad (Fase 1)
```
[ ] Botones tienen focus-visible ring
[ ] Sidebar toggle tiene aria-label
[ ] Tab navigation funciona
[ ] prefers-reduced-motion respetado
[ ] Sin WCAG violations detectadas (axe)
```

### Checkpoint 3: Responsive (Fase 2)
```
[ ] 375px: sin scroll horizontal
[ ] 768px: layout adaptado
[ ] 1920px: max-width respetado
[ ] Tipografía legible en todos tamaños
[ ] Padding responsive aplicado
[ ] Mobile buttons 44x44px min
```

### Checkpoint 4: Tipografía (Fase 2)
```
[ ] Escala normalizada en tailwind.config.ts
[ ] Todos components usan escala
[ ] Line-height >= 1.5 para body
[ ] Contraste >= 4.5:1 para todos textos
[ ] Font-weight consistente
```

---

## 📍 PUNTOS DE ALERTA COMUNES

| Alerta | Causa | Solución |
|--------|-------|----------|
| Build falla | Tailwind class desconocida | Usar clases estándar Tailwind |
| Dark mode roto | Hardcoded color | Cambiar a CSS variable |
| Mobile cut off | Sin responsive | Agregar `sm:`, `md:` breakpoints |
| Button invisible | Sin focus ring | Agregar `focus-visible:ring` |
| Animación jerky | prefers-reduced-motion no respetada | Verificar media query |

---

## 📞 REFERENCIAS RÁPIDAS

**Paleta luz (HSL values):**
```
Primary:     18 80% 52% (naranja #E8752F)
Secondary:   30 30% 88% (beige)
Accent:      170 45% 48% (teal)
Background:  30 20% 98% (crema)
Foreground:  20 15% 12% (marrón oscuro)
```

**Paleta oscura:**
```
Primary:     24 80% 58% (naranja claro)
Background:  220 20% 10% (azul negro)
Foreground:  210 40% 95% (blanco azulado)
```

**Breakpoints:**
```
xs: 320px   (mobile small)
sm: 640px   (mobile)
md: 768px   (tablet)
lg: 1024px  (desktop small)
xl: 1280px  (desktop)
2xl: 1536px (ultra-wide)
```

**Duración animaciones:**
```
ultra-fast: 150ms
fast:       200ms
normal:     300ms
slow:       500ms
```

---

**Última actualización:** 2026-06-05  
**Versión:** 1.0  
**Status:** Listo para implementación

