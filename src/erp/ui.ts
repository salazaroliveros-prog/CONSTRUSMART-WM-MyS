// Sistema de diseño unificado — tokens que respetan light/dark mode
// Usar estas constantes en todas las pantallas para consistencia visual

export const CARD = 'bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border transition-shadow hover:shadow-md';
export const CARD_FLAT = 'bg-card text-card-foreground rounded-2xl p-5 border border-border';
export const CARD_TITLE = 'font-bold text-foreground text-base mb-3';

export const BADGE_SM = 'text-[10px] px-2 py-0.5 rounded-full font-medium';
export const BADGE_PENDIENTE  = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
export const BADGE_APROBADO   = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
export const BADGE_RECHAZADO  = 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400';
export const BADGE_INFO       = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';

// Aliases para compatibilidad con código existente
export const BADGE_ESTADO_PENDIENTE  = BADGE_PENDIENTE;
export const BADGE_ESTADO_APROBADO   = BADGE_APROBADO;
export const BADGE_ESTADO_RECHAZADO  = BADGE_RECHAZADO;

export const INPUT = [
  'w-full px-3.5 py-2.5 rounded-xl text-sm outline-none',
  'border border-input bg-background text-foreground',
  'placeholder:text-muted-foreground',
  'focus:ring-2 focus:ring-ring focus:border-ring',
  'transition-colors duration-200',
].join(' ');

export const INPUT_COMPACT = [
  'w-full px-2.5 py-1.5 text-xs rounded-lg outline-none',
  'border border-input bg-background text-foreground',
  'placeholder:text-muted-foreground',
  'focus:ring-2 focus:ring-ring focus:border-ring',
  'transition-colors duration-200',
].join(' ');

export const ERROR_STATE = 'ring-2 ring-red-200 border-red-400 dark:ring-red-800 dark:border-red-600';

export const BUTTON_PRIMARY = [
  'bg-primary hover:bg-primary/90 text-primary-foreground',
  'px-4 py-2.5 rounded-xl text-sm font-semibold',
  'flex items-center gap-2 transition-all active:scale-95',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
].join(' ');

export const BUTTON_DARK = [
  'bg-foreground hover:bg-foreground/90 text-background',
  'px-4 py-2.5 rounded-xl text-sm font-semibold',
  'flex items-center gap-2 transition-all active:scale-95',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
].join(' ');

export const BUTTON_ACCENT = [
  'bg-pink-500 hover:bg-pink-600 text-white',
  'px-4 py-2.5 rounded-xl text-sm font-semibold',
  'flex items-center gap-2 transition-all active:scale-95',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-2',
].join(' ');

export const BUTTON_SECONDARY = [
  'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
  'px-4 py-2.5 rounded-xl text-sm font-medium',
  'flex items-center gap-2 transition-all active:scale-95',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
].join(' ');

export const BUTTON_GHOST = [
  'hover:bg-accent hover:text-accent-foreground',
  'px-3 py-2 rounded-xl text-sm font-medium',
  'flex items-center gap-2 transition-all active:scale-95',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
].join(' ');

export const BUTTON_ICON = [
  'p-2 rounded-lg text-muted-foreground',
  'hover:bg-accent hover:text-accent-foreground',
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
].join(' ');

export const BUTTON_DANGER = [
  'p-2 rounded-lg text-muted-foreground',
  'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400',
  'transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400',
].join(' ');

export const SECTION_TITLE = 'text-xl font-bold text-foreground mb-4 flex items-center gap-2';
export const PAGE_TITLE    = 'text-2xl font-black text-foreground';
export const PAGE_SUBTITLE = 'text-sm text-muted-foreground';

export const KPI_CARD = 'bg-card text-card-foreground rounded-2xl p-4 shadow-sm border border-border';

export const TABLE_WRAPPER = 'bg-card rounded-2xl shadow-sm border border-border overflow-hidden';
export const TABLE_HEADER  = 'border-b border-border';
export const TABLE_ROW     = 'border-b border-border/50 hover:bg-muted/40 transition-colors';
export const TABLE_TH      = 'text-left pb-2 text-xs font-semibold text-muted-foreground';
export const TABLE_TD      = 'py-2 text-sm text-foreground';

export const MODAL_OVERLAY  = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
export const MODAL_PANEL    = 'bg-card text-card-foreground rounded-2xl p-6 w-full shadow-xl border border-border';
export const MODAL_HEADER   = 'flex items-center justify-between mb-4';
export const MODAL_TITLE    = 'font-bold text-lg text-foreground';
export const MODAL_CLOSE    = [
  'p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
].join(' ');
