import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addNotificacion } from '../../store';

const INCIDENCIA_THRESHOLD = 5; // alert if > 5 incidents per project

interface IncidenciaAlerta {
  proyectoId: string;
  proyectoNombre: string;
  totalIncidentes: number;
  tasaPorProyecto: number;
}

export const useIncidenciaAlertas = () => {
  const dispatch = useDispatch();
  const { list: incidentes } = useSelector((state: any) => state.incidentes);
  const { list: proyectos } = useSelector((state: any) => state.proyectos);

  const calcularAlertas = React.useCallback((): IncidenciaAlerta[] => {
    const incidentesPorProyecto = incidentes.reduce((acc: Record<string, number>, inc: any) => {
      if (inc.proyectoId) {
        acc[inc.proyectoId] = (acc[inc.proyectoId] || 0) + 1;
      }
      return acc;
    }, {});

    const alertas: IncidenciaAlerta[] = Object.entries(incidentesPorProyecto)
      .map(([proyectoId, total]) => {
        const proyecto = proyectos.find(p => p.id === proyectoId);
        if (!proyecto) return null;
        return {
          proyectoId,
          proyectoNombre: proyecto.nombre,
          totalIncidentes: total,
          tasaPorProyecto: total, // incidents per project (simple count)
        };
      })
      .filter((a): a is IncidenciaAlerta => a !== null && a.tasaPorProyecto > INCIDENCIA_THRESHOLD);

    return alertas;
  }, [incidentes, proyectos]);

  const checkAndNotify = React.useCallback(() => {
    const alertas = calcularAlertas();
    alertas.forEach(alerta => {
      dispatch(addNotificacion(
        'incidencia_alta',
        `Alta incidencia en: ${alerta.proyectoNombre}`,
        `Se detectaron ${alerta.totalIncidentes} incidentes (umbral: ${INCIDENCIA_THRESHOLD})`,
        alerta.proyectoId
      ));
    });
  }, [dispatch, calcularAlertas]);

  // Run check when incidentes or proyectos change
  useEffect(() => {
    checkAndNotify();
  }, [checkAndNotify]);

  return {
    alertas: calcularAlertas(),
    checkAndNotify,
    threshold: INCIDENCIA_THRESHOLD,
  };
};

export default useIncidenciaAlertas;