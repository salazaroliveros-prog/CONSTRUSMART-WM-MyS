import { useSelector } from 'react-redux';

export const useProyectoMovimientos = (proyectoId: string) => {
  const { list: movimientos } = useSelector((state) => state.movimientos);

  const movimientosProyecto = movimientos.filter((m) => m.proyectoId === proyectoId);
  const ingresos = movimientosProyecto.filter((m) => m.tipo === 'ingreso');
  const gastos = movimientosProyecto.filter((m) => m.tipo === 'gasto');
  const totalIngresos = ingresos.reduce((sum, m) => sum + m.monto, 0);
  const totalGastos = gastos.reduce((sum, m) => sum + m.monto, 0);

  return {
    movimientosProyecto,
    ingresos,
    gastos,
    totalIngresos,
    totalGastos,
    balance: totalIngresos - totalGastos,
  };
};