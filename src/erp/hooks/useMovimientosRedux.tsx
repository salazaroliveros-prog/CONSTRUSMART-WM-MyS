import { useSelector, useDispatch } from 'react-redux';
import {
  fetchMovimientos,
  addMovimiento,
  updateMovimiento,
  deleteMovimiento,
} from '../../store';

export const useMovimientosRedux = () => {
  const dispatch = useDispatch();
  const movimientos = useSelector((state: any) => state.movimientos.list);
  const status = useSelector((state: any) => state.movimientos.status);
  const error = useSelector((state: any) => state.movimientos.error);

  const load = () => dispatch(fetchMovimientos());
  const create = (movimiento: any) => dispatch(addMovimiento(movimiento));
  const update = (id: string, patch: any) => dispatch(updateMovimiento({ id, ...patch }));
  const remove = (id: string) => dispatch(deleteMovimiento(id));

  return {
    movimientos,
    status,
    error,
    load,
    create,
    update,
    remove,
  };
};

export default useMovimientosRedux;