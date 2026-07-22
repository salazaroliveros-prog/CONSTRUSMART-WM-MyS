import { useState, useEffect } from 'react';
import type { PaletteName } from '../components/Charts';
import { PALETTES } from '../components/Charts';

export interface ChartConfig {
  type: 'line' | 'area';
  palette: PaletteName;
  hiddenSeries: Set<string>;
}

function getThemePalette(): PaletteName {
  const theme = document.documentElement.getAttribute('data-theme') || 'glassmorphism';
  if (theme === 'nova-os') return 'nova';
  if (theme === 'dark-pro') return 'vivid';
  if (theme === 'neomorphism') return 'mono';
  return 'default';
}

export function useChartConfig(defaultType: 'line' | 'area' = 'line', defaultPalette?: PaletteName) {
  const [type, setType] = useState<'line' | 'area'>(defaultType);
  const [palette, setPalette] = useState<PaletteName>(() => defaultPalette ?? getThemePalette());
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (defaultPalette) return;
    const update = () => setPalette(getThemePalette());
    window.addEventListener('wm-theme-changed', update);
    return () => window.removeEventListener('wm-theme-changed', update);
  }, [defaultPalette]);

  const toggleSeries = (id: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isVisible = (id: string) => !hiddenSeries.has(id);

  const reset = () => {
    setType(defaultType);
    setPalette(defaultPalette ?? getThemePalette());
    setHiddenSeries(new Set());
  };

  return { type, setType, palette, setPalette, hiddenSeries, toggleSeries, isVisible, reset };
}
