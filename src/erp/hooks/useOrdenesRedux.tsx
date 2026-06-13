import { useErp } from '../store';

export const useOrdenesRedux = () => {
  const { ordenes, deleteOrden } = useErp();

  return {
    ordenes,
    status: 'succeeded' as const,
    error: null,
    load: () => {},
    remove: deleteOrden,
  };
};

export default useOrdenesRedux;