import React from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Calendar } from 'lucide-react';
import { fmtQ, fmtPct } from '../../utils';

interface ProyectoAvanceTabProps {
  proyecto: any;
  avances: any[];
  hitos: any[];
}

const ProyectoAvanceTab: React.FC<ProyectoAvanceTabProps> = ({ proyecto, avances, hitos }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('proyectos.avance_fisico', 'Avance Físico')}</p>
          <p className="text-lg font-bold">{fmtPct(proyecto.avanceFisico || 0)}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('proyectos.avance_financiero', 'Avance Financiero')}</p>
          <p className="text-lg font-bold">{fmtPct(proyecto.avanceFinanciero || 0)}</p>
        </div>
      </div>
      <div className="bg-muted/30 rounded-lg p-3">
        <p className="text-xs text-muted-foreground mb-2">{t('proyectos.hitos', 'Hitos')}</p>
        {hitos.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('proyectos.sin_hitos', 'Sin hitos')}</p>
        ) : (
          <div className="space-y-2">
            {hitos.slice(0, 10).map((h: any) => (
              <div key={h.id} className="flex items-center justify-between text-xs">
                <span className="truncate">{h.nombre}</span>
                <span className={`px-2 py-0.5 rounded-full whitespace-nowrap ${
                  h.estado === 'completado' ? 'bg-success/10 text-success' :
                  h.estado === 'en_progreso' ? 'bg-primary/10 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {h.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProyectoAvanceTab;
