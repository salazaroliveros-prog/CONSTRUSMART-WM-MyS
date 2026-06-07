import { useSelector } from 'react-redux';
import { fetchProyectos, addProyecto, updateProyecto, deleteProyecto } from '../../store';

export const useProyectoNotificaciones = (proyectoId?: string) => {
  const { list: proyectos } = useSelector((state) => state.proyectos);
  const proyecto = proyectoId ? proyectos.find((p) => p.id === proyectoId) : null;

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