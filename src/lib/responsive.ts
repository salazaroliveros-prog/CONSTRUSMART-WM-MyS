/**
 * 📱 Utilidades responsivas normalizadas para CONSTRUSMART ERP
 * Basado en: TECHNICAL_IMPLEMENTATION_GUIDE.md - Breakpoints responsive
 */

export const responsive = {
  /** Card width: full en mobile, auto en desktop */
  cardWidth: 'w-full sm:w-auto',
  /** Card max-width responsive */
  cardMaxWidth: 'max-w-sm sm:max-w-md md:max-w-lg',

  /** Grid 2 columnas: 1 col mobile, 2 col desktop */
  grid2Col: 'grid-cols-1 sm:grid-cols-2',
  /** Grid 3 columnas: 1 col mobile, 2 col tablet, 3 col desktop */
  grid3Col: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  /** Grid 4 columnas: 1 col mobile, 2 col tablet, 3/4 col desktop */
  grid4Col: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',

  /** Heading responsive: mobile sm → desktop lg/xl */
  heading: 'text-xl sm:text-2xl md:text-3xl',
  /** Subheading responsive */
  subheading: 'text-lg sm:text-xl md:text-2xl',

  /** Page padding: mobile-first */
  pagePadding: 'px-4 py-4 sm:px-6 md:px-8 lg:px-12',
  /** Section padding responsive */
  sectionPadding: 'p-4 sm:p-6 md:p-8',

  /** Button padding responsive */
  buttonPadding: 'px-3 py-1.5 sm:px-4 sm:py-2',
  /** Card padding responsive */
  cardPadding: 'p-4 sm:p-5 md:p-6',
  /** Card header padding responsive */
  cardHeaderPadding: 'p-4 sm:p-5 md:p-6 pb-3',
  /** Card content padding responsive */
  cardContentPadding: 'p-4 sm:p-5 md:p-6 pt-0',

  /** Hide on mobile, show on desktop */
  hideMobile: 'hidden sm:block',
  /** Show on mobile, hide on desktop */
  showMobile: 'block sm:hidden',
} as const;

export type ResponsiveKey = keyof typeof responsive;