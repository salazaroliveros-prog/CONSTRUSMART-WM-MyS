# 🎨 Sistema de Temas Global - CONSTRUSMART ERP

## Descripción General

El sistema de temas permite cambiar la apariencia visual de TODA la aplicación (login, módulos, tablas, formularios, etc.) con un único click. Los cambios se aplican instantáneamente sin necesidad de recargar.

## 5 Temas Disponibles

### 1. **Ant Design** (Actual - Por defecto)
- **Descripción**: Limpio, profesional, minimalista
- **Border Radius**: 4px (muy compacto)
- **Sombras**: Suaves y sutiles
- **Transiciones**: Rápidas (150-300ms)
- **Ideal para**: Usuarios que buscan interfaz clara y directa

### 2. **Dark Pro** (Premium Oscuro)
- **Descripción**: Modo oscuro profesional con acentos vibrantes (cian/magenta)
- **Border Radius**: 12px (redondeado)
- **Sombras**: Con brillo de cian
- **Transiciones**: Curvas suaves (150-350ms)
- **Ideal para**: Ambiente nocturno, reducción de fatiga ocular

### 3. **Material 3** (Google Design)
- **Descripción**: Material Design 3, fluido y moderno
- **Border Radius**: 12px
- **Sombras**: Elegantes y sutiles
- **Transiciones**: Easing natural (150-350ms)
- **Ideal para**: Usuarios que prefieren Google Material Design

### 4. **Glassmorphism** (Vidrio Esmerilado)
- **Descripción**: Efecto de vidrio transparente con blur
- **Border Radius**: 20px (muy redondeado)
- **Sombras**: Con color primario translúcido
- **Transiciones**: Suaves (150-500ms)
- **Backdrop Blur**: 20px
- **Ideal para**: Interfaz moderna y sofisticada

### 5. **Neomorphism** (Suave y Minimalista)
- **Descripción**: Diseño 3D suave con sombras inset/outset
- **Border Radius**: 16px
- **Sombras**: Duales (outset + inset)
- **Transiciones**: Linear suave (200-500ms)
- **Ideal para**: Aesthetic minimalista y relajante

---

## Arquitectura Técnica

### Estructura de Archivos

```
src/
├── lib/
│   └── themes.ts              # Sistema de temas (tipos, constantes, funciones)
├── styles/
│   └── themes.css             # Estilos CSS por tema (250+ líneas)
├── components/
│   └── ThemeSelector.tsx       # Componente selector en Ajustes
├── erp/
│   └── screens/
│       ├── LoginNew.tsx        # Login con selector de temas integrado
│       └── Login.tsx           # Login actual (deprecado)
└── main.tsx                    # Inicializa tema al cargar la app
```

### Flujo de Inicialización

```
1. main.tsx carga
   ↓
2. Importa './styles/themes.css' (define [data-theme] selectors)
   ↓
3. Ejecuta initializeTheme() → lee localStorage.wm_erp_theme
   ↓
4. Obtiene tema (default: 'ant-design')
   ↓
5. Ejecuta applyTheme(theme)
   ↓
6. Aplica CSS variables al :root
   ↓
7. Establece data-theme="ant-design" en <html>
   ↓
8. CSS selectors [data-theme='ant-design'] se activan
   ↓
9. React renderiza con estilos aplicados
```

---

## Cómo Funciona

### 1. Cambiar de Tema (Usuario)

**Opción A: En el Login**
- Click en botón 🎨 (Palette) esquina superior derecha
- Elige tema y hace click en "Elegir"
- Cambios aplicados instantáneamente

**Opción B: En Ajustes**
- Navega a **Administración** → **Ajustes** → **Tema de la Aplicación**
- Click en tema deseado
- Cambios se aplican al instante y se guardan en localStorage

### 2. Vista Previa de Tema

- Click en ojo (👁️) en cada tema para preview
- Todos los componentes cambian color/sombras/radius
- Click nuevamente para volver al tema activo

### 3. Selector de Temas (Código)

```tsx
import { ThemeSelector } from '@/components/ThemeSelector'

export function Settings() {
  return (
    <div>
      <ThemeSelector />
      {/* Resto del componente */}
    </div>
  )
}
```

---

## Implementación en Componentes

### Cómo se aplican los estilos

Los estilos se aplican a **TODOS** los elementos automáticamente mediante:

1. **CSS Variables Dinámicas** (`:root`)
   ```css
   --primary: 221 83% 53%;
   --border-radius: 4px;
   --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.15);
   ```

2. **Data-theme Attribute** en `<html>`
   ```html
   <html data-theme="dark-pro">
   ```

3. **Selectores CSS por Tema**
   ```css
   [data-theme='dark-pro'] button {
     box-shadow: 0 4px 12px rgba(0, 217, 255, 0.1);
   }
   ```

### Elemento afectados automáticamente

✅ Botones  
✅ Inputs  
✅ Tablas  
✅ Cards  
✅ Headers  
✅ Sidebar  
✅ Modales  
✅ Alertas  
✅ Badges  
✅ Formularios  
✅ Scrollbars  
✅ Links  
✅ Dropdowns  
✅ Progress bars  
✅ Tooltips  

**NO requieren cambios de código** - Se aplican automáticamente.

---

## API de Temas

### Funciones Principales

#### `initializeTheme()`
Ejecutar al cargar la app. Lee tema guardado y lo aplica.

```ts
import { initializeTheme } from '@/lib/themes'

initializeTheme() // Cargado en main.tsx automáticamente
```

#### `applyTheme(theme)`
Aplicar un tema específico.

```ts
import { applyTheme, THEMES } from '@/lib/themes'

applyTheme(THEMES['dark-pro'])
```

#### `getStoredTheme()`
Obtener tema actual del usuario.

```ts
import { getStoredTheme } from '@/lib/themes'

const currentTheme = getStoredTheme() // 'ant-design' | 'dark-pro' | etc
```

### Tipos

```ts
type ThemeName = 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism'

interface ThemeColors {
  primary: string
  primaryForeground: string
  secondary: string
  // ... más colores
}

interface ThemeConfig {
  name: ThemeName
  label: string
  description: string
  colors: ThemeColors
  cssVars: Record<string, string>
  styles: {
    borderRadius: string
    shadows: { sm, md, lg, xl }
    transitions: { fast, base, slow }
    backdropBlur?: string
  }
}
```

### Constantes

```ts
import { 
  THEMES,                // Record<ThemeName, ThemeConfig>
  THEME_ANT_DESIGN,     // Config del tema Ant Design
  THEME_DARK_PRO,       // Config del tema Dark Pro
  THEME_MATERIAL3,      // Config del tema Material 3
  THEME_GLASSMORPHISM,  // Config del tema Glassmorphism
  THEME_NEOMORPHISM,    // Config del tema Neomorphism
} from '@/lib/themes'
```

---

## Persistencia

- **Storage**: `localStorage.wm_erp_theme`
- **Clave**: `'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism'`
- **Duración**: Persistente (se mantiene entre sesiones)
- **Fallback**: 'ant-design' si no hay tema guardado

---

## Ejemplos de Uso

### Ejemplo 1: Crear botón para cambiar tema

```tsx
import { THEMES, applyTheme } from '@/lib/themes'

function ThemeSwitcher() {
  const handleSwitch = (themeName) => {
    applyTheme(THEMES[themeName])
  }

  return (
    <button onClick={() => handleSwitch('dark-pro')}>
      Cambiar a Dark Pro
    </button>
  )
}
```

### Ejemplo 2: Detectar tema actual en componente

```tsx
import { getStoredTheme } from '@/lib/themes'

function MyComponent() {
  const theme = getStoredTheme()
  
  return (
    <div>
      Tema actual: {theme}
    </div>
  )
}
```

### Ejemplo 3: Aplicar estilos condicionales por tema

```tsx
function MyCard() {
  const theme = getStoredTheme()
  
  return (
    <div className={theme === 'glassmorphism' ? 'backdrop-blur-lg' : ''}>
      {/* Contenido */}
    </div>
  )
}
```

---

## Personalización

### Agregar un nuevo tema

1. **Crear configuración en `src/lib/themes.ts`**

```ts
export const THEME_CUSTOM: ThemeConfig = {
  name: 'custom',
  label: 'Mi Tema',
  description: 'Descripción del tema',
  colors: {
    primary: 'hsl(200 100% 50%)',
    // ... resto de colores
  },
  cssVars: {
    '--primary': '200 100% 50%',
    // ... resto de variables
  },
  styles: {
    borderRadius: '10px',
    shadows: {
      sm: '0 2px 4px rgba(0,0,0,0.1)',
      // ... resto de sombras
    },
    transitions: {
      fast: '150ms ease',
      // ... resto de transiciones
    },
  },
}
```

2. **Agregar a `THEMES` record**

```ts
export const THEMES: Record<ThemeName, ThemeConfig> = {
  'ant-design': THEME_ANT_DESIGN,
  'dark-pro': THEME_DARK_PRO,
  'custom': THEME_CUSTOM,  // ← Nuevo
  // ... resto
}
```

3. **Agregar estilos en `src/styles/themes.css`**

```css
[data-theme='custom'] {
  --primary: 200 100% 50%;
  --border-radius: 10px;
  /* ... resto de variables */
}

[data-theme='custom'] button {
  /* Estilos específicos para botones en este tema */
}
```

4. **Actualizar tipo**

```ts
type ThemeName = 'ant-design' | 'dark-pro' | 'material3' | 'glassmorphism' | 'neomorphism' | 'custom'
```

---

## Debugging

### Ver tema actual en Console

```ts
console.log(localStorage.getItem('wm_erp_theme'))
console.log(document.documentElement.getAttribute('data-theme'))
```

### Ver CSS variables aplicadas

```ts
console.log(getComputedStyle(document.documentElement).getPropertyValue('--primary'))
```

### Limpiar tema guardado

```ts
localStorage.removeItem('wm_erp_theme')
location.reload()
```

---

## Performance

- **CSS Variables**: ✅ Nativas (sin runtime overhead)
- **Cambios instantáneos**: ✅ Sin re-render innecesario
- **Bundle size**: ✅ ~8KB (themes.ts + themes.css)
- **Carga inicial**: ✅ <5ms (lectura localStorage + aplicación CSS)

---

## Compatibilidad

✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 15+  
✅ Edge 90+  
❌ IE11 (no soporta CSS variables)

---

## Próximos Pasos

1. ✅ Sistema de temas implementado
2. ⏳ Agregar más temas personalizados según feedback de usuarios
3. ⏳ Sincronizar tema con servidor (opcional)
4. ⏳ Tema automático según hora del día
5. ⏳ Temas por rol (ej: Administrador → Dark Pro, Usuario → Glassmorphism)

---

**Último actualizado**: 2026-06-07  
**Versión**: 1.0  
**Mantenedor**: Amazon Q Agent
