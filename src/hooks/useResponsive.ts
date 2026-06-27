import { useEffect, useState } from 'react'

export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

const breakpoints: Record<BreakpointKey, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
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
    isXS: width < 640,
    isSM: width >= 640 && width < 768,
    isMD: width >= 768 && width < 1024,
    isLG: width >= 1024 && width < 1280,
    isXL: width >= 1280 && width < 1536,
    isXXL: width >= 1536,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
  }
}
