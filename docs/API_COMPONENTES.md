# API de Componentes UI — CONSTRUSMART ERP

## ElevatedCard

Tarjeta con elevación configurable y efecto hover opcional.

```tsx
import { ElevatedCard } from '@/components/ui/elevated-card';

<ElevatedCard elevation={3} hoverable className="p-4">
  <h3>Título</h3>
  <p>Contenido de la tarjeta</p>
</ElevatedCard>
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `elevation` | `1 \| 2 \| 3 \| 4 \| 5` | `2` | Nivel de sombra/elevación |
| `hoverable` | `boolean` | `false` | Efecto hover con elevación aumentada |
| `className` | `string` | `''` | Clases adicionales |
| `children` | `ReactNode` | — | Contenido de la tarjeta |

---

## FloatingLabelInput

Input con label flotante animado.

```tsx
import { FloatingLabelInput } from '@/components/ui/floating-label-input';

<FloatingLabelInput
  label="Correo Electrónico"
  id="email"
  type="email"
  placeholder="correo@ejemplo.com"
  value={email}
  onChange={handleChange}
/>
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `label` | `string` | — | Texto del label |
| `id` | `string` | — | ID del input |
| `type` | `string` | `'text'` | Tipo de input |
| `placeholder` | `string` | `''` | Placeholder |
| `value` | `string` | — | Valor controlado |
| `onChange` | `(e) => void` | — | Handler de cambio |
| `className` | `string` | `''` | Clases adicionales |

---

## PageTransition

Animación de entrada para cambios de pantalla.

```tsx
import { PageTransition } from '@/components/Animations';

<PageTransition animationType="fade">
  <MiComponente />
</PageTransition>
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `animationType` | `'fade' \| 'slide' \| 'scale' \| 'none'` | `'fade'` | Tipo de animación |
| `children` | `ReactNode` | — | Contenido a animar |

---

## AnimatedCounter

Número que se anima desde 0 hasta el valor final.

```tsx
import { AnimatedCounter } from '@/components/Animations';

<AnimatedCounter value={15000} duration={1000} prefix="Q " suffix=".00" />
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `value` | `number` | — | Valor final |
| `duration` | `number` | `800` | Duración en ms |
| `prefix` | `string` | `''` | Prefijo (ej: "Q ") |
| `suffix` | `string` | `''` | Sufijo (ej: ".00") |
| `className` | `string` | `''` | Clases adicionales |

---

## StaggerChildren

Aplica animación escalonada a hijos con delay incremental.

```tsx
import { StaggerChildren } from '@/components/Animations';

<StaggerChildren baseDelay={50}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</StaggerChildren>
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `children` | `ReactNode[]` | — | Elementos a animar |
| `baseDelay` | `number` | `50` | Delay base entre items (ms) |
| `className` | `string` | `''` | Clases adicionales |

---

## FadeIn / ScaleIn / SlideInRight

Componentes wrapper con animaciones específicas.

```tsx
import { FadeIn, ScaleIn, SlideInRight } from '@/components/Animations';

<FadeIn delay={200} duration={500}>
  <div>Aparece suavemente</div>
</FadeIn>

<ScaleIn delay={100}>
  <div>Aparece con zoom</div>
</ScaleIn>

<SlideInRight delay={300}>
  <div>Entra desde la derecha</div>
</SlideInRight>
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Contenido |
| `delay` | `number` | `0` | Delay antes de animar (ms) |
| `duration` | `number` | `300` (FadeIn) | Duración (ms) |
| `className` | `string` | `''` | Clases adicionales |

---

## PulseDot

Punto pulsante para indicar estado en vivo.

```tsx
import { PulseDot } from '@/components/Animations';

<PulseDot color="success" size="md" label="En línea" />
<PulseDot color="warning" label="En pausa" />
<PulseDot color="danger" label="Error" />
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `color` | `'success' \| 'warning' \| 'danger' \| 'info'` | `'success'` | Color del punto |
| `size` | `'sm' \| 'md' \| 'lg'` | `'sm'` | Tamaño |
| `label` | `string` | — | Texto descriptivo |

---

## SkeletonCard

Esqueleto animado para cards en carga.

```tsx
import { SkeletonCard } from '@/components/Animations';

<SkeletonCard lines={4} className="w-80" />
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `lines` | `number` | `3` | Número de líneas de texto |
| `className` | `string` | `''` | Clases adicionales |

---

## LoadingSpinner

Spinner animado con tamaño configurable.

```tsx
import { LoadingSpinner } from '@/components/Animations';

<LoadingSpinner size="lg" label="Cargando datos..." />
```

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del spinner |
| `label` | `string` | — | Texto de carga |
| `className` | `string` | `''` | Clases adicionales |

---

## syncAllVisualSettings

Sincroniza todas las preferencias visuales al DOM.

```tsx
import { syncAllVisualSettings } from '@/lib/themes';

syncAllVisualSettings({
  appTheme: 'ant-design',
  compactMode: false,
  primaryColor: '#ff8c42',
  animationsEnabled: true,
  fontSize: 'medium',
  fontFamily: 'inter',
  borderRadius: 'medium',
  spacingScale: 'normal',
  densityTable: 'normal',
  sidebarPosition: 'left',
  sidebarMode: 'expanded',
  sidebarWidth: 240,
  breadcrumbsEnabled: true,
  footerEnabled: true,
  touchMode: false,
});
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `appTheme` | `string` | Tema visual |
| `compactMode` | `boolean` | Modo compacto |
| `primaryColor` | `string` | Color primario HEX |
| `animationsEnabled` | `boolean` | Animaciones on/off |
| `fontSize` | `string` | Tamaño de fuente |
| `fontFamily` | `string` | Fuente tipográfica |
| `borderRadius` | `string` | Radio de bordes |
| `spacingScale` | `string` | Escala de espaciado |
| `densityTable` | `string` | Densidad de tablas |
| `sidebarPosition` | `string` | Posición del sidebar |
| `sidebarMode` | `string` | Modo del sidebar |
| `sidebarWidth` | `number` | Ancho del sidebar |
| `breadcrumbsEnabled` | `boolean` | Migas de pan |
| `footerEnabled` | `boolean` | Pie de página |
| `touchMode` | `boolean` | Modo táctil |