import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';
import type { PaletteName } from './Charts';
import { PALETTES, PALETTE_NAMES } from './Charts';

interface SeriesInfo {
  id: string;
  label: string;
  color: string;
  visible: boolean;
}

interface ChartToolbarProps {
  types?: ('line' | 'area')[];
  currentType: 'line' | 'area';
  onTypeChange: (t: 'line' | 'area') => void;
  palette: PaletteName;
  onPaletteChange: (p: PaletteName) => void;
  series?: SeriesInfo[];
  onToggleSeries?: (id: string) => void;
  onReset?: () => void;
}

const ChartToolbar: React.FC<ChartToolbarProps> = ({
  types = ['line', 'area'],
  currentType,
  onTypeChange,
  palette,
  onPaletteChange,
  series,
  onToggleSeries,
  onReset,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Configurar gráfica"
        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs"
      >
        <Settings2 className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-56 bg-card border border-border rounded-xl shadow-xl p-3 space-y-3 text-xs">
            {types.length > 1 && (
              <div>
                <div className="font-semibold text-foreground mb-1.5">Tipo</div>
                <div className="flex gap-1">
                  {types.map(t => (
                    <button
                      key={t}
                      onClick={() => { onTypeChange(t); setOpen(false); }}
                      className={`px-2.5 py-1 rounded-lg capitalize transition-colors flex-1 text-center ${
                        currentType === t ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {t === 'line' ? 'Líneas' : 'Área'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="font-semibold text-foreground mb-1.5">Colores</div>
              <div className="flex flex-wrap gap-1.5">
                {PALETTE_NAMES.map(p => (
                  <button
                    key={p}
                    onClick={() => { onPaletteChange(p); setOpen(false); }}
                    title={p}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all ${
                      palette === p ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${PALETTES[p].slice(0, 3).join(', ')})` }}
                  >
                    {palette === p && <span className="w-1.5 h-1.5 rounded-full bg-white shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {series && series.length > 1 && (
              <div>
                <div className="font-semibold text-foreground mb-1.5">Datos</div>
                <div className="space-y-1">
                  {series.map(s => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded px-1 py-0.5">
                      <input
                        type="checkbox"
                        checked={s.visible}
                        onChange={() => onToggleSeries?.(s.id)}
                        className="rounded border-border accent-foreground"
                      />
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                      <span className="text-foreground">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {onReset && (
              <button
                onClick={() => { onReset(); setOpen(false); }}
                className="w-full text-center text-muted-foreground hover:text-foreground py-1 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                Restablecer
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChartToolbar;
