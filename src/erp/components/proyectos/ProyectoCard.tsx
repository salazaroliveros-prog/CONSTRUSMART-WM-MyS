import React from 'react';
import { Building2, Pencil, Trash2 } from 'lucide-react';
import type { Proyecto } from '../../types';
import { estadoColor } from '../../utils/proyectoColors';
import { BUTTON_ICON, BUTTON_DANGER, BUTTON_PRIMARY, BUTTON_SECONDARY, COLOR_WARNING } from '../../ui';
import ProyectoStateBadge from './ProyectoStateBadge';
import ProyectoProgress from './ProyectoProgress';
import ProyectoActions from './ProyectoActions';
import { fmtQ, fmtPct } from '../../utils';

interface ProyectoCardProps {
  proyecto: Proyecto;
  index: number;
  estadoLabel: Record<string, string>;
  etapaLabel: Record<string, string>;
  tipoObraLabel: Record<string, string>;
  TIPOLOGIA_LABEL: Record<string, string>;
  onEdit: (p: Proyecto) => void;
  onDelete: (p: Proyecto) => void;
  onDetail: (p: Proyecto) => void;
  onAccionRapida: (p: Proyecto, accion: string) => void;
  t: (key: string, options?: any) => string;
}

const ProyectoCard: React.FC<ProyectoCardProps> = ({ proyecto, index, estadoLabel, etapaLabel, tipoObraLabel, TIPOLOGIA_LABEL, onEdit, onDelete, onDetail, onAccionRapida, t }) => {
  const color = estadoColor(proyecto);

  return (
    <div
      className="group bg-card text-card-foreground rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border hover:-translate-y-1 animate-in fade-in duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
      style={{ animationDelay: `${index * 0.04}s` }}
      tabIndex={0}
      role="button"
      aria-label={t('proyectos.aria_card', { nombre: proyecto.nombre })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onDetail(proyecto);
        }
      }}
    >
      <div className="h-1.5 rounded-t-2xl transition-all duration-300 group-hover:h-2" style={{ background: color }} />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: color }} aria-hidden="true">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-sm truncate">{proyecto.nombre}</h3>
            <p className="text-xs text-muted-foreground truncate">{proyecto.cliente}</p>
            {proyecto.areaConstruccion && <p className="text-xs text-muted-foreground">{proyecto.areaConstruccion.toLocaleString()} m² · {proyecto.numPisos ? `${proyecto.numPisos} ${t('proyectos.niveles')}` : ''}</p>}
          </div>
          <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <button onClick={() => onEdit(proyecto)} className={BUTTON_ICON} aria-label={t('proyectos.editar_proyecto', { nombre: proyecto.nombre })}>
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </button>
            <button onClick={() => onDelete(proyecto)} className={BUTTON_DANGER} aria-label={t('proyectos.eliminar_proyecto_nombre', { nombre: proyecto.nombre })}>
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] px-3 py-1.5 rounded-full bg-muted text-foreground font-medium min-h-[32px] flex items-center">{TIPOLOGIA_LABEL[proyecto.tipologia]}</span>
          <ProyectoStateBadge estado={proyecto.estado} estadoLabel={estadoLabel} />
          {proyecto.etapa && <span className="text-[10px] px-3 py-1.5 rounded-full bg-muted text-muted-foreground min-h-[32px] flex items-center">{etapaLabel[proyecto.etapa] || proyecto.etapa}</span>}
          {proyecto.estado === 'pausado' && proyecto.motivoPausa && <span className={`text-[10px] px-3 py-1.5 rounded-full bg-amber-500/10 ${COLOR_WARNING} dark:text-amber-400 truncate max-w-[140px] min-h-[32px] flex items-center`} title={proyecto.motivoPausa}>{proyecto.motivoPausa}</span>}
          {proyecto.moneda && <span className="text-[10px] px-3 py-1.5 rounded-full bg-muted text-muted-foreground">{proyecto.moneda}</span>}
        </div>

        <div className="space-y-2.5 mb-4">
          <ProyectoProgress avanceFisico={proyecto.avanceFisico} avanceFinanciero={proyecto.avanceFinanciero} t={t} />
        </div>

        <div className="pt-3.5 flex justify-between text-xs border-t border-border">
          <div>
            <span className="text-muted-foreground block text-[10px] mb-0.5">{t('proyectos.presupuesto')}</span>
            <b className="text-foreground font-semibold">{fmtQ(proyecto.presupuestoTotal)}</b>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground block text-[10px] mb-0.5">{t('proyectos.contrato')}</span>
            <b className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmtQ(proyecto.montoContrato || 0)}</b>
          </div>
        </div>

        <ProyectoActions proyecto={proyecto} onEdit={onEdit} onDetail={onDetail} onAccionRapida={onAccionRapida} t={t} BUTTON_PRIMARY={BUTTON_PRIMARY} BUTTON_SECONDARY={BUTTON_SECONDARY} />
      </div>
    </div>
  );
};

export default ProyectoCard;
