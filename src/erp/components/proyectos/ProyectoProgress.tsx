import React from 'react';
import { Progress } from '../../components/Charts';
import { fmtPct } from '../../utils';

interface ProyectoProgressProps {
  avanceFisico: number;
  avanceFinanciero: number;
  t: (key: string, options?: any) => string;
}

const ProyectoProgress: React.FC<ProyectoProgressProps> = ({ avanceFisico, avanceFinanciero, t }) => {
  return (
    <div className="space-y-2.5">
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">{t('proyectos.avance_fisico')}</span>
          <span className="font-semibold text-foreground">{fmtPct(avanceFisico)}</span>
        </div>
        <div className="relative overflow-hidden rounded-full">
          <Progress value={avanceFisico} color="#3b82f6" />
          <div className="shimmer-bar absolute inset-0 pointer-events-none" />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">{t('proyectos.avance_financiero')}</span>
          <span className="font-semibold text-foreground">{fmtPct(avanceFinanciero)}</span>
        </div>
        <div className="relative overflow-hidden rounded-full">
          <Progress value={avanceFinanciero} color="#f97316" />
          <div className="shimmer-bar absolute inset-0 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default ProyectoProgress;
