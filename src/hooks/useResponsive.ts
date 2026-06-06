import { useEffect, useState } from 'react'

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

const breakpoints: Record<BreakpointKey, number> = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
}

export const useResponsive = () => {
  const [screen, setScreen] = useState<Record<BreakpointKey, boolean>>({
    xs: false,
    sm: false,
    md: false,
    lg: false,
    xl: false,
    xxl: false,
  })

  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      setWidth(w)

      setScreen({
        xs: w >= breakpoints.xs,
        sm: w >= breakpoints.sm,
        md: w >= breakpoints.md,
        lg: w >= breakpoints.lg,
        xl: w >= breakpoints.xl,
        xxl: w >= breakpoints.xxl,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    ...screen,
    width,
    isXS: width < 576,
    isSM: width >= 576 && width < 768,
    isMD: width >= 768 && width < 992,
    isLG: width >= 992 && width < 1200,
    isXL: width >= 1200 && width < 1600,
    isXXL: width >= 1600,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 992,
    isDesktop: width >= 992,
  }
}
