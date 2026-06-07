import { useSelector, useDispatch } from 'react-redux';
import {
  fetchMateriales,
  addMaterial,
  updateMaterial,
  deleteMaterial,
} from '../../store';

export const useMaterialesRedux = () => {
  const dispatch = useDispatch();
  const materiales = useSelector((state: any) => state.materiales.list);
  const status = useSelector((state: any) => state.materiales.status);
  const error = useSelector((state: any) => state.materiales.error);

  const load = () => dispatch(fetchMateriales());
  const create = (material: any) => dispatch(addMaterial(material));
  const update = (id: string, patch: any) => dispatch(updateMaterial({ id, ...patch }));
  const remove = (id: string) => dispatch(deleteMaterial(id));

  return {
    materiales,
    status,
    error,
    load,
    create,
    update,
    remove,
  };
};

export default useMaterialesRedux;