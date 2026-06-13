import { useErp } from '../store';

export const useErpRedux = () => {
  const {
    proyectos, movimientos, presupuestos, empleados, materiales, ordenes,
    addProyecto, updateProyecto, deleteProyecto,
    addMovimiento, updateMovimiento, deleteMovimiento,
    addPresupuesto, updatePresupuesto, deletePresupuesto,
    addEmpleado, updateEmpleado, deleteEmpleado,
    addMaterial, updateMaterial, deleteMaterial,
    addOrden, updateOrden,
    view, setView, user, initializing, allowedViews, authError,
    signIn, signUp, signInWithGoogle, logout, isOnline,
  } = useErp();

  return {
    proyectos,
    addProyecto,
    updateProyecto,
    deleteProyecto,
    movimientos,
    addMovimiento,
    updateMovimiento,
    deleteMovimiento,
    presupuestos,
    addPresupuesto,
    updatePresupuesto,
    deletePresupuesto,
    empleados,
    addEmpleado,
    updateEmpleado,
    deleteEmpleado,
    materiales,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    ordenes,
    addOrden,
    updateOrden: (id: string, estado: string) => updateOrden(id, { estado }),
    view, setView, user, initializing, allowedViews, authError,
    signIn, signUp, signInWithGoogle, logout, isOnline,
  };
};

export default useErpRedux;