export const estadoColor = (p: { avanceFisico: number; avanceFinanciero: number; estado: string }) => {
  const dev = p.avanceFinanciero - p.avanceFisico;
  if (p.estado === 'planeacion') return '#94a3b8';
  if (dev > 8) return '#ef4444';
  if (dev > 3) return '#fbbf24';
  return '#10b981';
};

export const estadoBadgeClass = (estado: string) => {
  if (estado === 'ejecucion') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (estado === 'pausado') return `bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:text-amber-400`;
  if (estado === 'finalizado') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  return 'bg-muted/10 text-muted-foreground dark:text-muted-foreground';
};
