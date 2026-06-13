import { useErp } from '../store';

const INCIDENCIA_THRESHOLD = 5;

export const useIncidenciaAlertas = () => {
  const { proyectos, addNotificacion } = useErp();

  const calcularAlertas = () => {
    const counts: Record<string, number> = {};
    proyectos.forEach((p: any) => {
      if (p.incidentesCount && p.incidentesCount > INCIDENCIA_THRESHOLD) {
        counts[p.id] = p.incidentesCount;
      }
    });
    return Object.entries(counts).map(([proyectoId, total]) => {
      const proyecto = proyectos.find((p: any) => p.id === proyectoId);
      return {
        proyectoId,
        proyectoNombre: proyecto?.nombre || '',
        totalIncidentes: total,
        tasaPorProyecto: total,
      };
    });
  };

  const checkAndNotify = () => {
    const alertas = calcularAlertas();
    alertas.forEach(alerta => {
      addNotificacion({
        tipo: 'incidencia_alta',
        titulo: `Alta incidencia en: ${alerta.proyectoNombre}`,
        mensaje: `Se detectaron ${alerta.totalIncidentes} incidentes (umbral: ${INCIDENCIA_THRESHOLD})`,
        proyectoId: alerta.proyectoId,
        leida: false,
      });
    });
  };

  return {
    alertas: calcularAlertas(),
    checkAndNotify,
    threshold: INCIDENCIA_THRESHOLD,
  };
};

export default useIncidenciaAlertas;