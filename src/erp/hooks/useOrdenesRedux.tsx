import { useSelector, useDispatch } from 'react-redux';
import {
  fetchOrdenes,
  deleteOrden,
} from '../../store';

export const useOrdenesRedux = () => {
  const dispatch = useDispatch();
  const ordenes = useSelector((state: any) => state.ordenes.list);
  const status = useSelector((state: any) => state.ordenes.status);
  const error = useSelector((state: any) => state.ordenes.error);

  const load = () => dispatch(fetchOrdenes());
  const remove = (id: string) => dispatch(deleteOrden(id));

  return {
    ordenes,
    status,
    error,
    load,
    remove,
  };
};

export default useOrdenesRedux;