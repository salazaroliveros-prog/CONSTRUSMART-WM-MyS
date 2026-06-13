import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { CalendarClock, ChevronRight, Circle } from 'lucide-react';
import { CARD, CARD_TITLE } from '../ui';

const CompactCalendar: React.FC = () => {
  const { t } = useTranslation();
  const { eventos, proyectos, setView } = useErp();

  const upcoming = useMemo(() => {
    const now = new Date();
    return eventos
      .filter(e => new Date(`${e.fecha}T${e.hora || '09:00'}:00`) >= now)
      .sort((a, b) => new Date(`${a.fecha}T${a.hora || '09:00'}:00`).getTime() - new Date(`${b.fecha}T${b.hora || '09:00'}:00`).getTime())
      .slice(0, 4);
  }, [eventos]);

  const getDotColor = (tipo?: string) => {
    switch (tipo) {
      case 'Reunión': return 'bg-violet-500';
      case 'Visita': return 'bg-emerald-500';
      case 'Actividad': return 'bg-blue-500';
      default: return 'bg-amber-500';
    }
  };

  const formatDate = (fecha: string) => {
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className={`${CARD} p-2 sm:p-3 hover:border-primary/30 transition-all`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className={`${CARD_TITLE} text-xs sm:text-sm flex items-center gap-1`}>
          <CalendarClock className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
          {t('common.proximas_actividades') || 'Próximas actividades'}
        </h3>
        {upcoming.length > 0 && (
          <button
            onClick={() => setView('notificaciones')}
            className="text-[9px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5"
          >
            {t('dashboard.ver_todos') || 'Ver todos'} <ChevronRight className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      {upcoming.length === 0 ? (
        <p className="text-[10px] text-muted-foreground text-center py-3">
          {t('common.no_recordatorios') || 'No hay actividades próximas'}
        </p>
      ) : (
        <div className="space-y-1">
          {upcoming.map(ev => (
            <div key={ev.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors group">
              <Circle className={`w-2 h-2 ${getDotColor(ev.tipo)} fill-current shrink-0`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-medium text-foreground truncate">{ev.titulo}</div>
                <div className="text-[8px] text-muted-foreground flex items-center gap-1">
                  <span>{formatDate(ev.fecha)}</span>
                  {ev.hora && <><span>•</span><span>{ev.hora}</span></>}
                  {ev.proyectoId && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[60px]">
                        {proyectos.find((p: any) => p.id === ev.proyectoId)?.nombre || ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {ev.tipo && (
                <span className="text-[8px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline">
                  {ev.tipo}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompactCalendar;