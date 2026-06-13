import { useErp } from '../store';

export const useProyecto = (proyectoId?: string) => {
  const { proyectos, addProyecto, updateProyecto, deleteProyecto } = useErp();

  const proyecto = proyectoId ? proyectos.find((p) => p.id === proyectoId) : null;

  return {
    proyectos,
    proyecto,
    status: 'succeeded' as const,
    error: null,
    load: () => {},
    create: addProyecto,
    update: (id: string, patch: Record<string, unknown>) => updateProyecto(id, patch),
    remove: deleteProyecto,
  };
};