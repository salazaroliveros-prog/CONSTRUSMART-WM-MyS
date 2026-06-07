import { useSelector, useDispatch } from 'react-redux';
import {
  fetchPresupuestos,
  addPresupuesto,
  updatePresupuesto,
  deletePresupuesto,
} from '../../store';

export const usePresupuestosRedux = () => {
  const dispatch = useDispatch();
  const presupuestos = useSelector((state: any) => state.presupuestos.list);
  const status = useSelector((state: any) => state.presupuestos.status);
  const error = useSelector((state: any) => state.presupuestos.error);

  const load = () => dispatch(fetchPresupuestos());
  const create = (presupuesto: any) => dispatch(addPresupuesto(presupuesto));
  const update = (id: string, patch: any) => dispatch(updatePresupuesto({ id, ...patch }));
  const remove = (id: string) => dispatch(deletePresupuesto(id));

  return {
    presupuestos,
    status,
    error,
    load,
    create,
    update,
    remove,
  };
};

export default usePresupuestosRedux;