import React, { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarClock, ChevronRight } from 'lucide-react';

interface GanttItem {
  id: string;
  nombre: string;
  proyecto: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  avance?: number;
}

interface GanttChartProps {
  items: GanttItem[];
  onVerDetalle?: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; bar: string; text: string }> = {
  completado: { bg: 'bg-success/10', bar: 'bg-success', text: 'text-success' },
  vencido:    { bg: 'bg-destructive/10', bar: 'bg-destructive', text: 'text-destructive' },
  en_curso:   { bg: 'bg-primary/10', bar: 'bg-primary', text: 'text-primary' },
  pendiente:  { bg: 'bg-muted/50', bar: 'bg-muted-foreground/40', text: 'text-muted-foreground' },
};

function getEstado(item: GanttItem, today: Date): string {
  if (item.estado === 'completado') return 'completado';
  const inicio = new Date(item.fechaInicio || item.fechaFin);
  const fin = new Date(item.fechaFin);
  if (today > fin) return 'vencido';
  if (today >= inicio) return 'en_curso';
  return 'pendiente';
}

function getBarWidth(item: GanttItem, totalDays: number, refDate: number): number {
  const fin = new Date(item.fechaFin).getTime();
  const diasInicio = (new Date(item.fechaInicio || item.fechaFin).getTime() - refDate) / 86400000;
  const diasFin = (fin - refDate) / 86400000;
  const width = Math.max(((diasFin - diasInicio) / totalDays) * 100, 3);
  return Math.min(width, 100);
}

function getBarOffset(item: GanttItem, totalDays: number, refDate: number): number {
  const diasInicio = (new Date(item.fechaInicio || item.fechaFin).getTime() - refDate) / 86400000;
  return Math.max((diasInicio / totalDays) * 100, 0);
}

const GanttChart: React.FC<GanttChartProps> = ({ items, onVerDetalle }) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  const { enrichedItems, labels, totalDays, refDate, milestones } = useMemo(() => {
    const today = new Date();
    const allDates = items.flatMap(it => [
      new Date(it.fechaInicio || it.fechaFin).getTime(),
      new Date(it.fechaFin).getTime()
    ]);
    const minDate = Math.min(...allDates, today.getTime());
    const maxDate = Math.max(...allDates, today.getTime() + 30 * 86400000);
    const refDate = minDate - 7 * 86400000;
    const totalDays = Math.ceil((maxDate - refDate) / 86400000);

    const enrichedItems = items.map(it => {
      const estado = getEstado(it, today);
      const status = STATUS_COLORS[estado] || STATUS_COLORS.pendiente;
      const offset = getBarOffset(it, totalDays, refDate);
      const width = getBarWidth(it, totalDays, refDate);
      return { ...it, estado, status, offset, width };
    }).filter(it => it.width > 0).sort((a, b) => a.offset - b.offset);

    const labels = ['Hoy'];
    for (let i = 7; i < totalDays; i += Math.max(Math.floor(totalDays / 6), 1)) {
      const d = new Date(refDate + i * 86400000);
      labels.push(d.toLocaleDateString('es', { day: '2-digit', month: 'short' }));
    }

    const milestones = enrichedItems.filter(it => it.estado === 'vencido' || it.estado === 'completado').length;

    return { enrichedItems, labels, totalDays, refDate, milestones };
  }, [items]);

  const todayLinePos = useMemo(() => {
    const today = new Date();
    const pos = ((today.getTime() - refDate) / (totalDays * 86400000)) * 100;
    return Math.max(0, Math.min(pos, 100));
  }, [refDate, totalDays]);

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="w-full overflow-x-auto scrollbar-thin" style={{ scrollbarGutter: 'stable' }}>
      <div className="min-w-[400px]">
        {/* Header with labels */}
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-foreground">
            <CalendarClock className="w-3 h-3 text-primary" />
            {t('dashboard.cronograma') || 'Cronograma'}
            {milestones > 0 && (
              <span className="text-[8px] font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {milestones} {t('dashboard.pendiente').toLowerCase()}
              </span>
            )}
          </div>
          {onVerDetalle && (
            <button onClick={onVerDetalle} className="text-[9px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5">
              {t('dashboard.ver_todos')} <ChevronRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Time scale header */}
        <div className="relative flex items-center h-5 mb-1">
          <div className="w-[150px] text-[8px] text-muted-foreground px-1">Actividad</div>
          <div className="flex-1 relative">
            <div className="flex items-center justify-between px-1 text-[7px] text-muted-foreground uppercase tracking-wider">
              {labels.map((l, i) => <span key={i} className="flex-shrink-0">{l}</span>)}
            </div>
          </div>
        </div>

        {/* Gantt rows */}
        <div className="space-y-0.5">
          {enrichedItems.map((item, i) => {
            const color = item.status;
            return (
              <div key={item.id || i} className="flex items-center group hover:bg-muted/30 rounded-lg px-1 transition-colors">
                {/* Item name */}
                <div className="w-[150px] text-[9px] text-foreground font-medium truncate pr-2 min-w-0" title={item.nombre}>
                  <div className="truncate">{item.nombre}</div>
                  {item.proyecto && <div className="text-[7px] text-muted-foreground truncate">{item.proyecto}</div>}
                </div>
                {/* Bar */}
                <div className="flex-1 relative h-5">
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-3.5 rounded-full transition-all group-hover:h-4 ${color.bar} ${
                      item.width < 8 ? 'flex items-center justify-center' : ''
                    }`}
                    style={{ left: `${item.offset}%`, width: `${item.width}%`, minWidth: '12px' }}
                  >
                    {/* Progress fill */}
                    {item.avance !== undefined && item.avance > 0 && (
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full ${color.bar}`}
                        style={{ width: `${Math.min(item.avance, 100)}%`, opacity: 0.85 }}
                      />
                    )}
                    {item.width >= 20 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.5)] overflow-hidden whitespace-nowrap px-1 truncate">
                        {item.avance !== undefined ? `${item.avance}%` : ''}
                      </span>
                    )}
                  </div>
                  {/* Today line indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-foreground/40"
                    style={{ left: `${todayLinePos}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
