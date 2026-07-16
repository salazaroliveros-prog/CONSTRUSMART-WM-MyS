import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';
import ProyectoFilter from '../components/ProyectoFilter';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui';

const RendimientoCampo: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, rendimientoCampo, addRendimientoCampo, updateRendimientoCampo, currentProjectId, setCurrentProjectId } = useErp();
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);
  const [proyectoFilter, setProyectoFilter] = useState('');
  const BASE = 'rendimiento_campo';
  const safeRendimientoCampo = useMemo(() => Array.isArray(rendimientoCampo) ? rendimientoCampo : [], [rendimientoCampo]);

  const items = useMemo(() => {
    return safeRendimientoCampo.filter(r => {
      if (!proyectoFilter && !currentProjectId) return true;
      const pid = currentProjectId && currentProjectId !== 'none' ? currentProjectId : proyectoFilter;
      return r.proyectoId === pid;
    });
  }, [safeRendimientoCampo, proyectoFilter, currentProjectId]);

  if (loading) return <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-64 rounded-2xl" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h1 className="text-lg sm:text-xl font-black text-foreground">{t(`${BASE}.titulo`, 'Rendimiento de Campo')}</h1>
        <ProyectoFilter value={proyectoFilter} onChange={setProyectoFilter} proyectos={proyectos} />
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <p className="text-sm text-muted-foreground mb-2">{t(`${BASE}.registro_diario`, 'Registro diario de producción y horas por cuadrilla')}</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-2">{t(`${BASE}.capturas_card`, 'Capturas')}</h3>
        <p className="text-xs text-muted-foreground">{t(`${BASE}.medicion_rendimiento`, 'Medición de rendimiento real vs teórico')}</p>
      </div>
    </div>
  );
};

export default RendimientoCampo;