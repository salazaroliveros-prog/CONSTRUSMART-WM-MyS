import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

interface ProyectoRiesgosTabProps {
  riesgos: any[];
}

const ProyectoRiesgosTab: React.FC<ProyectoRiesgosTabProps> = ({ riesgos }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {riesgos.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {t('riesgos.sin_riesgos', 'Sin riesgos activos')}
        </p>
      ) : (
        <div className="space-y-2">
          {riesgos.map((r: any) => (
            <div key={r.id} className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{r.descripcion}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  (r.probabilidad + r.impacto) >= 8 ? 'bg-red-100 text-red-700' :
                  (r.probabilidad + r.impacto) >= 6 ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {r.probabilidad + r.impacto}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('riesgos.probabilidad', 'Probabilidad')}: {r.probabilidad} / {t('riesgos.impacto', 'Impacto')}: {r.impacto}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProyectoRiesgosTab;
