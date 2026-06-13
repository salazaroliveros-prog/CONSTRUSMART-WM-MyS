import { useErp } from '../store';

export const useProyectosRedux = () => {
  const { proyectos, addProyecto, updateProyecto, deleteProyecto } = useErp();

  return {
    proyectos: proyectos.filter((p: any) => p.estado === 'ejecucion'),
    allProyectos: proyectos,
    status: 'succeeded' as const,
    error: null,
    load: () => {},
    create: addProyecto,
    update: (id: string, patch: any) => updateProyecto(id, patch),
    remove: deleteProyecto,
  };
};

export default useProyectosRedux;