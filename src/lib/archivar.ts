import { safeLogger } from '@/lib/safeLogger';

const MS_6_MESES = 180 * 24 * 60 * 60 * 1000;

export function proyectosParaArchivar(
  proyectos: Array<{ id: string; estado: string; fechaFin?: string; updatedAt?: string }>
): string[] {
  const ahora = Date.now();
  return proyectos
    .filter(p => p.estado === 'finalizado')
    .filter(p => {
      const fechaReferencia = p.fechaFin || p.updatedAt || '';
      if (!fechaReferencia) return false;
      const fechaFin = new Date(fechaReferencia).getTime();
      return ahora - fechaFin > MS_6_MESES;
    })
    .map(p => p.id);
}

export function archivarProyectos(
  proyectos: Array<{ id: string; estado: string; fechaFin?: string; updatedAt?: string }>,
  proyectosAVolverAPlaneacion: string[]
): Array<{ id: string; estado: string; etapa?: string }> {
  return proyectosAVolverAPlaneacion.map(id => ({
    id,
    estado: 'planeacion',
    etapa: 'planificacion',
  }));
}

export function shouldRunArchivado(lastRun?: string): boolean {
  if (!lastRun) return true;
  const lastRunTime = new Date(lastRun).getTime();
  const ahora = Date.now();
  const UN_DIA = 24 * 60 * 60 * 1000;
  return ahora - lastRunTime > UN_DIA;
}

export function getArchivadoTimestamp(): string {
  return new Date().toISOString();
}