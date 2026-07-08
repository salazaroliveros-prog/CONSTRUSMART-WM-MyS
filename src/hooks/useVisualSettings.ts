import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useErp } from '@/erp/store';
import { syncAllVisualSettings } from '@/lib/visual-settings';
import type { VisualSettings } from '@/lib/visual-settings';

/**
 * useVisualSettings
 * Escucha cambios en appSettings y aplica clases/variables CSS al body.
 * Compatible con modo offline-first: aplica desde localStorage si no hay store.
 */
export function useVisualSettings() {
  const { appSettings } = useErp();
  const lastHashRef = useRef<string>('');

  const settingsSnapshot: VisualSettings = useMemo(() => ({
    compactMode: appSettings.compactMode,
    densityTable: appSettings.densityTable,
    sidebarPosition: appSettings.sidebarPosition,
    touchMode: appSettings.touchMode,
    fontSize: appSettings.fontSize,
    fontFamily: appSettings.fontFamily,
    borderRadius: appSettings.borderRadius,
    spacingScale: appSettings.spacingScale,
    animationsEnabled: appSettings.animationsEnabled,
    animationType: appSettings.animationType,
    breadcrumbsEnabled: appSettings.breadcrumbsEnabled,
    footerEnabled: appSettings.footerEnabled,
  }), [
    appSettings.compactMode,
    appSettings.densityTable,
    appSettings.sidebarPosition,
    appSettings.touchMode,
    appSettings.fontSize,
    appSettings.fontFamily,
    appSettings.borderRadius,
    appSettings.spacingScale,
    appSettings.animationsEnabled,
    appSettings.animationType,
    appSettings.breadcrumbsEnabled,
    appSettings.footerEnabled,
  ]);

  const hash = useMemo(() => JSON.stringify(settingsSnapshot), [settingsSnapshot]);

  useEffect(() => {
    if (hash === lastHashRef.current) return;
    lastHashRef.current = hash;
    syncAllVisualSettings(settingsSnapshot);
  }, [hash, settingsSnapshot]);

  const resetVisualSettings = useCallback(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.className = body.className
      .split(' ')
      .filter(c => !c.startsWith('vs-'))
      .join(' ');
    body.style.removeProperty('--density-padding');
    body.style.removeProperty('--vs-font-size-base');
    body.style.removeProperty('--radius-selected');
    body.style.removeProperty('--vs-touch-min-size');
    body.style.removeProperty('--motion-duration-normal');
    body.style.removeProperty('--motion-duration-fast');
    if (appSettings) syncAllVisualSettings(appSettings as any);
  }, [appSettings]);

  return { resetVisualSettings };
}