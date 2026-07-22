import { useState, useEffect, useCallback, useMemo } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type Orientation = 'portrait' | 'landscape';
type DeviceType = 'mobile' | 'tablet' | 'desktop';

const BREAKPOINT_MAP: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

function getBreakpoint(width: number): Breakpoint {
  if (width >= 1536) return '2xl';
  if (width >= 1280) return 'xl';
  if (width >= 1024) return 'lg';
  if (width >= 768) return 'md';
  if (width >= 640) return 'sm';
  return 'xs';
}

function getDeviceType(width: number, isTouch: boolean): DeviceType {
  if (width < 768) return 'mobile';
  if (width < 1024 && isTouch) return 'tablet';
  return 'desktop';
}

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  orientation: Orientation;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  isRetina: boolean;
  safeAreaTop: number;
  safeAreaBottom: number;
  safeAreaLeft: number;
  safeAreaRight: number;
  supportsHover: boolean;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
  scrollbarWidth: number;
  virtualKeyboardVisible: boolean;
}

export function useResponsive(): ResponsiveInfo {
  const [info, setInfo] = useState<ResponsiveInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024, height: 768, breakpoint: 'lg', orientation: 'landscape',
        deviceType: 'desktop', isMobile: false, isTablet: false, isDesktop: true,
        isTouchDevice: false, isLandscape: true, isPortrait: false, isRetina: false,
        safeAreaTop: 0, safeAreaBottom: 0, safeAreaLeft: 0, safeAreaRight: 0,
        supportsHover: true, prefersReducedMotion: false, prefersDarkMode: false,
        scrollbarWidth: 0, virtualKeyboardVisible: false,
      };
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const bp = getBreakpoint(w);
    const dt = getDeviceType(w, isTouch);
    const isLandscape = w > h;
    const isRetina = window.devicePixelRatio > 1;

    const getSafeArea = (prop: string): number => {
      try {
        const val = getComputedStyle(document.documentElement).getPropertyValue(prop);
        return val ? parseInt(val.replace('px', ''), 10) : 0;
      } catch { return 0; }
    };

    return {
      width: w, height: h, breakpoint: bp, orientation: isLandscape ? 'landscape' : 'portrait',
      deviceType: dt, isMobile: dt === 'mobile', isTablet: dt === 'tablet', isDesktop: dt === 'desktop',
      isTouchDevice: isTouch, isLandscape, isPortrait: !isLandscape, isRetina,
      safeAreaTop: getSafeArea('--sat'), safeAreaBottom: getSafeArea('--sab'),
      safeAreaLeft: getSafeArea('--sal'), safeAreaRight: getSafeArea('--sar'),
      supportsHover: window.matchMedia('(hover: hover)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      scrollbarWidth: window.innerWidth - document.documentElement.clientWidth,
      virtualKeyboardVisible: false,
    };
  });

  useEffect(() => {
    let prevHeight = window.innerHeight;
    let rafId: number;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const bp = getBreakpoint(w);
      const dt = getDeviceType(w, isTouch);
      const isLandscape = w > h;
      const vkVisible = prevHeight - h > 120;
      prevHeight = h;

      setInfo(prev => ({
        ...prev,
        width: w, height: h, breakpoint: bp, orientation: isLandscape ? 'landscape' : 'portrait',
        deviceType: dt, isMobile: dt === 'mobile', isTablet: dt === 'tablet', isDesktop: dt === 'desktop',
        isTouchDevice: isTouch, isLandscape, isPortrait: !isLandscape,
        virtualKeyboardVisible: vkVisible,
      }));
    };

    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleResize);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', () => setTimeout(handleResize, 300));

    const mqlHover = window.matchMedia('(hover: hover)');
    const mqlMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqlDark = window.matchMedia('(prefers-color-scheme: dark)');

    const handleHoverChange = (e: MediaQueryListEvent) => setInfo(p => ({ ...p, supportsHover: e.matches }));
    const handleMotionChange = (e: MediaQueryListEvent) => setInfo(p => ({ ...p, prefersReducedMotion: e.matches }));
    const handleDarkChange = (e: MediaQueryListEvent) => setInfo(p => ({ ...p, prefersDarkMode: e.matches }));

    mqlHover.addEventListener('change', handleHoverChange);
    mqlMotion.addEventListener('change', handleMotionChange);
    mqlDark.addEventListener('change', handleDarkChange);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      mqlHover.removeEventListener('change', handleHoverChange);
      mqlMotion.removeEventListener('change', handleMotionChange);
      mqlDark.removeEventListener('change', handleDarkChange);
    };
  }, []);

  return info;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useOrientation(): Orientation {
  const resp = useResponsive();
  return resp.orientation;
}

export function useBreakpoint(): Breakpoint {
  const resp = useResponsive();
  return resp.breakpoint;
}

export function useIsMobile(): boolean {
  const resp = useResponsive();
  return resp.isMobile;
}