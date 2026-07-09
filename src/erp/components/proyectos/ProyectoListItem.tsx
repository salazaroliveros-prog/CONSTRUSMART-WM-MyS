import React from 'react';
import { ChevronRight, Pencil } from 'lucide-react';
import type { Proyecto } from '../../types';
import { estadoColor } from '../../utils/proyectoColors';
import { BUTTON_ICON } from '../../ui';
import ProyectoStateBadge from './ProyectoStateBadge';

interface ProyectoListItemProps {
  proyecto: Proyecto;
  estadoLabel: Record<string, string>;
  onEdit: (p: Proyecto) => void;
  onDetail: (p: Proyecto) => void;
  onAccionRapida: (p: Proyecto, accion: string) => void;
  t: (key: string, options?: any) => string;
  fmtQ: (n: number) => string;
  fmtPct: (n: number) => string;
}

const ProyectoListItem: React.FC<ProyectoListItemProps> = ({ proyecto, estadoLabel, onEdit, onDetail, onAccionRapida, t, fmtQ, fmtPct }) => {
  const color = estadoColor(proyecto);

  return (
    <div
      className="group bg-card text-card-foreground rounded-xl shadow-sm hover:shadow-sm active:shadow-sm transition-all duration-200 border border-border p-4 flex flex-wrap items-center gap-3 focus:outline-none focus:ring-2 focus:ring-ring"
      tabIndex={0}
      role="row"
      aria-label={t('proyectos.aria_card', { nombre: proyecto.nombre })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDetail(proyecto); }
      }}
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} aria-hidden="true" />
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate">{proyecto.nombre}</span>
          <ProyectoStateBadge estado={proyecto.estado} estadoLabel={estadoLabel} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{proyecto.cliente} · {proyecto.ubicacion}</p>
      </div>
      <div className="text-xs text-muted-foreground hidden sm:block">
        <span className="block">{fmtQ(proyecto.presupuestoTotal || 0)}</span>
        <span className="block">{fmtPct(proyecto.avanceFisico)}</span>
      </div>
      <div className="flex gap-1">
        <button onClick={() => onEdit(proyecto)} className={BUTTON_ICON} aria-label={t('proyectos.editar_proyecto', { nombre: proyecto.nombre })}>
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <button onClick={() => onDetail(proyecto)} className={BUTTON_ICON} aria-label={t('proyectos.ver_detalle', { nombre: proyecto.nombre })}>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default ProyectoListItem;
