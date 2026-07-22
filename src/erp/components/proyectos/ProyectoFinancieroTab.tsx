import React from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { fmtQ } from '../../utils';

interface ProyectoFinancieroTabProps {
  proyecto: any;
  movimientos: any[];
}

const ProyectoFinancieroTab: React.FC<ProyectoFinancieroTabProps> = ({ proyecto, movimientos }) => {
  const { t } = useTranslation();

  const proyectoMovimientos = movimientos.filter((m) => m.proyectoId === proyecto.id);
  const ingresos = proyectoMovimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + (m.monto || 0), 0);
  const egresos = proyectoMovimientos.filter((m) => m.tipo !== 'ingreso').reduce((s, m) => s + (m.monto || 0), 0);
  const utilidad = ingresos - egresos;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('financiero.ingresos', 'Ingresos')}</p>
          <p className="text-lg font-bold text-success">{fmtQ(ingresos)}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('financiero.egresos', 'Egresos')}</p>
          <p className="text-lg font-bold text-destructive">{fmtQ(egresos)}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('financiero.utilidad', 'Utilidad')}</p>
          <p className={`text-lg font-bold ${utilidad > 0 ? 'text-success' : utilidad < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {fmtQ(utilidad)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProyectoFinancieroTab;
