import { useSelector, useDispatch } from 'react-redux';
import { fetchProyectos, addProyecto, updateProyecto, deleteProyecto } from '../../store';

export const useProyecto = (proyectoId?: string) => {
  const dispatch = useDispatch();
  const { list: proyectos, status, error } = useSelector((state) => state.proyectos);

  const proyecto = proyectoId ? proyectos.find((p) => p.id === proyectoId) : null;

  const load = () => dispatch(fetchProyectos());
  const create = (proyecto) => dispatch(addProyecto(proyecto));
  const update = (id, patch) => dispatch(updateProyecto({ id, ...patch }));
  const remove = (id) => dispatch(deleteProyecto(id));

  return {
    proyectos,
    proyecto,
    status,
    error,
    load,
    create,
    update,
    remove,
  };
};