# Plan de Unificación UI/UX — ERP CONSTRUSMART

## Objetivo
Unificar visual y funcionalmente toda la interfaz del ERP aprovechando el módulo de Ajustes como centro de control de personalización, eliminando inconsistencias entre pantallas y garantizando una experiencia cohesiva en desktop y móvil.

---

## Diagnóstico Actual

### Lo que YA existe en `Ajustes.tsx`

| Control | Tipo | Estado |
|---------|------|--------|
| Framework UI | Radio shadcn ↔ antd | ✅ |
| Tema Visual | 8 temas con preview | ✅ |
| Color Principal | 8 colores predefinidos | ✅ |
| Tamaño de Fuente | small / medium / large | ✅ |
| Animaciones | Switch on/off | ✅ |
| Modo Compacto | Switch on/off | ✅ |
| Idioma | es / en | ✅ |
| Formato de Fecha | 3 formatos | ✅ |
| Moneda | GTQ / USD | ✅ |
| Notificaciones | 4 switches | ✅ |
| Export/Import config | Backup JSON | ✅ |
| Preview panel | Tags, botones, Badge, Select | ✅ |
| Info de cuenta | Avatar, rol, ID, cambiar contraseña | ✅ |

### Lo que FALTA (actualizado 07/06/2026)

| Control | Impacto | Prioridad |
|---------|---------|-----------|
| Posición del sidebar (izquierda/derecha/overlay) | Alta | P0 |
| Modo hover-to-expand en sidebar colapsado | Alta | P0 |
| Fuente tipográfica seleccionable | Media | P1 |
| Espaciado/padding global | Alta | P0 |
| Radio de bordes global | Media | P1 |
| Densidad de tabla (compact/normal/comfortable) | Alta | P0 |
| Selector de íconos (lucide vs feather vs custom) | Baja | P2 |
| Animaciones por tipo (fade, slide, scale, none) | Media | P1 |
| Breadcrumbs on/off | Media | P1 |
| Posición de notificaciones toast (top-right, bottom-left, etc.) | Baja | P2 |
| Modo quiosco/touch para tablets en campo | Alta | P0 |
| Barra de herramientas flotante en móvil | Alta | P0 |
| Footer on/off | Baja | P2 |
| Sonidos de notificación | Baja | P2 |

---

## Items a Implementar (Checklist)

### Fase 1 — Infraestructura de Tema Global (P0)

- [x] **1.1 Variables CSS dinámicas**
  - ✅ `src/styles/design-tokens.css` creado con variables CSS custom properties
  - ✅ Soporta: `--color-primary`, `--color-bg`, `--color-text`, `--radius`, `--spacing`, `--font-family`, `--elevation-*`
  - ✅ Generado desde la configuración del store de Ajustes

- [x] **1.2 Store de tema unificado**
  - ✅ `useErp().ajustes` extendido con propiedades de tema
  - ✅ Persistido en localStorage con compresión lz-string
  - ✅ Sincronizado con Supabase

- [x] **1.3 Provider de tema**
  - ✅ `src/lib/themes.ts` con 5 temas (Ant Design, Dark Pro, Material 3, Glassmorphism, Neomorphism)
  - ✅ Integrado en AppLayout.tsx
  - ✅ Escucha cambios en el store y actualiza variables dinámicamente

- [x] **1.4 Clases utilitarias Tailwind dinámicas**
  - ✅ `tailwind.config.ts` configurado con variables CSS
  - ✅ `bg-primary`, `text-primary`, `rounded-md` respetan el tema

### Fase 2 — Sidebar Unificado (P0)

- [ ] **2.1 Posiciones de sidebar**
  - Izquierda (default), derecha, overlay (móvil)
  - Control en Ajustes → `sidebarPosition: 'left' | 'right' | 'overlay'`

- [ ] **2.2 Modos de sidebar**
  - Expanded (icon + label)
  - Collapsed (icon only)
  - Hover-to-expand (collapsed + expand al hover)
  - Mini (icon + label truncado, más angosto)

- [ ] **2.3 Ancho configurable**
  - Expanded: 240px / 280px / 320px
  - Mini: 64px / 72px / 80px

- [x] **2.4 Sidebar responsiva**
  - ✅ En móvil (< 768px): overlay automático con backdrop
  - ✅ En tablet (768-1024px): collapsed por defecto

### Fase 3 — Componentes UI Unificados (P0)

- [ ] **3.1 Sistema de densidad global**
  - Compact: padding reducido, fuente 13px, tablas densas
  - Normal: padding estándar, fuente 14px
  - Comfortable: padding amplio, fuente 15px, espaciado generoso
  - Control en Ajustes → `density: 'compact' | 'normal' | 'comfortable'`

- [x] **3.2 Botones unificados**
  - ✅ `ui/index.ts` con BUTTON_PRIMARY, BUTTON_DARK, BUTTON_DANGER, BUTTON_ICON
  - ✅ Todos los botones usan los mismos tokens de color

- [x] **3.3 Cards unificadas**
  - ✅ `elevated-card.tsx` con sistema de elevación
  - ✅ Bordes, sombras y padding consistentes via design-tokens.css

- [x] **3.4 Inputs unificados**
  - ✅ `floating-label-input.tsx` con animación de label flotante
  - ✅ INPUT unificado en ui/index.ts

- [ ] **3.5 Modales unificados**
  - ⚠️ Uso mixto de antd Modal y modales personalizados
  - Pendiente aplicar tokens de tema a todos los modales

- [ ] **3.6 Tablas unificadas**
  - ⚠️ Tablas directas y VirtualTable no comparten densidad
  - Pendiente aplicar `--radius`, `--spacing`, colores de borde

### Fase 4 — Layout General (P0)

- [x] **4.1 Header unificado**
  - ✅ Header con lazy loading
  - ✅ Selector rápido de proyecto
  - ⚠️ Breadcrumbs no implementados

- [ ] **4.2 Footer**
  - Opcional, on/off desde Ajustes
  - Mostrar: versión, año, enlace a soporte

- [ ] **4.3 Breadcrumbs**
  - Navegación jerárquica on/off
  - Estilo: simple o con íconos

### Fase 5 — Móvil / Touch (P0)

- [ ] **5.1 Modo quiosco / touch**
  - Botones más grandes (min-height: 48px)
  - Targets táctiles de al menos 44x44px
  - Gestos: swipe para navegar, pull-to-refresh
  - Control en Ajustes → `touchMode: boolean`

- [x] **5.2 Barra de herramientas flotante (FAB)**
  - ✅ QuickActionsFab implementado
  - ✅ Posición: bottom-right
  - ⚠️ No personalizable desde Ajustes

- [x] **5.3 Tabla responsiva**
  - ✅ En móvil: scroll horizontal
  - ⚠️ Conversión a cards verticales no implementada

### Fase 6 — Animaciones y Transiciones (P1)

- [x] **6.1 Sistema de animaciones**
  - ✅ `Animations.tsx` con PageTransition, AnimatedCounter, AnimatedCheckIcon, FadeInStagger
  - ✅ Soporta `prefers-reduced-motion`
  - ⚠️ Solo fade implementado, falta slide, scale

- [x] **6.2 Transiciones de ruta**
  - ✅ PageTransition wrapper en AppLayout.tsx
  - ✅ Consistente entre todas las pantallas

### Fase 7 — Personalización Avanzada (P1)

- [ ] **7.1 Fuente tipográfica**
  - Opciones: Inter, Roboto, Open Sans, Poppins, System UI
  - Precarga de fuente seleccionada

- [ ] **7.2 Radio de bordes**
  - Valores: none (0px), small (4px), medium (8px), large (12px), full (999px)
  - Aplica a: cards, botones, inputs, modales

- [ ] **7.3 Espaciado/padding**
  - Escalas: compact / normal / spacious
  - Aplica a: padding de cards, gap entre elementos, margen de secciones

### Fase 8 — Migración de Pantallas Existentes (P1)

- [x] **8.1 Auditoría de pantalla por pantalla**
  - ✅ 38 screens auditadas
  - ✅ Inconsistencias documentadas en GAP_ANALYSIS_COMPLETO.md

- [x] **8.2 Refactorizar 5 pantallas críticas**
  - ✅ Proyectos.tsx (usa CARD unificada)
  - ✅ Presupuestos.tsx (usa INPUT/BUTTON unificados)
  - ✅ Seguimiento.tsx (usa tabla con densidad)
  - ✅ Financiero.tsx (unifica KPI cards)
  - ⚠️ Bodega.tsx (tiene hover:COLOR_DANGER inválido)

- [ ] **8.3 Refactorizar resto de pantallas**
  - ⚠️ 28 screens pendientes de refactorización completa
  - ⚠️ CRM.tsx tiene COLOR_* string literals (~13 instancias)

---

## Método de Refactorización

### Principios

1. **No romper funcionalidad existente** — cada cambio debe mantener la lógica de negocio intacta.
2. **Migración progresiva** — no se refactoriza todo de golpe; se avanza por fases.
3. **Tema como fuente de verdad** — todos los valores visuales se leen del store de ajustes.
4. **Componentes compartidos primero** — antes de tocar pantallas, se fortalecen los bloques base.
5. **Responsive por defecto** — toda pantalla nueva o refactorizada debe funcionar en móvil.

### Flujo de trabajo por pantalla

```
1. Identificar componentes UI usados (CARD, INPUT, BUTTON, etc.)
2. Reemplazar estilos inline por clases del sistema UI
3. Aplicar tokens de tema (--color-*, --radius, --spacing)
4. Verificar modo responsive (mobile-first)
5. Verificar modo compacto/normal/comfortable
6. Verificar modo touch si aplica
7. Ejecutar tests existentes (no deben fallar)
```

### Orden de refactorización de pantallas

| Prioridad | Pantalla | Componentes a unificar | Estado |
|-----------|----------|------------------------|--------|
| P0 | Proyectos | CARD, INPUT, BUTTON, MODAL, tabla | ✅ Parcial |
| P0 | Presupuestos | INPUT, BUTTON, tabla, modales | ✅ Parcial |
| P0 | Seguimiento | CARD, tabla, KPI, Gantt | ✅ Parcial |
| P0 | Financiero | KPI_CARD, tabla, CARD | ✅ Parcial |
| P0 | Bodega | tabla, INPUT, BUTTON, MODAL | ⚠️ hover:COLOR_DANGER |
| P1 | Dashboard | KPI_CARD, CARD, gráficos | ✅ Rediseñado |
| P1 | APU Avanzado | tabla, INPUT, BUTTON | ✅ Rediseñado |
| P1 | Logística | tabla, CARD, BUTTON | ⚠️ Pendiente |
| P1 | RRHH | tabla, INPUT, CARD | ⚠️ Pendiente |
| P1 | CRM | CARD, BUTTON, MODAL | ⚠️ COLOR_* literals |
| P2 | Resto | según corresponda | ⚠️ Pendiente |

### Integración con Ajustes

Cada nuevo control de personalización debe:
1. Agregarse al store `useErp().ajustes`
2. Agregarse UI en `Ajustes.tsx` con preview
3. Persistirse en localStorage y Supabase
4. Propagar cambios via `ThemeProvider` o clases condicionales

### Variables CSS generadas

```css
:root {
  --color-primary: #1677ff;
  --color-primary-hover: #4096ff;
  --color-bg: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-text: #1f1f1f;
  --color-text-secondary: #8c8c8c;
  --color-border: #d9d9d9;
  --radius: 8px;
  --spacing: 16px;
  --font-family: 'Inter', sans-serif;
  --sidebar-width: 240px;
  --sidebar-position: left;
  --header-height: 56px;
  --animation-duration: 300ms;
  --animation-type: fade;
  --elevation-1: 0 1px 2px rgba(0,0,0,0.05);
  --elevation-2: 0 4px 6px rgba(0,0,0,0.07);
  --elevation-3: 0 10px 15px rgba(0,0,0,0.1);
  --elevation-4: 0 20px 25px rgba(0,0,0,0.12);
  --elevation-5: 0 30px 40px rgba(0,0,0,0.15);
}
```

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Cambios visuales rompen tests de snapshot | Usar clases dinámicas, no valores hardcodeados |
| Personalización excesiva degrada rendimiento | Cachear valores calculados, limitar re-renders |
| Migración lenta por cantidad de pantallas | Priorizar P0, el resto en sprints siguientes |
| Usuarios confundidos por cambios visuales | Tooltips de "nuevo" en Ajustes, documentación |
| Modo touch afecta experiencia desktop | Detectar automáticamente, permitir override |

---

## Entregables por Fase

| Fase | Entregable | Tiempo estimado | Estado |
|------|-----------|-----------------|--------|
| F1 | theme-variables.css, ThemeProvider, store extendido | 2 días | ✅ COMPLETADO |
| F2 | Sidebar refactorizado con posiciones y modos | 2 días | ⚠️ Parcial (solo responsivo) |
| F3 | Componentes UI unificados con densidad | 3 días | ⚠️ Parcial (sin densidad) |
| F4 | Header/Breadcrumbs/Footer configurables | 1 día | ⚠️ Parcial (sin breadcrumbs/footer) |
| F5 | Modo quiosco/touch + FAB + tablas responsive | 3 días | ⚠️ Parcial (FAB sí, quiosco no) |
| F6 | Sistema de animaciones y transiciones | 2 días | ✅ COMPLETADO |
| F7 | Fuente, bordes, espaciado avanzado | 1 día | ❌ No iniciado |
| F8 | Migración de 5 pantallas críticas | 5 días | ⚠️ Parcial (4/5, Bodega pendiente) |
| **Total** | | **~19 días hábiles** | **~60% completado** |