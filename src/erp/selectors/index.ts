export const selectProyectosByStatus = (status: string) => (proyectos: any[]) =>
  proyectos.filter((p: any) => p.estado === status);

export const selectActiveProyectos = (proyectos: any[]) =>
  proyectos.filter((p: any) => p.estado === 'ejecucion');

export const selectProyectosBudgetStatus = (proyectos: any[]) =>
  proyectos.map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    presupuestoTotal: p.presupuestoTotal,
    avanceFinanciero: p.avanceFinanciero,
    sobrePresupuesto: p.avanceFinanciero > p.presupuestoTotal,
  }));