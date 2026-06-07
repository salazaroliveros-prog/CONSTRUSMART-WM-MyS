import { useState, useMemo } from 'react';
import type { PaletteName, Series, BarDatum, DonutDatum } from '../components/Charts';
import { PALETTES } from '../components/Charts';

export interface ChartConfig {
  type: 'line' | 'area';
  palette: PaletteName;
  hiddenSeries: Set<string>;
}

export function useChartConfig(defaultType: 'line' | 'area' = 'line', defaultPalette: PaletteName = 'default') {
  const [type, setType] = useState<'line' | 'area'>(defaultType);
  const [palette, setPalette] = useState<PaletteName>(defaultPalette);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

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
    setPalette(defaultPalette);
    setHiddenSeries(new Set());
  };

  return { type, setType, palette, setPalette, hiddenSeries, toggleSeries, isVisible, reset };
}
