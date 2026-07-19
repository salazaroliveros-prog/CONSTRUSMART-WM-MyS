import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';

const RendimientoCampo: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos } = useErp();
  const [proyectoFilter, setProyectoFilter] = useState('');
  const BASE = 'rendimiento_campo';

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h1 className="text-lg sm:text-xl font-black text-foreground truncate" title={t(`${BASE}.titulo`, 'Rendimiento de Campo')}>
          {t(`${BASE}.titulo`, 'Rendimiento de Campo')}
        </h1>
        <ProyectoFilter value={proyectoFilter} onChange={setProyectoFilter} proyectos={proyectos} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm font-medium">Sin capturas registradas</p>
          <p className="text-xs mt-1">Registra producción y horas por cuadrilla para visualizar rendimiento</p>
        </div>
      </div>
    </div>
  );
};

export default RendimientoCampo;