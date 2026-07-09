# Plan de Factorización y Refinamiento — Módulo Proyectos

**Proyecto:** CONSTRUSMART ERP  
**Módulo:** Proyectos (`src/erp/screens/Proyectos.tsx`)  
**Estado actual:** 1,152 líneas monolíticas, componentes internos sin extraer, inconsistencias de estilos  
**Objetivo:** Factorizar en componentes reutilizables, unificar diseño, mejorar UX/UI y alinear con el sistema de diseño global  
**Fecha:** 2026-07-08  

---

## 1. Diagnóstico del Estado Actual

### 1.1 Estructura de Archivos

| Archivo | Rol | Líneas |
|---------|------|--------|
| `src/erp/screens/Proyectos.tsx` | Pantalla principal — lista, crear, editar, pausar, transiciones | 1,152 |
| `src/erp/components/ProyectoFilter.tsx` | Dropdown filtro `selectedProyectoId` (usado en Dashboard) | 29 |
| `src/erp/components/HeatMap.tsx` | Mapa Leaflet con MarkerCluster + panel lateral | ~200 |
| `src/erp/components/MapPicker.tsx` | Selector de coordenadas en formulario | — |
| `src/erp/store/proyectoStateMachine.ts` | Máquina de estados (dead code — nunca importada) | 176 |
| `src/erp/store/schemas/proyectos.ts` | Schema Zod canónico + transform | — |
| `src/erp/types.ts:182-232` | Interfaz `Proyecto` | — |
| `src/erp/zustandStore.ts:605-1725` | CRUD handlers + crear desde plantilla | ~1,120 |

### 1.2 Problemas Identificados

#### A. Arquitectura Monolítica
- `Proyectos.tsx` concentra **toda la lógica** en 1,152 líneas sin subcomponentes
- No existen `ProyectoCard`, `ProyectoList`, `ProyectoForm`, `ProyectoDetail`, `ProyectoKPI`
- El formulario de crear/editar está inline con la lista, causando re-renders innecesarios

#### B. Código Muerto
- `proyectoStateMachine.ts` define validación de transiciones completa pero **nunca se importa**
- En su lugar, `zustandStore.ts:616-632` tiene una máquina de estados inline duplicada con lógica diferente
- Esto causa drift: el schema puede validar `estado='planeacion'` con `etapa='construccion'` pero la UI no previene esta inconsistencia

#### C. Duplicación de Constantes
- `estadoColor` definida idénticamente en `Proyectos.tsx:21-27` y `HeatMap.tsx:16-22`
- `lat`/`lng` vs `latitud`/`longitud`: la interfaz expone ambos pares, el schema normaliza, pero el UI usa solo `lat`/`lng`
- `proyectos_eliminados` aparece dos veces en `es.json` (líneas 661 y 764) con valores idénticos

#### D. Divergencia del Sistema de Diseño
- Algunos elementos usan constantes de `ui.ts` (`INPUT`, `BUTTON_PRIMARY`, `KPI_CARD`), otros usan clases inline
- `ProyectoFilter` no usa `SELECT` de `ui.ts` — define su propio `className`
- Colores de acción hardcodeados (`bg-emerald-500`, `bg-amber-500`) en vez de `COLOR_SUCCESS`, `COLOR_WARNING`
- `MODAL_PANEL.replace('max-w-lg sm:max-w-xl md:max-w-2xl', 'max-w-xl')` — hack frágil de string manipulation

#### E. Inconsistencias de Jerarquía Visual
- `CARD_TITLE` (`text-base mb-3`) se usa para subtítulos de KPI cards donde el espacio es limitado
- Mezcla de tamaños de texto: `text-xs`, `text-sm`, `text-base`, `text-lg` en cards sin patrón claro
- Tags de tipología/estado/etapa usan tamaños inconsistentes (`text-[10px]` vs `text-xs`)

#### F. Campos Incompletos en Formulario
- `pais` existe en schema/types pero no está en el formulario
- `factorSobrecosto` existe en schema/types pero no está en el formulario
- `latitud`/`longitud` legacy están en schema pero solo `lat`/`lng` están en el form
- `presupuestoActualId` se setea programáticamente pero no es editable

#### G. i18n Fragmentado
- Keys `proyectos.*` dispersas en múltiples bloques de `es.json`/`en.json`
- Algunas keys usan interpolación `{{variable}}`, otras concatenación
- No hay agrupación lógica por sub-vista (lista, detalle, formulario, pausa)

---

## 2. Plan de Factorización

### 2.1 Nuevos Componentes a Crear

```
src/erp/components/proyectos/
├── ProyectosKPI.tsx          # 4 KPI cards (total, en ejecución, presupuesto, contratos)
├── ProyectosToolbar.tsx      # Search + Sort + ViewToggle + Nuevo botón
├── ProyectoCard.tsx          # Card individual (grid view)
├── ProyectoListItem.tsx      # Fila compacta (list view)
├── ProyectoList.tsx          # Grid/List renderer con empty state
├── ProyectoForm.tsx          # Formulario crear/editar (extraído del modal)
├── ProyectoPauseModal.tsx    # Modal de pausa con motivo
├── ProyectoStateBadge.tsx    # Badge de estado + etapa unificado
├── ProyectoProgress.tsx      # Barras de avance físico/financiero
└── ProyectoActions.tsx       # Botones de acción contextuales
```

### 2.2 Responsabilidades por Componente

#### `ProyectosKPI.tsx`
```typescript
interface ProyectosKPIProps {
  stats: {
    total: number;
    enEjecucion: number;
    presupuestoTotal: number;
    montoContratoTotal: number;
  };
  loading?: boolean;
}
```
- Renderiza 4 `KPI_CARD` con iconos de lucide
- Internamente usa `fmtQ` para formato monetario
- Props tipadas, sin acceso al store directamente

#### `ProyectosToolbar.tsx`
```typescript
interface ProyectosToolbarProps {
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  ordenamiento: 'nombre' | 'fecha' | 'presupuesto';
  onOrdenamientoChange: (v: typeof ordenamiento) => void;
  ordenDescendente: boolean;
  onOrdenDescendenteToggle: () => void;
  vistaLista: boolean;
  onVistaListaToggle: () => void;
  onNuevoProyecto: () => void;
  onEliminarTodos: () => void;
  totalProyectos: number;
}
```
- Usa constantes `INPUT`, `BUTTON_PRIMARY`, `BUTTON_SECONDARY` de `ui.ts`
- Botones de ordenamiento con iconos `ArrowUpDown`
- Toggle de vista con `Grid3x3` / `List`

#### `ProyectoCard.tsx`
```typescript
interface ProyectoCardProps {
  proyecto: Proyecto;
  onEdit: (id: string) => void;
  onDetail: (id: string) => void;
  onStateChange: (id: string, estado: ProyectoEstado) => void;
  onPause: (id: string) => void;
  onReanudar: (id: string) => void;
  onReabrir: (id: string) => void;
}
```
- Extrae toda la lógica de presentación de tarjetas
- Usa `ProyectoStateBadge`, `ProyectoProgress`, `ProyectoActions` internamente
- Inline `estadoColor` eliminado — se pasa como prop o se calcula en lista

#### `ProyectoListItem.tsx`
```typescript
interface ProyectoListItemProps {
  proyecto: Proyecto;
  onEdit: (id: string) => void;
  onDetail: (id: string) => void;
}
```
- Versión compacta para vista lista
- Una sola fila con color bar + badges + acciones iconas

#### `ProyectoList.tsx`
```typescript
interface ProyectoListProps {
  proyectos: Proyecto[];
  vistaLista: boolean;
  onEdit: (id: string) => void;
  onDetail: (id: string) => void;
  onStateChange: (id: string, estado: ProyectoEstado) => void;
  onPause: (id: string) => void;
  onReanudar: (id: string) => void;
  onReabrir: (id: string) => void;
  onEliminarTodos: () => void;
}
```
- Renderiza grid o list según `vistaLista`
- Incluye empty state con `Building2` icon + CTA
- Maneja ordenamiento/filtrado

#### `ProyectoForm.tsx`
```typescript
interface ProyectoFormProps {
  open: boolean;
  editingId: string | null;
  onClose: () => void;
  onSubmit: (data: ProyectoFormData) => void;
  plantillas: PlantillaProyecto[];
  onSeleccionarPlantilla: (plantillaId: string) => void;
}
```
- Formulario completo con secciones colapsables
- Usa `useForm` + `zodResolver`
- Template selector con búsqueda + sugerencias
- MapPicker integrado en sección Ubicación
- Se comunica con el parent via callbacks — no accede al store directamente

#### `ProyectoPauseModal.tsx`
```typescript
interface ProyectoPauseModalProps {
  open: boolean;
  proyecto: Proyecto | null;
  onConfirm: (motivo: string, autorizador: string, fechaReanudacion: string) => void;
  onCancel: () => void;
}
```
- Modal específico para pausa/reanudación
- Campos: motivo (textarea), autorizador, fecha estimada

#### `ProyectoStateBadge.tsx`
```typescript
interface ProyectoStateBadgeProps {
  estado: ProyectoEstado;
  etapa?: EtapaObra;
  motivoPausa?: string;
  tipologia?: Tipologia;
  moneda?: string;
}
```
- Badge unificado con colores del tema (no inline styles)
- Usa `COLOR_SUCCESS`, `COLOR_WARNING`, `COLOR_DANGER`, `COLOR_INFO`, `COLOR_PRIMARY`
- Aplica `dark:` variants para consistencia en dark mode

#### `ProyectoProgress.tsx`
```typescript
interface ProyectoProgressProps {
  avanceFisico: number;
  avanceFinanciero: number;
  showLabels?: boolean;
}
```
- Dos barras `Progress` con shimmer overlay
- Formatea porcentajes con `fmtPct`
- Colores consistentes: físico=primary, financiero=warning

#### `ProyectoActions.tsx`
```typescript
interface ProyectoActionsProps {
  proyecto: Proyecto;
  onEdit: (id: string) => void;
  onDetail: (id: string) => void;
  onStateChange: (id: string, estado: ProyectoEstado) => void;
  onPause: (id: string) => void;
  onReanudar: (id: string) => void;
  onReabrir: (id: string) => void;
  onDelete: (id: string) => void;
}
```
- Botones contextuales según estado actual
- Usa `BUTTON_PRIMARY`, `BUTTON_SECONDARY`, `BUTTON_DANGER`, `BUTTON_ICON`
- Tooltips con `aria-label`

### 2.3 Estructura de Proyectos.tsx Refactorizado

```typescript
// Proyectos.tsx — ~200 líneas (de 1,152)
import { useErp } from '../store';
import { useTranslation } from 'react-i18next';
import type { Proyecto } from '../types';
import {
  ProyectosKPI,
  ProyectosToolbar,
  ProyectoList,
  ProyectoForm,
  ProyectoPauseModal,
} from './proyectos';

const Proyectos: React.FC = () => {
  const { t } = useTranslation();
  const {
    proyectos, addProyecto, updateProyecto, deleteProyecto, clearProyectos,
    plantillas, crearProyectoDesdePlantilla, sugerirPlantillas,
    setSelectedProyectoId, setView,
  } = useErp();

  // Estados locales de UI
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState<'nombre' | 'fecha' | 'presupuesto'>('fecha');
  const [ordenDescendente, setOrdenDescendente] = useState(true);
  const [vistaLista, setVistaLista] = useState(false);

  useEffect(() => { setLoading(false); }, []);

  // Handlers
  const handleSubmit = async (data: ProyectoFormData) => { ... };
  const handlePause = async (motivo: string, autorizador: string, fechaReanudacion: string) => { ... };
  const handleStateChange = async (id: string, estado: ProyectoEstado) => { ... };

  // Datos derivados
  const stats = useMemo(() => ({ ... }), [proyectos]);
  const proyectosFiltrados = useMemo(() => { ... }, [proyectos, busqueda, ordenamiento, ordenDescendente]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <ProyectosKPI stats={stats} loading={loading} />
      <ProyectosToolbar ... />
      <ProyectoList ... />
      <ProyectoForm open={showForm} editingId={editingId} onClose={() => setShowForm(false)} onSubmit={handleSubmit} ... />
      <ProyectoPauseModal open={!!pausingId} proyecto={pausingId ? proyectos.find(p => p.id === pausingId) : null} onConfirm={handlePause} onCancel={() => setPausingId(null)} />
    </div>
  );
};
```

---

## 3. Plan de Unificación Visual

### 3.1 Jerarquía de Texto Estandarizada

| Elemento | Tamaño | Peso | Uso |
|----------|--------|------|-----|
| `text-proyectos-titulo` | `text-xl sm:text-2xl` | `font-bold` | Título de pantalla |
| `text-proyectos-subtitulo` | `text-xs sm:text-sm` | `font-medium text-muted-foreground` | Subtítulo / conteo |
| `text-proyectos-card-title` | `text-sm sm:text-base` | `font-semibold` | Nombre de proyecto en card |
| `text-proyectos-card-body` | `text-xs` | `font-normal` | Detalles del proyecto |
| `text-proyectos-badge` | `text-[10px] sm:text-xs` | `font-medium` | Tags de estado/tipología |
| `text-proyectos-kpi-value` | `text-2xl sm:text-3xl` | `font-bold` | Valor KPI |
| `text-proyectos-kpi-label` | `text-[10px] sm:text-xs` | `font-medium text-muted-foreground` | Etiqueta KPI |

**Implementación:** Agregar estas variables en `src/styles/theme-variables.css` o como utility classes en `src/styles/erp-utilities.css`.

### 3.2 Constantes de Estilo en `ui.ts`

```typescript
// src/erp/ui.ts — Agregar

export const PROYECTO_CARD = 'bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all';
export const PROYECTO_CARD_HEADER = 'flex items-start justify-between p-4 pb-3';
export const PROYECTO_CARD_BODY = 'px-4 pb-3 space-y-2';
export const PROYECTO_CARD_FOOTER = 'px-4 py-3 border-t border-border flex items-center justify-between';
export const PROYECTO_BADGE = 'px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium';
export const PROYECTO_PROGRESS = 'h-1.5 rounded-full bg-muted overflow-hidden';
export const PROYECTO_ACTION_BAR = 'flex items-center gap-1.5 px-4 py-2.5 border-t border-border bg-muted/20';
```

### 3.3 Paleta de Estados Unificada

| Estado | Color | `bg` | `text` | `border` |
|--------|-------|------|--------|----------|
| `planeacion` | Gris slate | `bg-slate-100` | `text-slate-700` | `border-slate-300` |
| `ejecucion` | Verde | `bg-emerald-50 dark:bg-emerald-950` | `text-emerald-700 dark:text-emerald-400` | `border-emerald-300` |
| `pausado` | Amber | `bg-amber-50 dark:bg-amber-950` | `text-amber-700 dark:text-amber-400` | `border-amber-300` |
| `finalizado` | Azul | `bg-blue-50 dark:bg-blue-950` | `text-blue-700 dark:text-blue-400` | `border-blue-300` |
| `cancelado` | Rojo | `bg-red-50 dark:bg-red-950` | `text-red-700 dark:text-red-400` | `border-red-300` |

**Implementación:**
```typescript
// src/erp/utils/proyectoColors.ts
export const PROYECTO_STATE_COLORS: Record<ProyectoEstado, { bg: string; text: string; border: string; bar: string }> = {
  planeacion: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', bar: '#94a3b8' },
  ejecucion: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300', bar: '#10b981' },
  pausado: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300', bar: '#f59e0b' },
  finalizado: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300', bar: '#3b82f6' },
};
```

### 3.4 Eliminar Duplicación

| Issue | Fix |
|-------|-----|
| `estadoColor` duplicada en Proyectos.tsx y HeatMap.tsx | Mover a `src/erp/utils/proyectoColors.ts` |
| `lat`/`lng` vs `latitud`/`longitud` | Eliminar `latitud`/`longitud` de la interfaz `Proyecto` — usar solo `lat`/`lng` |
| `proyectoStateMachine.ts` dead code | Eliminar archivo o integrar en `zustandStore.ts` |
| `proyectos_eliminados` duplicada en i18n | Eliminar duplicado en línea 764 de `es.json` |
| Hardcoded Guatemala coords | Mover a `DEFAULT_COORDS` en `proyectoColors.ts` |
| `MODAL_PANEL.replace()` hack | Usar prop `className` en `MODAL_PANEL` o crear `MODAL_PANEL_WIDE` |

---

## 4. Mejoras de UX/UI por Pantalla

### 4.1 Vista de Lista (Grid View)

**Actual:**
- Card con color bar superior, icon circle, título, cliente, área/pisos, tags, progress, footer financiero, actions
- Espaciado inconsistente entre secciones

**Propuesto:**
```
┌─────────────────────────────────────┐
│ ▎ [Building2] Nombre Proyecto      │  ← Color bar 1.5px + header compacto
│ ▎ Cliente · Tipología · Moneda      │
│ ▎                                  │
│ ▎ Avance Físico ████████░░ 34%     │  ← Progress bar con label inline
│ ▎ Avance Fin  ██████░░░░ 30%      │
│ ▎                                  │
│ ▎ Presupuesto Q157M / Contrato Q200M│  ← Footer con separador
│ ▎ [Iniciar] [Pausar] [Detalle]     │  ← Action bar con botones contextuales
└─────────────────────────────────────┘
```

**Cambios:**
- Reducir padding interno de `p-4 pb-3` a `p-3.5 pb-2.5` para más densidad
- Unificar tamaño de badges a `text-[10px]` con `px-1.5 py-0.5`
- Progress bars con altura `h-1.5` (actualmente `h-2` en algunos lugares)
- Action buttons con `h-7 text-xs` uniforme

### 4.2 Vista de Lista (List View)

**Actual:**
- Fila con color bar, título, badges, acciones

**Propuesto:**
```
▎ Nombre Proyecto          [planeación] [residencial] [GTQ]   ✏️ 👁️ 🗑️
▎ Cliente · Área · Plazo                                  34% / 30%
```

**Cambios:**
- Hover state con `bg-muted/50` y transición
- Badges alineados a la derecha
- Progreso inline debajo del título
- Altura de fila: `min-h-[56px]` consistente

### 4.3 KPI Bar

**Actual:**
- 4 cards en grid `grid-cols-2 sm:grid-cols-4`
- Icon + valor + label + optional subtext

**Propuesto:**
- Reducir padding de `p-4` a `p-3`
- Icon size: `w-4 h-4` (actualmente `w-5 h-5`)
- Valor: `text-2xl font-bold` (mantener)
- Label: `text-[10px] text-muted-foreground uppercase tracking-wider` (más compacto)
- Subtext: `text-[10px] text-muted-foreground` debajo del valor

### 4.4 HeatMap Banner

**Actual:**
- Full-width `rounded-2xl overflow-hidden` con Leaflet
- Gradiente overlay + legend

**Propuesto:**
- Reducir altura de `h-64` a `h-48 sm:h-56` para dar más espacio al contenido principal
- Legend movida a floating badge en esquina superior derecha
- Click en marker abre `ProjectMapSidebar` con slide-in animation

### 4.5 Formulario de Crear/Editar

**Actual:**
- Modal ancho con secciones apiladas
- Campos en grid `grid-cols-1 sm:grid-cols-2`

**Propuesto:**
```
┌─ Modal (max-w-3xl) ─────────────────────────────┐
│ [Template Selector con búsqueda]                 │
│                                                  │
│ ▼ Información General                            │
│   Nombre [________________]  Tipología [▼]       │
│   Descripción [________________]                 │
│   Subtipo [____]  TipoObra [▼]  Moneda [GTQ ▼]  │
│                                                  │
│ ▼ Cliente                                        │
│   Nombre [________________]  NIT [____]          │
│   Teléfono [____]  Email [____]                  │
│                                                  │
│ ▶ Ubicación (colapsado hasta seleccionar)        │
│ ▶ Responsables                                   │
│ ▶ Documentación                                  │
│ ▶ Presupuesto y Plazos                           │
│                                                  │
│ [Cancelar]  [Guardar Proyecto]                   │
└──────────────────────────────────────────────────┘
```

**Cambios:**
- Secciones colapsables con `Collapse` de Ant Design o custom accordion
- Template selector con preview card + métricas + botón "Usar plantilla"
- Grid responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` para campos cortos
- Labels con `text-xs font-semibold text-foreground uppercase tracking-wider mb-1`
- Inputs con `h-9 text-sm` (estándar del sistema)

### 4.6 Modal de Pausa

**Actual:**
- Textarea + input fecha + botones

**Propuesto:**
- Usar `Modal.confirm` de Ant Design con layout vertical
- Motivo: `Input.TextArea` con `rows={3}`
- Autorizador: `Input` con placeholder "Nombre del autorizador"
- Fecha reanudación: `DatePicker` o `Input type="date"`
- Botones: "Cancelar" (secondary) + "Confirmar Pausa" (primary/warning)

---

## 5. Mejoras de Accesibilidad

| Elemento | Actual | Propuesto |
|----------|--------|-----------|
| Cards | `role="button"` + `tabIndex={0}` + `onKeyDown` | ✅ Ya existe — mantener |
| Badges | Sin `aria-label` | Añadir `aria-label` con texto completo del estado |
| Progress bars | Sin `aria-valuenow` | Añadir `role="progressbar"` + `aria-valuenow` + `aria-valuemin` + `aria-valuemax` |
| Botones de acción | `aria-label` presente | ✅ Mantener + tooltip visual |
| Modal | `role="dialog"` + `aria-modal` | ✅ Ya existe — verificar focus trap |
| Vista lista | `role="row"` + `role="grid"` | Añadir `role="grid"` al contenedor |

---

## 6. Mejoras de Rendimiento

### 6.1 Memoización
- `ProyectoCard` → `React.memo` con comparación shallow de props
- `ProyectoListItem` → `React.memo`
- `ProyectoProgress` → `React.memo`
- `ProyectoStateBadge` → `React.memo`

### 6.2 Virtualización (futuro)
- Cuando `proyectos.length > 50`, usar `react-window` o `@tanstack/react-virtual`
- Implementar en `ProyectoList` con `VirtualizedGrid` y `VirtualizedList`

### 6.3 Lazy Loading de Componentes Pesados
- `HeatMap` → `lazy(() => import('../components/HeatMap'))`
- `MapPicker` → `lazy(() => import('../components/MapPicker'))`
- Cargar solo cuando el usuario abre el formulario o expande la sección

---

## 7. Mejoras de Responsive Design

| Breakpoint | Grid Columns | Card Padding | KPI Columns | Actions |
|------------|-------------|--------------|-------------|---------|
| `xs` (< 640px) | 1 col | `p-3` | 2 cols | Stack vertical |
| `sm` (640px+) | 2 cols | `p-3.5` | 2 cols | Horizontal wrap |
| `md` (768px+) | 2 cols | `p-4` | 4 cols | Horizontal |
| `lg` (1024px+) | 3 cols | `p-4` | 4 cols | Horizontal |
| `xl` (1280px+) | 3 cols | `p-4` | 4 cols | Horizontal |

**Cambios específicos:**
- En móvil, los action buttons se vuelven un dropdown "Más acciones" para no saturar
- KPI cards en móvil: 2x2 grid en vez de 1 columna
- HeatMap: `h-48` en móvil, `h-64` en desktop

---

## 8. Integración con Sistema de Diseño Global

### 8.1 Variables CSS a Utilizar

```css
/* theme-variables.css — ya existentes, verificar uso */
--density-padding: var(--density-card-padding, 1rem);
--density-input-height: var(--density-input-height, 2.25rem);

/* Nuevas a agregar */
--proyectos-card-radius: 0.75rem;          /* rounded-2xl */
--proyectos-bar-height: 1.5px;             /* estado color bar */
--proyectos-badge-radius: 9999px;          /* rounded-full */
--proyectos-progress-height: 0.375rem;     /* h-1.5 */
```

### 8.2 Tema Oscuro

Verificar que todos los colores de estado tengan variante `dark:`:
- `bg-slate-100` → `dark:bg-slate-800`
- `bg-emerald-50` → `dark:bg-emerald-950/30`
- `bg-amber-50` → `dark:bg-amber-950/30`
- `bg-blue-50` → `dark:bg-blue-950/30`
- `text-slate-700` → `dark:text-slate-300`
- `text-emerald-700` → `dark:text-emerald-400`
- etc.

### 8.3 Diseño Responsivo Unificado

Usar los mismos breakpoints que el resto de la aplicación:
- `sm:` = 640px
- `md:` = 768px
- `lg:` = 1024px
- `xl:` = 1280px

Patrón de padding consistente:
```typescript
const PROYECTO_PADDING = {
  card: 'p-3 sm:p-4',
  cardHeader: 'px-4 py-3 sm:px-5 sm:py-4',
  cardBody: 'px-4 py-3 sm:px-5',
  cardFooter: 'px-4 py-2.5 sm:px-5',
};
```

---

## 9. Limpieza de Código

### 9.1 Archivos a Eliminar

| Archivo | Razón |
|---------|-------|
| `src/erp/store/proyectoStateMachine.ts` | Dead code — nunca importado, lógica duplicada en zustandStore |

### 9.2 Constantes a Extraer

| Actual | Nuevo archivo |
|--------|---------------|
| `estadoColor` en Proyectos.tsx:21-27 | `src/erp/utils/proyectoColors.ts` |
| `estadoColor` en HeatMap.tsx:16-22 | `src/erp/utils/proyectoColors.ts` (misma fuente) |
| Hardcoded Guatemala coords | `src/erp/utils/proyectoColors.ts` → `DEFAULT_COORDS` |

### 9.3 i18n a Limpiar

| Acción | Detalle |
|--------|---------|
| Eliminar duplicado `proyectos_eliminados` | Remover en línea 764 de `es.json` |
| Agrupar keys por sub-vista | `proyectos.lista.*`, `proyectos.form.*`, `proyectos.detalle.*`, `proyectos.pausa.*` |
| Estandarizar interpolación | Usar `{{variable}}` consistentemente |

---

## 10. Orden de Implementación Recomendado

### Fase 1 — Extracción de Componentes (Semana 1)
1. Crear `src/erp/components/proyectos/` directory
2. Extraer `ProyectoStateBadge.tsx` + `ProyectoProgress.tsx` (componentes pequeños sin estado)
3. Extraer `ProyectoActions.tsx` (botones contextuales)
4. Extraer `ProyectoCard.tsx` y `ProyectoListItem.tsx`
5. Extraer `ProyectoList.tsx` (grid/list renderer + empty state)
6. Extraer `ProyectosKPI.tsx`
7. Extraer `ProyectosToolbar.tsx`

### Fase 2 — Formulario y Modales (Semana 2)
8. Extraer `ProyectoForm.tsx` (secciones colapsables)
9. Extraer `ProyectoPauseModal.tsx`
10. Refactorizar `Proyectos.tsx` a ~200 líneas orchestrador

### Fase 3 — Unificación Visual (Semana 3)
11. Agregar variables CSS en `theme-variables.css`
12. Actualizar `ui.ts` con constantes `PROYECTO_*`
13. Aplicar `PROYECTO_STATE_COLORS` en todos los componentes
14. Eliminar estilos inline, usar theme classes
15. Asegurar dark mode variants en todos los colores

### Fase 4 — Limpieza y Optimización (Semana 4)
16. Eliminar `proyectoStateMachine.ts` o integrarlo
17. Limpiar i18n duplicados
18. Añadir `React.memo` a componentes puros
19. Implementar virtualización (si >50 proyectos)
20. Lazy loading de HeatMap y MapPicker

---

## 11. Criterios de Aceptación

| Criterio | Métrica |
|----------|---------|
| Tamaño de `Proyectos.tsx` | ≤ 250 líneas |
| Componentes extraídos | ≥ 9 archivos en `proyectos/` |
| Constantes duplicadas eliminadas | 0 instancias de `estadoColor` duplicada |
| Cobertura de dark mode | 100% de colores con variante `dark:` |
| Uso de `ui.ts` constants | ≥ 90% de estilos usan constantes compartidas |
| i18n keys limpias | 0 duplicados, 0 keys hardcodeadas |
| Accesibilidad | 100% de elementos interactivos con `aria-label` |
| Tests existentes | Pasan sin modificación |
| Responsive breakpoints | Consistente con diseño global |

---

## 12. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Break de funcionalidad existente | Tests E2E en `e2e-proyecto.test.ts` corren después de cada fase |
| Regresión en formulario | Validar schema Zod contra todos los campos del form |
| Performance drop por re-renders | `React.memo` + profiling con React DevTools |
| Inconsistencia de datos al extraer | Props tipadas estrictamente, no `any` |
| Dead code residual | Linter rule `no-unused-vars` + revisión manual |

---

## 13. Archivos Modificados/Creados

### Nuevos Archivos
```
src/erp/components/proyectos/
├── ProyectoCard.tsx
├── ProyectoListItem.tsx
├── ProyectoList.tsx
├── ProyectoForm.tsx
├── ProyectoPauseModal.tsx
├── ProyectoStateBadge.tsx
├── ProyectoProgress.tsx
├── ProyectoActions.tsx
├── ProyectosKPI.tsx
└── ProyectosToolbar.tsx

src/erp/utils/
└── proyectoColors.ts
```

### Archivos Modificados
```
src/erp/screens/Proyectos.tsx          # Refactor a orchestrator
src/erp/ui.ts                          # Agregar PROYECTO_* constants
src/erp/types.ts                       # Eliminar latitud/longitud legacy
src/lib/i18n/es.json                   # Limpiar duplicados, reorganizar
src/lib/i18n/en.json                   # Mirror changes
src/styles/theme-variables.css         # Agregar proyecto variables
```

### Archivos Eliminados
```
src/erp/store/proyectoStateMachine.ts  # Dead code
```

---

## 14. Integración de Módulos Standalone en Proyectos

### 14.1 Módulos identificados para integración

| Módulo | Archivo | Dependencia actual | Integración propuesta |
|--------|---------|-------------------|----------------------|
| Hitos | `screens/Hitos.tsx` | `proyectoFilter` local | Usar `currentProjectId` del store; mostrar hitos como subsección en detalle de proyecto |
| Riesgos | `screens/Riesgos.tsx` | `proyectoFilter` local | Idem; mostrar matriz de riesgos en vista proyecto |
| Seguimiento EVM | `screens/Seguimiento.tsx` | `proyectoFilter` local | Idem; curvas S como pestaña en dashboard de proyecto |
| Presupuestos | `screens/Presupuestos.tsx` | `proyectoFilter` local | Idem; resumen presupuestal en cabecera de proyecto |
| Bodega (filtrado) | `screens/Bodega.tsx` | `proyectoFilter` local | Idem; stock por proyecto en subpanel |
| OrdenesCambio | `screens/OrdenesCambio.tsx` | `proyectoFilter` local | Idem; OC como pestaña en detalle |
| MuroObra | `screens/MuroObra.tsx` | `proyectoFilter` local | Idem; timeline de obra en vista proyecto |
| Documentos | `screens/GestionDocumental.tsx` | `proyectoFilter` local | Idem; repositorio documental anidado |
| SSOCalidad | `screens/SSOCalidad.tsx` | `proyectoFilter` local | Idem; checklist y NC por proyecto |
| PlanillaDestajos | `screens/PlanillaDestajos.tsx` | `proyectoFilter` local | Idem; rendimiento diario en subsección |
| RendimientoCampo | `screens/RendimientoCampo.tsx` | `proyectoFilter` local | Idem; capturas de rendimiento anidadas |

### 14.2 Estrategia de integración

1. **Fase A — Contexto único**: Reemplazar todos los `proyectoFilter` locales por `currentProjectId` del store.
2. **Fase B — Subsecciones anidadas**: Cada módulo standalone se convierte en subcomponente renderizado condicionalmente dentro de `ProyectoDetail`.
3. **Fase C — Pestañas unificadas**: Agrupar subsecciones en tabs dentro de la vista de detalle: General, Presupuesto, Hitos, Riesgos, Seguimiento, Bodega, OC, Muro, Documentos, Calidad, Rendimiento.
4. **Fase D — KPIs consolidados**: Calcular avance físico/financiero, margen y desviación a partir de datos de todos los submódulos integrados.

### 14.3 Beneficios
- Navegación sin cambiar de contexto: el usuario ve todo el proyecto en una sola pantalla.
- 11 pantallas dejan de mantener su propio `proyectoFilter`.
- Todos los submódulos leen el mismo `currentProjectId` (consistencia garantizada).
- Sincronización atómica por proyecto al estar todos bajo el mismo store.

---

*Documento generado el 2026-07-08 — Plan de factorización del Módulo Proyectos CONSTRUSMART ERP*
