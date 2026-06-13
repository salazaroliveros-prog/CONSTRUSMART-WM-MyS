import { useErp } from '../store';

export const useProyectoNotificaciones = (proyectoId?: string) => {
  const { proyectos } = useErp();
  const proyecto = proyectoId ? proyectos.find((p: any) => p.id === proyectoId) : null;

  const getAlertas = () => {
    if (!proyecto) return [];
    return {
      sinPresupuesto: !proyecto.presupuestoActualId,
      finalizado: proyecto.estado === 'finalizado',
      riesgo: proyecto.avanceFinanciero > proyecto.presupuestoTotal,
    };
  };

  return {
    proyecto,
    alertas: getAlertas(),
  };
};