import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, MapPin, Calendar, User, Hash } from 'lucide-react';

interface ProyectoInfoTabProps {
  proyecto: any;
}

const ProyectoInfoTab: React.FC<ProyectoInfoTabProps> = ({ proyecto }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('proyectos.estado', 'Estado')}</p>
          <p className="text-sm font-medium">{proyecto.estado}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('proyectos.etapa', 'Etapa')}</p>
          <p className="text-sm font-medium">{proyecto.etapa}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('proyectos.cliente', 'Cliente')}</p>
          <p className="text-sm font-medium">{proyecto.cliente}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('proyectos.ubicacion', 'Ubicación')}</p>
          <p className="text-sm font-medium">{proyecto.ubicacion}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('proyectos.tipologia', 'Tipología')}</p>
          <p className="text-sm font-medium">{proyecto.tipologia}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('proyectos.tipo_obra', 'Tipo de Obra')}</p>
          <p className="text-sm font-medium">{proyecto.tipoObra}</p>
        </div>
      </div>
      {proyecto.descripcion && (
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">{t('proyectos.descripcion', 'Descripción')}</p>
          <p className="text-sm">{proyecto.descripcion}</p>
        </div>
      )}
    </div>
  );
};

export default ProyectoInfoTab;
