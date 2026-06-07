import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProyectos,
  addProyecto,
  updateProyecto,
  deleteProyecto,
  selectActiveProyectos,
} from '../../store';

export const useProyectosRedux = () => {
  const dispatch = useDispatch();
  const proyectos = useSelector(selectActiveProyectos);
  const allProyectos = useSelector((state: any) => state.proyectos.list);
  const status = useSelector((state: any) => state.proyectos.status);
  const error = useSelector((state: any) => state.proyectos.error);

  const load = () => dispatch(fetchProyectos());
  const create = (proyecto: any) => dispatch(addProyecto(proyecto));
  const update = (id: string, patch: any) => dispatch(updateProyecto({ id, ...patch }));
  const remove = (id: string) => dispatch(deleteProyecto(id));

  return {
    proyectos,
    allProyectos,
    status,
    error,
    load,
    create,
    update,
    remove,
  };
};

export default useProyectosRedux;