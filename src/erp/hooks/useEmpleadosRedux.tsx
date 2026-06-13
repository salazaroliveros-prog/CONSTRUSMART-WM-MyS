import { useErp } from '../store';

export const useEmpleadosRedux = () => {
  const { empleados, addEmpleado, updateEmpleado, deleteEmpleado } = useErp();

  return {
    empleados,
    status: 'succeeded' as const,
    error: null,
    load: () => {},
    create: addEmpleado,
    update: (id: string, patch: any) => updateEmpleado(id, patch),
    remove: deleteEmpleado,
  };
};

export default useEmpleadosRedux;