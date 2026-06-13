import { useErp } from '../store';

export const useProyectoMovimientos = (proyectoId: string) => {
  const { movimientos } = useErp();

  const movimientosProyecto = movimientos.filter((m: any) => m.proyectoId === proyectoId);
  const ingresos = movimientosProyecto.filter((m: any) => m.tipo === 'ingreso');
  const gastos = movimientosProyecto.filter((m: any) => m.tipo === 'gasto');
  const totalIngresos = ingresos.reduce((sum: number, m: any) => sum + (m.monto || 0), 0);
  const totalGastos = gastos.reduce((sum: number, m: any) => sum + (m.monto || 0), 0);

  return {
    movimientosProyecto,
    ingresos,
    gastos,
    totalIngresos,
    totalGastos,
    balance: totalIngresos - totalGastos,
  };
};