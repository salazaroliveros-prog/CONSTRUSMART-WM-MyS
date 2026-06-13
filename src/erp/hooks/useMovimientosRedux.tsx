import { useErp } from '../store';

export const useMovimientosRedux = () => {
  const { movimientos, addMovimiento, updateMovimiento, deleteMovimiento } = useErp();

  return {
    movimientos,
    status: 'succeeded' as const,
    error: null,
    load: () => {},
    create: addMovimiento,
    update: (id: string, patch: any) => updateMovimiento(id, patch),
    remove: deleteMovimiento,
  };
};

export default useMovimientosRedux;