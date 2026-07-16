/**
 * CONSTRUSMART ERP — Componentes UI Unificados
 * 
 * Sistema de clases CSS compartidas que responden a las variables del tema.
 * Usa el sistema de elevación y motion de design-tokens.css para consistencia visual.
 * La densidad se ajusta automáticamente según la clase `.compact` en el DOM.
 * 
 * @module erp/ui
 */

// === CARDS ===
/**
 * CARD - Estilo base para tarjetas y contenedores
 */
export const CARD = 'bg-card rounded-[var(--radius-selected,var(--radius-base,8px))] p-[var(--density-padding)] card-elevation border border-border/40';

/**
 * CARD_TITLE - Título para tarjetas
 */
export const CARD_TITLE = 'font-bold text-card-foreground text-base mb-3';

/**
 * KPI_CARD - Estilo especial para tarjetas de métricas KPI
 */
export const KPI_CARD = 'card-kpi rounded-[var(--radius-selected,var(--radius-base,8px))] p-[var(--density-padding)] border border-border/40';

// === BADGES ===
/**
 * BADGE_SM - Badge pequeño para etiquetas
 */
export const BADGE_SM = 'text-[10px] px-2 py-0.5 rounded-full font-medium';

/**
 * BADGE_ESTADO_PENDIENTE - Badge para estado pendiente
 */
export const BADGE_ESTADO_PENDIENTE = 'bg-warning/10 text-warning';

/**
 * BADGE_ESTADO_APROBADO - Badge para estado aprobado
 */
export const BADGE_ESTADO_APROBADO = 'bg-success/10 text-success';

/**
 * BADGE_ESTADO_RECHAZADO - Badge para estado rechazado
 */
export const BADGE_ESTADO_RECHAZADO = 'bg-destructive/10 text-destructive';

// === INPUTS ===
/**
 * INPUT - Estilo base para inputs de formulario
 */
export const INPUT = `w-full px-3.5 py-[calc(var(--density-input-height,32px)*0.25)]
  rounded-[var(--radius-selected,var(--radius-md,6px))] text-sm outline-none border border-border 
  bg-background placeholder:text-muted-foreground placeholder:opacity-70 
  focus-visible:ring-2 focus-visible:ring-ring transition-all`;

/**
 * INPUT_COMPACT - Input compacto para espacios reducidos
 */
export const INPUT_COMPACT = `w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-selected,var(--radius-sm,4px))] 
  outline-none border border-border bg-background placeholder:text-muted-foreground 
  placeholder:opacity-70 focus-visible:ring-2 focus-visible:ring-ring transition-all`;

/**
 * ERROR_STATE - Estilo para inputs con error
 */
export const ERROR_STATE = 'ring-2 ring-destructive/20 border-destructive/50';

/**
 * SELECT - Estilo para selects/dropdowns
 */
export const SELECT = `${INPUT} appearance-none bg-no-repeat bg-[length:16px] bg-[right_8px_center]`;

/**
 * TEXTAREA - Estilo para textareas
 */
export const TEXTAREA = `${INPUT} min-h-[80px] resize-y`;

// === BUTTONS ===
/**
 * BUTTON_PRIMARY - Botón primario (acción principal)
 */
export const BUTTON_PRIMARY = `bg-primary hover:bg-primary/90 text-primary-foreground 
  px-4 py-[calc(var(--density-input-height,32px)*0.25)] h-[var(--density-input-height,32px)] 
  rounded-[var(--radius-selected,var(--radius-md,6px))] text-sm font-semibold flex items-center gap-2 
  transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`;

/**
 * BUTTON_DARK - Alias de BUTTON_PRIMARY
 */
export const BUTTON_DARK = BUTTON_PRIMARY;

/**
 * BUTTON_ACCENT - Botón de acento (acción secundaria destacada)
 */
export const BUTTON_ACCENT = `bg-accent hover:bg-accent/90 text-accent-foreground 
  px-4 py-[calc(var(--density-input-height,32px)*0.25)] h-[var(--density-input-height,32px)] 
  rounded-[var(--radius-selected,var(--radius-md,6px))] text-sm font-semibold flex items-center gap-2 
  transition-all active:scale-95`;

/**
 * BUTTON_SECONDARY - Botón secundario (acción alternativa)
 */
export const BUTTON_SECONDARY = `bg-secondary hover:bg-secondary/80 text-secondary-foreground 
  px-4 py-[calc(var(--density-input-height,32px)*0.25)] h-[var(--density-input-height,32px)] 
  rounded-[var(--radius-selected,var(--radius-md,6px))] text-sm font-medium flex items-center gap-2 
  transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`;

/**
 * BUTTON_ICON - Botón solo con icono
 */
export const BUTTON_ICON = 'text-muted-foreground hover:text-foreground p-1.5 rounded-md transition-colors hover:bg-muted';

/**
 * BUTTON_DANGER - Botón de acción destructiva
 */
export const BUTTON_DANGER = 'text-destructive hover:text-destructive-foreground p-1.5 rounded-md transition-colors hover:bg-destructive/10';

// === MODALS ===
/**
 * MODAL_OVERLAY - Overlay de fondo para modales
 */
export const MODAL_OVERLAY = 'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4';

/**
 * MODAL_PANEL - Panel/contenedor principal del modal
 */
export const MODAL_PANEL = 'bg-card rounded-[var(--radius-selected,var(--radius-lg,12px))] shadow-xl border border-border w-full max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto';

/**
 * MODAL_HEADER - Header del modal
 */
export const MODAL_HEADER = 'flex items-center justify-between p-[var(--density-padding)] border-b border-border';

/**
 * MODAL_TITLE - Título del modal
 */
export const MODAL_TITLE = 'text-base sm:text-lg font-semibold text-foreground';

/**
 * MODAL_CLOSE - Botón de cerrar modal
 */
export const MODAL_CLOSE = 'text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors hover:bg-muted';

// === TABLES ===
/**
 * TABLE - Estilo base para tablas
 */
export const TABLE = 'w-full border-collapse';

/**
 * TABLE_HEAD - Estilo para headers de tabla
 */
export const TABLE_HEAD = `text-xs font-semibold text-muted-foreground uppercase tracking-wider 
  bg-muted/50 border-b border-border p-[var(--density-selected,var(--density-table-cell,8px))] text-left`;

/**
 * TABLE_CELL - Estilo para celdas de tabla
 */
export const TABLE_CELL = `p-[var(--density-selected,var(--density-table-cell,8px))] text-sm border-b border-border/50 align-middle`;

/**
 * TABLE_ROW - Estilo para filas de tabla
 */
export const TABLE_ROW = 'hover:bg-muted/30 transition-colors';

// === TYPOGRAPHY ===
/**
 * SECTION_TITLE - Título de sección
 */
export const SECTION_TITLE = 'text-lg sm:text-xl font-black text-foreground mb-3 flex items-center gap-2';

/**
 * SECTION_SUBTITLE - Subtítulo de sección
 */
export const SECTION_SUBTITLE = 'text-sm text-muted-foreground mb-4';

// === COLORS ===
/**
 * COLOR_SUCCESS - Color para estados de éxito
 */
export const COLOR_SUCCESS = 'text-emerald-600 dark:text-emerald-400';

/**
 * COLOR_WARNING - Color para advertencias
 */
export const COLOR_WARNING = 'text-amber-600 dark:text-amber-400';

/**
 * COLOR_DANGER - Color para estados de error/peligro
 */
export const COLOR_DANGER = 'text-red-600 dark:text-red-400';

/**
 * COLOR_INFO - Color para información
 */
export const COLOR_INFO = 'text-blue-600 dark:text-blue-400';

/**
 * COLOR_PRIMARY - Color primario del tema
 */
export const COLOR_PRIMARY = 'text-primary';

// === GRID / LAYOUT ===
/**
 * GRID_2 - Grid de 2 columnas responsive
 */
export const GRID_2 = 'grid grid-cols-1 sm:grid-cols-2 gap-[var(--density-selected,var(--density-gap,16px))]';

/**
 * GRID_3 - Grid de 3 columnas responsive
 */
export const GRID_3 = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--density-selected,var(--density-gap,16px))]';

/**
 * GRID_4 - Grid de 4 columnas responsive
 */
export const GRID_4 = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--density-selected,var(--density-gap,16px))]';

/**
 * FLEX_ROW - Flexbox row con gap
 */
export const FLEX_ROW = 'flex items-center gap-[var(--density-selected,var(--density-gap,16px))] flex-wrap';

/**
 * FLEX_COL - Flexbox column con gap
 */
export const FLEX_COL = 'flex flex-col gap-[var(--density-selected,var(--density-gap,16px))]';

// === FORMS ===
/**
 * FORM_LABEL - Label para campos de formulario
 */
export const FORM_LABEL = 'block text-sm font-medium text-foreground mb-1';

/**
 * FORM_HELP - Texto de ayuda para campos
 */
export const FORM_HELP = 'text-xs text-muted-foreground mt-1';

/**
 * FORM_ERROR - Mensaje de error de validación
 */
export const FORM_ERROR = 'text-xs text-destructive mt-1';

/**
 * FORM_GROUP - Grupo de campos de formulario
 */
export const FORM_GROUP = 'flex flex-col gap-[var(--spacing-selected,var(--spacing-xs,4px))]';

// === DIVIDERS ===
/**
 * DIVIDER - Divisor horizontal
 */
export const DIVIDER = 'border-t border-border/50 my-[var(--density-selected,var(--density-gap,16px))]';

/**
 * DIVIDER_LABEL - Divisor con etiqueta
 */
export const DIVIDER_LABEL = 'flex items-center gap-2 text-xs font-medium text-muted-foreground';

// === AVATAR ===
/**
 * AVATAR - Avatar estándar
 */
export const AVATAR = 'w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary';

/**
 * AVATAR_SM - Avatar pequeño
 */
export const AVATAR_SM = 'w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary';

/**
 * AVATAR_LG - Avatar grande
 */
export const AVATAR_LG = 'w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-sm font-bold text-primary';

// === STATUS ===
/**
 * STATUS_DOT - Punto indicador de estado
 */
export const STATUS_DOT = 'w-2 h-2 rounded-full inline-block';

/**
 * STATUS_ONLINE - Estado en línea (verde)
 */
export const STATUS_ONLINE = 'bg-emerald-500';

/**
 * STATUS_OFFLINE - Estado desconectado (gris)
 */
export const STATUS_OFFLINE = 'bg-muted-foreground';

/**
 * STATUS_AWAY - Estado ausente (ámbar)
 */
export const STATUS_AWAY = 'bg-amber-500';

// === COMPONENTES ESPECÍFICOS ===
/**
 * BUTTON_ACCION_EMERALD - Botón de acción verde
 */
export const BUTTON_ACCION_EMERALD = 'flex-1 justify-center bg-emerald-500 hover:bg-emerald-600 text-white';

/**
 * BUTTON_ACCION_AMBER - Botón de acción ámbar
 */
export const BUTTON_ACCION_AMBER = 'flex-1 justify-center bg-amber-500 hover:bg-amber-600 text-white';

/**
 * BUTTON_ACCION_BLUE - Botón de acción azul
 */
export const BUTTON_ACCION_BLUE = 'flex-1 justify-center bg-blue-500 hover:bg-blue-600 text-white';

/**
 * BADGE_PROYECTO_ESTADO - Badge para estado de proyecto
 */
export const BADGE_PROYECTO_ESTADO = 'text-[10px] px-3 py-1.5 rounded-full font-medium transition-colors min-h-[32px] flex items-center';

/**
 * CARD_PROYECTO - Tarjeta de proyecto con hover effects
 */
export const CARD_PROYECTO = 'group bg-card text-card-foreground rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border hover:-translate-y-1 animate-enter focus:outline-none focus:ring-2 focus:ring-ring';
