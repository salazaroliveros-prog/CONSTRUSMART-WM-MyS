import React from 'react';
import { Plus, Play, Pause, CheckCircle2, RotateCcw, ChevronRight } from 'lucide-react';
import type { Proyecto } from '../../types';

interface ProyectoActionsProps {
  proyecto: Proyecto;
  onEdit: (p: Proyecto) => void;
  onDetail: (p: Proyecto) => void;
  onAccionRapida: (p: Proyecto, accion: string) => void;
  t: (key: string, options?: any) => string;
  BUTTON_PRIMARY: string;
  BUTTON_SECONDARY: string;
}

const ProyectoActions: React.FC<ProyectoActionsProps> = ({ proyecto, onEdit, onDetail, onAccionRapida, t, BUTTON_PRIMARY, BUTTON_SECONDARY }) => {
  return (
    <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5">
      {proyecto.estado === 'planeacion' && (
        <button
          onClick={() => onAccionRapida(proyecto, 'iniciar')}
          className={`${BUTTON_PRIMARY} flex-1 justify-center bg-emerald-500 hover:bg-emerald-600 text-white`}
        >
          <Play className="w-3 h-3" /> {t('proyectos.iniciar')}
        </button>
      )}
      {proyecto.estado === 'ejecucion' && (
        <>
          <button
            onClick={() => onAccionRapida(proyecto, 'pausar')}
            className={`${BUTTON_PRIMARY} flex-1 justify-center bg-amber-500 hover:bg-amber-600 text-white`}
          >
            <Pause className="w-3 h-3" /> {t('proyectos.pausar')}
          </button>
          <button
            onClick={() => onAccionRapida(proyecto, 'finalizar')}
            className={`${BUTTON_PRIMARY} flex-1 justify-center bg-blue-500 hover:bg-blue-600 text-white`}
          >
            <CheckCircle2 className="w-3 h-3" /> {t('proyectos.finalizar')}
          </button>
        </>
      )}
      {proyecto.estado === 'pausado' && (
        <button
          onClick={() => onAccionRapida(proyecto, 'reanudar')}
          className={`${BUTTON_PRIMARY} flex-1 justify-center bg-emerald-500 hover:bg-emerald-600 text-white`}
        >
          <RotateCcw className="w-3 h-3" /> {t('proyectos.reanudar')}
        </button>
      )}
      {proyecto.estado === 'finalizado' && (
        <button
          onClick={() => onAccionRapida(proyecto, 'reabrir')}
          className={`${BUTTON_SECONDARY} flex-1 justify-center`}
        >
          <RotateCcw className="w-3 h-3" /> {t('proyectos.reabrir')}
        </button>
      )}
      <button
        onClick={() => onDetail(proyecto)}
        className="text-xs px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 active:bg-muted text-muted-foreground hover:text-foreground font-medium flex items-center justify-center gap-1 transition-all active:scale-95"
      >
        <ChevronRight className="w-3 h-3" /> {t('proyectos.detalle')}
      </button>
    </div>
  );
};

export default ProyectoActions;
