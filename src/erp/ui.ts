/**
 * CONSTRUSMART ERP — Componentes UI Unificados
 * 
 * Sistema de clases CSS compartidas que responden a las variables del tema.
 * La densidad se ajusta automáticamente según la clase `.compact` en el DOM.
 */

// === CARDS ===
export const CARD = 'bg-card rounded-[var(--radius-selected,var(--radius-base,8px))] p-[var(--density-padding)] shadow-sm border border-border/40 transition-shadow hover:shadow-md';
export const CARD_TITLE = 'font-bold text-card-foreground text-base mb-3';
export const KPI_CARD = 'bg-gradient-to-br from-card to-card/80 rounded-[var(--radius-selected,var(--radius-base,8px))] p-[var(--density-padding)] shadow-sm border border-border/40';

// === BADGES ===
export const BADGE_SM = 'text-[10px] px-2 py-0.5 rounded-full font-medium';
export const BADGE_ESTADO_PENDIENTE = 'bg-warning/10 text-warning';
export const BADGE_ESTADO_APROBADO = 'bg-success/10 text-success';
export const BADGE_ESTADO_RECHAZADO = 'bg-destructive/10 text-destructive';

// === INPUTS ===
export const INPUT = `w-full px-3.5 py-[calc(var(--density-input-height,32px)*0.25)]
  rounded-[var(--radius-selected,var(--radius-md,6px))] text-sm outline-none border border-border 
  bg-background placeholder:text-muted-foreground placeholder:opacity-70 
  focus-visible:ring-2 focus-visible:ring-ring transition-all`;
export const INPUT_COMPACT = `w-full px-2.5 py-1.5 text-xs rounded-[var(--radius-selected,var(--radius-sm,4px))] 
  outline-none border border-border bg-background placeholder:text-muted-foreground 
  placeholder:opacity-70 focus-visible:ring-2 focus-visible:ring-ring transition-all`;
export const ERROR_STATE = 'ring-2 ring-destructive/20 border-destructive/50';
export const SELECT = `${INPUT} appearance-none bg-no-repeat bg-[length:16px] bg-[right_8px_center]`;
export const TEXTAREA = `${INPUT} min-h-[80px] resize-y`;

// === BUTTONS ===
export const BUTTON_PRIMARY = `bg-primary hover:bg-primary/90 text-primary-foreground 
  px-4 py-[calc(var(--density-input-height,32px)*0.25)] h-[var(--density-input-height,32px)] 
  rounded-[var(--radius-selected,var(--radius-md,6px))] text-sm font-semibold flex items-center gap-2 
  transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`;
export const BUTTON_DARK = BUTTON_PRIMARY;
export const BUTTON_ACCENT = `bg-accent hover:bg-accent/90 text-accent-foreground 
  px-4 py-[calc(var(--density-input-height,32px)*0.25)] h-[var(--density-input-height,32px)] 
  rounded-[var(--radius-selected,var(--radius-md,6px))] text-sm font-semibold flex items-center gap-2 
  transition-all active:scale-95`;
export const BUTTON_SECONDARY = `bg-secondary hover:bg-secondary/80 text-secondary-foreground 
  px-4 py-[calc(var(--density-input-height,32px)*0.25)] h-[var(--density-input-height,32px)] 
  rounded-[var(--radius-selected,var(--radius-md,6px))] text-sm font-medium flex items-center gap-2 
  transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`;
export const BUTTON_ICON = 'text-muted-foreground hover:text-foreground p-1.5 rounded-md transition-colors hover:bg-muted';
export const BUTTON_DANGER = 'text-destructive hover:text-destructive-foreground p-1.5 rounded-md transition-colors hover:bg-destructive/10';

// === MODALS ===
export const MODAL_OVERLAY = 'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4';
export const MODAL_PANEL = 'bg-card rounded-[var(--radius-selected,var(--radius-lg,12px))] shadow-xl border border-border w-full max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto';
export const MODAL_HEADER = 'flex items-center justify-between p-[var(--density-padding)] border-b border-border';
export const MODAL_TITLE = 'text-base sm:text-lg font-semibold text-foreground';
export const MODAL_CLOSE = 'text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors hover:bg-muted';

// === TABLES ===
export const TABLE = 'w-full border-collapse';
export const TABLE_HEAD = `text-xs font-semibold text-muted-foreground uppercase tracking-wider 
  bg-muted/50 border-b border-border p-[var(--density-selected,var(--density-table-cell,8px))] text-left`;
export const TABLE_CELL = `p-[var(--density-selected,var(--density-table-cell,8px))] text-sm border-b border-border/50 align-middle`;
export const TABLE_ROW = 'hover:bg-muted/30 transition-colors';

// === TYPOGRAPHY ===
export const SECTION_TITLE = 'text-lg sm:text-xl font-black text-foreground mb-3 flex items-center gap-2';
export const SECTION_SUBTITLE = 'text-sm text-muted-foreground mb-4';

// === COLORS ===
export const COLOR_SUCCESS = 'text-emerald-600 dark:text-emerald-400';
export const COLOR_WARNING = 'text-amber-600 dark:text-amber-400';
export const COLOR_DANGER = 'text-red-600 dark:text-red-400';
export const COLOR_INFO = 'text-blue-600 dark:text-blue-400';
export const COLOR_PRIMARY = 'text-primary';

// === GRID / LAYOUT ===
export const GRID_2 = 'grid grid-cols-1 sm:grid-cols-2 gap-[var(--density-selected,var(--density-gap,16px))]';
export const GRID_3 = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[var(--density-selected,var(--density-gap,16px))]';
export const GRID_4 = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--density-selected,var(--density-gap,16px))]';
export const FLEX_ROW = 'flex items-center gap-[var(--density-selected,var(--density-gap,16px))] flex-wrap';
export const FLEX_COL = 'flex flex-col gap-[var(--density-selected,var(--density-gap,16px))]';

// === FORMS ===
export const FORM_LABEL = 'block text-sm font-medium text-foreground mb-1';
export const FORM_HELP = 'text-xs text-muted-foreground mt-1';
export const FORM_ERROR = 'text-xs text-destructive mt-1';
export const FORM_GROUP = 'flex flex-col gap-[var(--spacing-selected,var(--spacing-xs,4px))]';

// === DIVIDERS ===
export const DIVIDER = 'border-t border-border/50 my-[var(--density-selected,var(--density-gap,16px))]';
export const DIVIDER_LABEL = 'flex items-center gap-2 text-xs font-medium text-muted-foreground';

// === AVATAR ===
export const AVATAR = 'w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary';
export const AVATAR_SM = 'w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary';
export const AVATAR_LG = 'w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-sm font-bold text-primary';

// === STATUS ===
export const STATUS_DOT = 'w-2 h-2 rounded-full inline-block';
export const STATUS_ONLINE = 'bg-emerald-500';
export const STATUS_OFFLINE = 'bg-muted-foreground';
export const STATUS_AWAY = 'bg-amber-500';
