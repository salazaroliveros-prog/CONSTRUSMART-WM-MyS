import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../../store';
import { AlertTriangle, TrendingUp, Shield } from 'lucide-react';

interface SeguimientoRiesgosPanelProps {
  proyectoId?: string;
}

const LEVEL_LABEL: Record<number, string> = {
  1: 'Bajo',
  2: 'Medio',
  3: 'Alto',
  4: 'Crítico',
  5: 'Extremo',
};

const SeguimientoRiesgosPanel: React.FC<SeguimientoRiesgosPanelProps> = ({ proyectoId }) => {
  const { t } = useTranslation();
  const { riesgos, proyectos } = useErp();

  const filtered = useMemo(() => {
    const source = proyectoId
      ? riesgos.filter((r) => r.proyectoId === proyectoId)
      : riesgos;
    return source.filter((r) => r.estado !== 'mitigado');
  }, [riesgos, proyectoId]);

  const riesgoPorProyecto = useMemo(() => {
    const mapa = new Map<string, { nombre: string; count: number; maxScore: number }>();
    for (const r of filtered) {
      const proyecto = proyectos.find((p) => p.id === r.proyectoId);
      const nombre = proyecto?.nombre || 'Sin proyecto';
      const score = (r.probabilidad || 0) + (r.impacto || 0);
      const prev = mapa.get(r.proyectoId);
      if (prev) {
        prev.count += 1;
        prev.maxScore = Math.max(prev.maxScore, score);
      } else {
        mapa.set(r.proyectoId, { nombre, count: 1, maxScore: score });
      }
    }
    return mapa;
  }, [filtered, proyectos]);

  const topRisks = useMemo(() => {
    return [...filtered]
      .map((r) => ({
        ...r,
        score: (r.probabilidad || 0) + (r.impacto || 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [filtered]);

  const stats = useMemo(() => {
    const critico = filtered.filter((r) => (r.probabilidad || 0) >= 4 && (r.impacto || 0) >= 4).length;
    const alto = filtered.filter((r) => {
      const s = (r.probabilidad || 0) + (r.impacto || 0);
      return s >= 6 && s < 8;
    }).length;
    const total = filtered.length;
    return { critico, alto, total };
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <Shield className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">
          {t('riesgos.sin_riesgos', 'Sin riesgos activos para este proyecto')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">
            {t('riesgos.total_activos', 'Riesgos activos')}
          </p>
          <p className="text-xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">
            {t('riesgos.alto', 'Alto impacto')}
          </p>
          <p className="text-xl font-bold text-orange-500">{stats.alto}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-1">
            {t('riesgos.critico', 'Crítico')}
          </p>
          <p className="text-xl font-bold text-red-500">{stats.critico}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('riesgos.riesgos_por_proyecto', 'Riesgos por proyecto')}
        </h3>
        <div className="space-y-2">
          {Array.from(riesgoPorProyecto.values()).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-foreground">{item.nombre}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {item.count} {t('riesgos.riesgos', 'riesgos')}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    item.maxScore >= 8
                      ? 'bg-red-100 text-red-700'
                      : item.maxScore >= 6
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {LEVEL_LABEL[Math.min(item.maxScore, 5)] || 'Bajo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('riesgos.top_riesgos', 'Top 5 riesgos activos')}
        </h3>
        <div className="space-y-2">
          {topRisks.map((r) => (
            <div
              key={r.id}
              className="flex items-start justify-between p-2 rounded-lg bg-muted/30"
            >
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {r.descripcion}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('riesgos.probabilidad', 'Probabilidad')}: {r.probabilidad} /{' '}
                    {t('riesgos.impacto', 'Impacto')}: {r.impacto}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                  r.score >= 8
                    ? 'bg-red-100 text-red-700'
                    : r.score >= 6
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {r.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeguimientoRiesgosPanel;
