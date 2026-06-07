import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProyectos,
  addProyecto,
  updateProyecto,
  deleteProyecto,
  fetchMovimientos,
  addMovimiento,
  updateMovimiento,
  deleteMovimiento,
  fetchPresupuestos,
  addPresupuesto,
  updatePresupuesto,
  deletePresupuesto,
  fetchEmpleados,
  addEmpleado,
  updateEmpleado,
  deleteEmpleado,
  fetchMateriales,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  fetchOrdenes,
} from '../store';

// Compatibility hook: maps Redux state to old useErp() interface
// This allows gradual migration without breaking existing components
export const useErpRedux = () => {
  const dispatch = useDispatch();

  // State
  const { list: proyectos, status: proyectosStatus, error: proyectosError } = useSelector((state: any) => state.proyectos);
  const { list: movimientos, status: movimientosStatus, error: movimientosError } = useSelector((state: any) => state.movimientos);
  const { list: presupuestos, status: presupuestosStatus, error: presupuestosError } = useSelector((state: any) => state.presupuestos);
  const { list: empleados, status: empleadosStatus, error: empleadosError } = useSelector((state: any) => state.empleados);
  const { list: materiales, status: materialesStatus, error: materialesError } = useSelector((state: any) => state.materiales);
  const { list: ordenes, status: ordenesStatus, error: ordenesError } = useSelector((state: any) => state.ordenes);

  // Actions with proper binding
  const addProyectoAction = async (p: any) => dispatch(addProyecto(p)).unwrap();
  const updateProyectoAction = async (id: string, patch: any) => dispatch(updateProyecto({ id, ...patch })).unwrap();
  const deleteProyectoAction = async (id: string) => dispatch(deleteProyecto(id)).unwrap();

  const addMovimientoAction = async (m: any) => dispatch(addMovimiento(m)).unwrap();
  const updateMovimientoAction = async (id: string, patch: any) => dispatch(updateMovimiento({ id, ...patch })).unwrap();
  const deleteMovimientoAction = async (id: string) => dispatch(deleteMovimiento(id)).unwrap();

  const addEmpleadoAction = async (e: any) => dispatch(addEmpleado(e)).unwrap();
  const updateEmpleadoAction = async (id: string, patch: any) => dispatch(updateEmpleado({ id, ...patch })).unwrap();
  const deleteEmpleadoAction = async (id: string) => dispatch(deleteEmpleado(id)).unwrap();

  const addMaterialAction = async (m: any) => dispatch(addMaterial(m)).unwrap();
  const updateMaterialAction = async (id: string, patch: any) => dispatch(updateMaterial({ id, ...patch })).unwrap();
  const deleteMaterialAction = async (id: string) => dispatch(deleteMaterial(id)).unwrap();

  const addPresupuestoAction = async (p: any) => dispatch(addPresupuesto(p)).unwrap();
  const updatePresupuestoAction = async (id: string, patch: any) => dispatch(updatePresupuesto({ id, ...patch })).unwrap();
  const deletePresupuestoAction = async (id: string) => dispatch(deletePresupuesto(id)).unwrap();

  return {
    proyectos,
    addProyecto: addProyectoAction,
    updateProyecto: updateProyectoAction,
    deleteProyecto: deleteProyectoAction,
    movimientos,
    addMovimiento: addMovimientoAction,
    updateMovimiento: updateMovimientoAction,
    deleteMovimiento: deleteMovimientoAction,
    presupuestos,
    addPresupuesto: addPresupuestoAction,
    updatePresupuesto: updatePresupuestoAction,
    deletePresupuesto: deletePresupuestoAction,
    empleados,
    addEmpleado: addEmpleadoAction,
    updateEmpleado: updateEmpleadoAction,
    deleteEmpleado: deleteEmpleadoAction,
    materiales,
    addMaterial: addMaterialAction,
    updateMaterial: updateMaterialAction,
    deleteMaterial: deleteMaterialAction,
    ordenes,
    addOrden: async (o: any) => dispatch(addOrden(o)).unwrap(),
    updateOrden: async (id: string, estado: string) => dispatch(updateOrden({ id, estado })).unwrap(),
    // Compatibility for old properties
    view: 'dashboard',
    setView: () => {},
    user: null,
    initializing: false,
    allowedViews: [],
    authError: '',
    signIn: async () => {},
    signUp: async () => {},
    signInWithGoogle: async () => {},
    logout: () => {},
    isOnline: true,
  };
};

export default useErpRedux;