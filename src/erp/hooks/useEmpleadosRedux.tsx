import { useSelector, useDispatch } from 'react-redux';
import {
  fetchEmpleados,
  addEmpleado,
  updateEmpleado,
  deleteEmpleado,
} from '../../store';

export const useEmpleadosRedux = () => {
  const dispatch = useDispatch();
  const empleados = useSelector((state: any) => state.empleados.list);
  const status = useSelector((state: any) => state.empleados.status);
  const error = useSelector((state: any) => state.empleados.error);

  const load = () => dispatch(fetchEmpleados());
  const create = (empleado: any) => dispatch(addEmpleado(empleado));
  const update = (id: string, patch: any) => dispatch(updateEmpleado({ id, ...patch }));
  const remove = (id: string) => dispatch(deleteEmpleado(id));

  return {
    empleados,
    status,
    error,
    load,
    create,
    update,
    remove,
  };
};

export default useEmpleadosRedux;