import React from 'react';
import { Activity, Play, ClipboardList, DollarSign } from 'lucide-react';
import { fmtQ } from '../../utils';
import { KPI_CARD, CARD_TITLE, COLOR_SUCCESS, COLOR_INFO } from '../../ui';

interface ProyectosKPIProps {
  total: number;
  enEjecucion: number;
  presupuestoTotal: number;
  contratoTotal: number;
  t: (key: string, options?: any) => string;
}

const ProyectosKPI: React.FC<ProyectosKPIProps> = ({ total, enEjecucion, presupuestoTotal, contratoTotal, t }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
      <div className={KPI_CARD}>
        <Activity className="w-4 h-4 text-primary" aria-hidden="true" />
        <div className="text-lg font-black">{total}</div>
        <div className={CARD_TITLE}>{t('proyectos.total_proyectos')}</div>
      </div>
      <div className={KPI_CARD}>
        <Play className={`w-4 h-4 ${COLOR_SUCCESS}`} aria-hidden="true" />
        <div className="text-lg font-black text-foreground">{enEjecucion}</div>
        <div className={CARD_TITLE}>{t('proyectos.en_ejecucion')}</div>
      </div>
      <div className={KPI_CARD}>
        <ClipboardList className={`w-4 h-4 ${COLOR_INFO}`} aria-hidden="true" />
        <div className="text-lg font-black text-foreground">{fmtQ(presupuestoTotal)}</div>
        <div className={CARD_TITLE}>{t('proyectos.total_presupuesto')}</div>
      </div>
      <div className={KPI_CARD}>
        <DollarSign className={`w-4 h-4 ${COLOR_SUCCESS}`} aria-hidden="true" />
        <div className="text-lg font-black text-foreground">{fmtQ(contratoTotal)}</div>
        <div className={CARD_TITLE}>{t('proyectos.total_contratos')}</div>
      </div>
    </div>
  );
};

export default ProyectosKPI;
