import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../../store';
import { GanttChart } from '../GanttChart';
import { Skeleton } from '@/components/ui/skeleton';

interface SeguimientoCronogramaPanelProps {
  proyectoId?: string;
}

const SeguimientoCronogramaPanel: React.FC<SeguimientoCronogramaPanelProps> = ({ proyectoId }) => {
  const { t } = useTranslation();
  const { hitos, proyectos } = useErp();

  const items = useMemo(() => {
    const source = proyectoId
      ? hitos.filter((h) => h.proyectoId === proyectoId)
      : hitos;

    return source.map((h) => {
      const proyecto = proyectos.find((p) => p.id === h.proyectoId);
      const fechaInicio = h.fechaPlanificada;
      const fechaFin = h.fechaReal || h.fechaPlanificada;
      const estado = h.estado || 'pendiente';

      return {
        id: h.id,
        nombre: h.nombre,
        proyecto: proyecto?.nombre || '',
        fechaInicio,
        fechaFin,
        estado,
        avance: h.estado === 'completado' ? 100 : h.estado === 'en_progreso' ? 50 : 0,
      };
    });
  }, [hitos, proyectos, proyectoId]);

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <p className="text-muted-foreground text-sm">
          {t('seguimiento.sin_hitos', 'Sin hitos registrados para este proyecto')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          {t('seguimiento.cronograma_titulo', 'Cronograma de Hitos')}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          {t('seguimiento.cronograma_descripcion', 'Visualización temporal de hitos del proyecto')}
        </p>
        <GanttChart items={items} />
      </div>
    </div>
  );
};

export default SeguimientoCronogramaPanel;
