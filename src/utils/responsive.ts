/**
 * Responsive Design Utilities
 * Helper functions para facilitar desarrollo responsivo
 */

export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export const breakpoints: Record<BreakpointSize, number> = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
}

/**
 * Obtener nombre del breakpoint actual
 */
export const getCurrentBreakpoint = (): BreakpointSize => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024

  if (width < breakpoints.sm) return 'xs'
  if (width < breakpoints.md) return 'sm'
  if (width < breakpoints.lg) return 'md'
  if (width < breakpoints.xl) return 'lg'
  if (width < breakpoints.xxl) return 'xl'
  return 'xxl'
}

/**
 * Verificar si el viewport es menor que un breakpoint
 */
export const isLessThan = (breakpoint: BreakpointSize): boolean => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024
  return width < breakpoints[breakpoint]
}

/**
 * Verificar si el viewport es mayor que un breakpoint
 */
export const isGreaterThan = (breakpoint: BreakpointSize): boolean => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024
  return width >= breakpoints[breakpoint]
}

/**
 * Valores responsivos para propiedades CSS
 */
export const responsiveValue = <T,>(config: {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  xxl?: T
}): T => {
  const breakpoint = getCurrentBreakpoint()
  return config[breakpoint] || config.xs || (Object.values(config)[0] as T)
}

/**
 * Media query helper
 */
export const media = {
  xs: `@media (max-width: ${breakpoints.sm - 1}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  md: `@media (min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px) and (max-width: ${breakpoints.xxl - 1}px)`,
  xxl: `@media (min-width: ${breakpoints.xxl}px)`,
  mobile: `@media (max-width: ${breakpoints.md - 1}px)`,
  tablet: `@media (min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `@media (min-width: ${breakpoints.lg}px)`,
  touch: '@media (hover: none) and (pointer: coarse)',
  noTouch: '@media (hover: hover) and (pointer: fine)',
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)',
  reduceMotion: '@media (prefers-reduced-motion: reduce)',
}

/**
 * Generar columnas Ant Design responsivas
 */
export const getResponsiveColSpan = (config: {
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
  xxl?: number
}) => ({
  xs: config.xs || 24,
  sm: config.sm || 24,
  md: config.md || 12,
  lg: config.lg || 8,
  xl: config.xl || 6,
  xxl: config.xxl || 4,
})

/**
 * Presets comunes de col spans
 */
export const colSpanPresets = {
  full: { xs: 24, sm: 24, md: 24, lg: 24, xl: 24, xxl: 24 },
  half: { xs: 24, sm: 24, md: 12, lg: 12, xl: 12, xxl: 12 },
  third: { xs: 24, sm: 24, md: 12, lg: 8, xl: 8, xxl: 8 },
  quarter: { xs: 24, sm: 12, md: 12, lg: 6, xl: 6, xxl: 6 },
  adaptive: { xs: 24, sm: 12, md: 8, lg: 6, xl: 4, xxl: 4 },
  sidebar: { xs: 24, sm: 24, md: 6, lg: 5, xl: 5, xxl: 5 },
  content: { xs: 24, sm: 24, md: 18, lg: 19, xl: 19, xxl: 19 },
}

/**
 * Calcular gutter responsivo
 */
export const getResponsiveGutter = (baseGutter: number = 16): number | [number, number] => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024

  if (width < breakpoints.md) {
    return [Math.round(baseGutter * 0.5), Math.round(baseGutter * 0.5)]
  }
  if (width < breakpoints.lg) {
    return [Math.round(baseGutter * 0.75), Math.round(baseGutter * 0.75)]
  }
  return [baseGutter, baseGutter]
}

/**
 * Padding responsivo
 */
export const getResponsivePadding = (basePadding: number = 16): string => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024

  if (width < breakpoints.sm) {
    return `${Math.round(basePadding * 0.5)}px`
  }
  if (width < breakpoints.md) {
    return `${Math.round(basePadding * 0.75)}px`
  }
  return `${basePadding}px`
}

/**
 * Font size responsivo
 */
export const getResponsiveFontSize = (baseFontSize: number = 14): number => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024

  if (width < breakpoints.sm) {
    return Math.round(baseFontSize * 0.9)
  }
  if (width < breakpoints.md) {
    return Math.round(baseFontSize * 0.95)
  }
  return baseFontSize
}

/**
 * Modal width responsivo
 */
export const getResponsiveModalWidth = (desktopWidth: number = 600): number | string => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024

  if (width < breakpoints.sm) {
    return '95vw'
  }
  if (width < breakpoints.md) {
    return '90vw'
  }
  if (width < breakpoints.lg) {
    return '80vw'
  }
  return desktopWidth
}

/**
 * Drawer width responsivo
 */
export const getResponsiveDrawerWidth = (desktopWidth: number = 378): number | string => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024

  if (width < breakpoints.md) {
    return '100%'
  }
  if (width < breakpoints.lg) {
    return '50%'
  }
  return desktopWidth
}

/**
 * Clase CSS responsiva basada en breakpoint
 */
export const getResponsiveClass = (config: {
  xs?: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
  xxl?: string
}): string => {
  const breakpoint = getCurrentBreakpoint()
  return config[breakpoint] || config.xs || ''
}

/**
 * Combinar clases responsivas
 */
export const combineResponsiveClasses = (
  ...classes: (string | { [key in BreakpointSize]?: string } | null | undefined)[]
): string => {
  const breakpoint = getCurrentBreakpoint()
  return classes
    .filter(Boolean)
    .map(cls => {
      if (typeof cls === 'string') return cls
      if (cls && breakpoint in cls) return cls[breakpoint]
      return ''
    })
    .filter(Boolean)
    .join(' ')
}

/**
 * Escuchar cambios de breakpoint
 */
export const onBreakpointChange = (callback: (breakpoint: BreakpointSize) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}

  let currentBreakpoint = getCurrentBreakpoint()

  const handleResize = () => {
    const newBreakpoint = getCurrentBreakpoint()
    if (newBreakpoint !== currentBreakpoint) {
      currentBreakpoint = newBreakpoint
      callback(newBreakpoint)
    }
  }

  const debounceResize = (() => {
    let timeout: NodeJS.Timeout
    return () => {
      clearTimeout(timeout)
      timeout = setTimeout(handleResize, 150)
    }
  })()

  window.addEventListener('resize', debounceResize)
  return () => window.removeEventListener('resize', debounceResize)
}
