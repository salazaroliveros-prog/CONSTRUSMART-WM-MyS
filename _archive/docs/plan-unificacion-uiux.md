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

### Lo que FALTA

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

- [ ] **1.1 Variables CSS dinámicas**
  - Crear `src/styles/theme-variables.css` con variables CSS custom properties
  - Soportar: `--color-primary`, `--color-bg`, `--color-text`, `--radius`, `--spacing`, `--font-family`, `--sidebar-width`, `--sidebar-position`
  - Generar desde la configuración del store de Ajustes

- [ ] **1.2 Store de tema unificado**
  - Extender `useErp().ajustes` con todas las nuevas propiedades
  - Persistir en localStorage con clave `construsmart-theme`
  - Sincronizar con Supabase cuando el usuario está autenticado (`erp_preferencias_usuario`)

- [ ] **1.3 Provider de tema**
  - Crear `src/erp/components/ThemeProvider.tsx`
  - Envolver AppLayout para inyectar variables CSS en `<html>` o `:root`
  - Escuchar cambios en el store y actualizar variables dinámicamente

- [ ] **1.4 Clases utilitarias Tailwind dinámicas**
  - Configurar `tailwind.config` para leer variables CSS en lugar de valores fijos
  - Garantizar que `bg-primary`, `text-primary`, `rounded-md` etc. respeten el tema

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

- [ ] **2.4 Sidebar responsiva**
  - En móvil (< 768px): overlay automático con backdrop
  - En tablet (768-1024px): collapsed por defecto, hover-to-expand opcional

### Fase 3 — Componentes UI Unificados (P0)

- [ ] **3.1 Sistema de densidad global**
  - Compact: padding reducido, fuente 13px, tablas densas
  - Normal: padding estándar, fuente 14px
  - Comfortable: padding amplio, fuente 15px, espaciado generoso
  - Control en Ajustes → `density: 'compact' | 'normal' | 'comfortable'`

- [ ] **3.2 Botones unificados**
  - Eliminar duplicación entre `ui/index.ts` y componentes inline
  - Unificar: `BUTTON_PRIMARY`, `BUTTON_DARK`, `BUTTON_DANGER`, `BUTTON_ICON`
  - Asegurar que todos los botones usen los mismos tokens de color

- [ ] **3.3 Cards unificadas**
  - Unificar: `CARD`, `KPI_CARD`, `CARD_TITLE`
  - Asegurar bordes, sombras y padding consistentes

- [ ] **3.4 Inputs unificados**
  - Unificar: `INPUT`, selects, textareas
  - Asegurar que todos usen `--radius`, `--spacing`, `--color-primary`

- [ ] **3.5 Modales unificados**
  - Unificar uso de `antd Modal` vs modales personalizados
  - Aplicar tokens de tema a todos los modales

- [ ] **3.6 Tablas unificadas**
  - "VirtualTable" y tablas directas deben compartir densidad
  - Aplicar `--radius`, `--spacing`, colores de borde

### Fase 4 — Layout General (P0)

- [ ] **4.1 Header unificado**
  - Posición: fixed (default) o static
  - Altura configurable: 48px / 56px / 64px
  - Breadcrumbs on/off
  - Selector rápido de proyecto

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

- [ ] **5.2 Barra de herramientas flotante (FAB)**
  - Acciones rápidas contextuales
  - Posición: bottom-right, bottom-left
  - Personalizable desde Ajustes

- [ ] **5.3 Tabla responsiva**
  - En móvil: convertir tablas a cards verticales
  - Columnas expandibles con detalle
  - Scroll horizontal solo cuando sea necesario

### Fase 6 — Animaciones y Transiciones (P1)

- [ ] **6.1 Sistema de animaciones**
  - Tipos: fade, slide, scale, none
  - Velocidad: fast (150ms), normal (300ms), slow (500ms)
  - Aplicar a: modales, transiciones de ruta, tooltips, sidebar

- [ ] **6.2 Transiciones de ruta**
  - Animación al cambiar de vista
  - Consistente entre todas las pantallas

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

- [ ] **8.1 Auditoría de pantalla por pantalla**
  - Revisar cada screen en `src/erp/screens/` para detectar:
    - Estilos inline vs clases compartidas
    - Componentes hardcodeados vs componentes del sistema UI
    - Inconsistencias de spacing, color, tipografía

- [ ] **8.2 Refactorizar 5 pantallas críticas**
  - Proyectos.tsx (usar CARD unificada)
  - Presupuestos.tsx (usar INPUT/BUTTON unificados)
  - Seguimiento.tsx (usar tabla con densidad)
  - Financiero.tsx (unificar KPI cards)
  - Bodega.tsx (unificar tablas y modales)

- [ ] **8.3 Refactorizar resto de pantallas**
  - Aplicar mismos principios a las ~20 pantallas restantes
  - Priorizar por frecuencia de uso

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

| Prioridad | Pantalla | Componentes a unificar |
|-----------|----------|------------------------|
| P0 | Proyectos | CARD, INPUT, BUTTON, MODAL, tabla |
| P0 | Presupuestos | INPUT, BUTTON, tabla, modales |
| P0 | Seguimiento | CARD, tabla, KPI, Gantt |
| P0 | Financiero | KPI_CARD, tabla, CARD |
| P0 | Bodega | tabla, INPUT, BUTTON, MODAL |
| P1 | Dashboard | KPI_CARD, CARD, gráficos |
| P1 | APU Avanzado | tabla, INPUT, BUTTON |
| P1 | Logística | tabla, CARD, BUTTON |
| P1 | RRHH | tabla, INPUT, CARD |
| P1 | CRM | CARD, BUTTON, MODAL |
| P2 | Resto | según corresponda |

### Integración con Ajustes

Cada nuevo control de personalización debe:
1. Agregarse al store `useErp().ajustes`
2. Agregarse UI en `Ajustes.tsx` con preview
3. Persistirse en localStorage y Supabase
4. Propagar cambios via `ThemeProvider` o clases condicionales

### Variables CSS a generar

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

| Fase | Entregable | Tiempo estimado |
|------|-----------|-----------------|
| F1 | theme-variables.css, ThemeProvider, store extendido | 2 días |
| F2 | Sidebar refactorizado con posiciones y modos | 2 días |
| F3 | Componentes UI unificados con densidad | 3 días |
| F4 | Header/Breadcrumbs/Footer configurables | 1 día |
| F5 | Modo quiosco/touch + FAB + tablas responsive | 3 días |
| F6 | Sistema de animaciones y transiciones | 2 días |
| F7 | Fuente, bordes, espaciado avanzado | 1 día |
| F8 | Migración de 5 pantallas críticas | 5 días |
| **Total** | | **~19 días hábiles** |