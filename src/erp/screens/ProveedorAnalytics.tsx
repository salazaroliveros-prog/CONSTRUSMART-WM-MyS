import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { safeLogger } from '@/lib/safeLogger';
import { fmtQ, fmtPct, calculateSupplierPerformance, getSupplierRecommendations, identifySupplierRisks, CATEGORIA_LABEL } from '../utils';
import { BarChart, Donut, Progress } from '../components/Charts';
import { TrendingUp, TrendingDown, AlertTriangle, Award, Star, Truck, Shield, Download, RefreshCw, Loader2, SearchX } from 'lucide-react';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, CARD_TITLE } from '../ui';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

const tendencias = {
  mejorando: { icon: TrendingUp, color: 'text-emerald-500', label: 'Mejorando' },
  estable: { icon: RefreshCw, color: 'text-blue-500', label: 'Estable' },
  empeorando: { icon: TrendingDown, color: 'text-red-500', label: 'Empeorando' },
};

const ProveedorAnalytics: React.FC = () => {
  const { proveedores, ordenes, proyectos } = useErp();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [filtroProyecto, setFiltroProyecto] = useState<string>('todos');
  const [selectedProveedor, setSelectedProveedor] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const metrics = useMemo(() => {
    const ordenesFiltradas = filtroProyecto === 'todos' 
      ? ordenes 
      : ordenes.filter(o => o.proyectoId === filtroProyecto);

    return proveedores.map(prov => 
      calculateSupplierPerformance(prov, ordenesFiltradas)
    );
  }, [proveedores, ordenes, filtroProyecto]);

  const metricsFiltradas = useMemo(() => {
    if (filtroCategoria === 'todos') return metrics;
    return metrics.filter(m => m.categoria === filtroCategoria);
  }, [metrics, filtroCategoria]);

  const recomendaciones = useMemo(() => 
    getSupplierRecommendations(metricsFiltradas, filtroCategoria === 'todos' ? undefined : filtroCategoria),
    [metricsFiltradas, filtroCategoria]
  );

  const riesgos = useMemo(() => 
    identifySupplierRisks(metricsFiltradas),
    [metricsFiltradas]
  );

  const selectedMetrics = selectedProveedor 
    ? metricsFiltradas.find(m => m.proveedorId === selectedProveedor)
    : null;

  const categoriasDisponibles = useMemo(() => {
    const cats = new Set(proveedores.map(p => p.categoria));
    return Array.from(cats);
  }, [proveedores]);

  const avgScore = useMemo(() => {
    if (metricsFiltradas.length === 0) return 0;
    return metricsFiltradas.reduce((sum, m) => sum + m.puntajeGeneral, 0) / metricsFiltradas.length;
  }, [metricsFiltradas]);

  const topSupplier = useMemo(() => {
    if (metricsFiltradas.length === 0) return null;
    return [...metricsFiltradas].sort((a, b) => b.puntajeGeneral - a.puntajeGeneral)[0];
  }, [metricsFiltradas]);

  const categoriaDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    metricsFiltradas.forEach(m => {
      dist[m.categoria] = (dist[m.categoria] || 0) + 1;
    });
    return Object.entries(dist).map(([cat, count], i) => ({
      label: CATEGORIA_LABEL[cat as keyof typeof CATEGORIA_LABEL] || cat,
      value: count,
      color: COLORS[i % COLORS.length],
    }));
  }, [metricsFiltradas]);

  const performanceByCategory = useMemo(() => {
    const catScores: Record<string, { total: number; count: number }> = {};
    metricsFiltradas.forEach(m => {
      if (!catScores[m.categoria]) catScores[m.categoria] = { total: 0, count: 0 };
      catScores[m.categoria].total += m.puntajeGeneral;
      catScores[m.categoria].count += 1;
    });
    return Object.entries(catScores).map(([cat, data]) => ({
      categoria: CATEGORIA_LABEL[cat as keyof typeof CATEGORIA_LABEL] || cat,
      avgScore: data.total / data.count,
      count: data.count,
    })).sort((a, b) => b.avgScore - a.avgScore);
  }, [metricsFiltradas]);

  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      const exportData = metricsFiltradas.map(m => ({
        'Proveedor': m.proveedorNombre,
        'Categoría': CATEGORIA_LABEL[m.categoria as keyof typeof CATEGORIA_LABEL] || m.categoria,
        'Puntaje General': m.puntajeGeneral,
        'Puntaje Entrega': Math.round(m.puntajeEntrega),
        'Puntaje Calidad': Math.round(m.puntajeCalidad),
        'Puntaje Costo': Math.round(m.puntajeCosto),
        'Puntaje Respuesta': Math.round(m.puntajeRespuesta),
        'Total Órdenes': m.totalOrdenes,
        'Monto Total': m.montoTotal,
        'Tendencia': m.tendencia,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Proveedores');

      const risksSheet = XLSX.utils.json_to_sheet(riesgos.map(r => ({
        'Proveedor': r.proveedor,
        'Riesgo': r.riesgo,
        'Nivel': r.nivel,
      })));
      XLSX.utils.book_append_sheet(workbook, risksSheet, 'Riesgos');

      const recsSheet = XLSX.utils.json_to_sheet(recomendaciones.map(r => ({
        'Proveedor': r.proveedor,
        'Razón': r.razon,
        'Puntaje': r.puntaje,
      })));
      XLSX.utils.book_append_sheet(workbook, recsSheet, 'Recomendaciones');

      XLSX.writeFile(workbook, `analytics-proveedores-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      safeLogger.error(new Error('Error exporting: ' + (error as Error).message));
    } finally {
      setExporting(false);
    }
  }, [metricsFiltradas, riesgos, recomendaciones, exporting]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-3 lg:p-4 max-w-[1600px] mx-auto space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-black text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" aria-hidden="true" />
          {t('proveedor_analytics.titulo', 'Analytics de Proveedores')}
        </h1>
        <div className="flex flex-wrap gap-2">
          <select
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm"
          >
            <option value="todos">{t('proveedor_analytics.todos_proyectos', 'Todos los Proyectos')}</option>
            {proyectos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-input bg-background text-sm"
          >
            <option value="todos">{t('proveedor_analytics.todas_categorias', 'Todas las Categorías')}</option>
            {categoriasDisponibles.map(cat => (
              <option key={cat} value={cat}>{CATEGORIA_LABEL[cat as keyof typeof CATEGORIA_LABEL] || cat}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={exporting || metricsFiltradas.length === 0}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? t('proveedor_analytics.exportando', 'Exportando...') : t('proveedor_analytics.exportar', 'Exportar')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" aria-hidden="true" />
            <span className="text-xs opacity-80">{t('proveedor_analytics.promedio_general', 'Promedio General')}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{Math.round(avgScore)}</div>
          <div className="text-xs opacity-80 mt-1">{t('proveedor_analytics.puntaje_desempeno', 'Puntaje de desempeño')}</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" aria-hidden="true" />
            <span className="text-xs opacity-80">{t('proveedor_analytics.mejor_proveedor', 'Mejor Proveedor')}</span>
          </div>
          <div className="text-lg sm:text-xl font-bold truncate">{topSupplier?.proveedorNombre || t('proveedor_analytics.na', 'N/A')}</div>
          <div className="text-xs opacity-80 mt-1">{topSupplier ? `${topSupplier.puntajeGeneral} pts` : ''}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" aria-hidden="true" />
            <span className="text-xs opacity-80">{t('proveedor_analytics.total_proveedores', 'Total Proveedores')}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{metricsFiltradas.length}</div>
          <div className="text-xs opacity-80 mt-1">{t('proveedor_analytics.con_analisis', 'Con análisis')}</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" aria-hidden="true" />
            <span className="text-xs opacity-80">{t('proveedor_analytics.alertas_riesgo', 'Alertas de Riesgo')}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold">{riesgos.length}</div>
          <div className="text-xs opacity-80 mt-1">{t('proveedor_analytics.proveedores_criticos', 'Proveedores críticos')}</div>
        </div>
      </div>

      {riesgos.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" aria-hidden="true" />
            <h3 className="font-semibold text-red-700 dark:text-red-400 text-sm sm:text-base">{t('proveedor_analytics.riesgo_detectado', 'Proveedores con Riesgo Detectado')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {riesgos.slice(0, 6).map((riesgo, i) => (
              <div key={i} className="bg-card dark:bg-red-950/30 rounded-lg p-2 border border-red-200 dark:border-red-800">
                <div className="font-medium text-sm text-red-700 dark:text-red-300">{riesgo.proveedor}</div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">{riesgo.riesgo}</div>
                <div className={`text-xs font-bold mt-1 ${
                  riesgo.nivel === 'alto' ? 'text-red-600' : 
                  riesgo.nivel === 'medio' ? 'text-amber-600' : 'text-yellow-600'
                }`}>
                  {t('proveedor_analytics.nivel', 'Nivel')}: {riesgo.nivel.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recomendaciones.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" aria-hidden="true" />
            <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm sm:text-base">{t('proveedor_analytics.recomendados', 'Proveedores Recomendados')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {recomendaciones.map((rec, i) => (
              <div key={i} className="bg-card dark:bg-emerald-950/30 rounded-lg p-2 border border-emerald-200 dark:border-emerald-800">
                <div className="font-medium text-sm text-emerald-700 dark:text-emerald-300">{rec.proveedor}</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{rec.razon}</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">{rec.puntaje} pts</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
          <h3 className="font-semibold text-foreground mb-3 text-sm sm:text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" aria-hidden="true" />
            {t('proveedor_analytics.distribucion_categoria', 'Distribución por Categoría')}
          </h3>
          <div className="h-48 sm:h-64">
            <Donut 
              data={categoriaDistribution}
            />
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
          <h3 className="font-semibold text-foreground mb-3 text-sm sm:text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            {t('proveedor_analytics.desempeno_categoria', 'Desempeño por Categoría')}
          </h3>
          <div className="h-48 sm:h-64">
            <BarChart 
              data={performanceByCategory.map((cat, i) => ({
                label: cat.categoria.substring(0, 10),
                value: cat.avgScore,
                color: `hsl(var(--${['primary', 'success', 'warning', 'info'][i % 4]}))`,
              }))}
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
        <h3 className="font-semibold text-foreground mb-3 text-sm sm:text-base flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" aria-hidden="true" />
          {t('proveedor_analytics.ranking', 'Ranking de Proveedores')}
        </h3>
        {metricsFiltradas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <SearchX className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
            <p className="text-sm font-medium">{t('proveedor_analytics.empty_filtros', 'No hay proveedores con los filtros actuales')}</p>
            <p className="text-xs mt-1">{t('proveedor_analytics.empty_subtext', 'Ajusta los filtros para ver resultados')}</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 font-medium text-muted-foreground" scope="col">{t('proveedor_analytics.col_proveedor', 'Proveedor')}</th>
                <th className="text-left p-2 font-medium text-muted-foreground" scope="col">{t('proveedor_analytics.col_categoria', 'Categoría')}</th>
                <th className="text-center p-2 font-medium text-muted-foreground" scope="col">{t('proveedor_analytics.col_general', 'General')}</th>
                <th className="text-center p-2 font-medium text-muted-foreground" scope="col">{t('proveedor_analytics.col_entrega', 'Entrega')}</th>
                <th className="text-center p-2 font-medium text-muted-foreground" scope="col">{t('proveedor_analytics.col_calidad', 'Calidad')}</th>
                <th className="text-center p-2 font-medium text-muted-foreground" scope="col">{t('proveedor_analytics.col_ordenes', 'Órdenes')}</th>
                <th className="text-center p-2 font-medium text-muted-foreground" scope="col">{t('proveedor_analytics.col_monto', 'Monto')}</th>
                <th className="text-center p-2 font-medium text-muted-foreground" scope="col">{t('proveedor_analytics.col_tendencia', 'Tendencia')}</th>
              </tr>
            </thead>
            <tbody>
      {metricsFiltradas
        .sort((a, b) => b.puntajeGeneral - a.puntajeGeneral)
        .slice(0, 10)
        .map((metric) => {
          const TendenciaIcon = tendencias[metric.tendencia].icon;
          return (
            <tr 
              key={metric.proveedorId} 
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedProveedor(metric.proveedorId); } }}
              className={`border-b border-border cursor-pointer hover:bg-muted/50 ${selectedProveedor === metric.proveedorId ? 'bg-muted' : ''}`}
              onClick={() => setSelectedProveedor(metric.proveedorId)}
            >
                      <td className="p-2 font-medium">{metric.proveedorNombre}</td>
                      <td className="p-2 text-muted-foreground">{CATEGORIA_LABEL[metric.categoria as keyof typeof CATEGORIA_LABEL] || metric.categoria}</td>
                      <td className="p-2 text-center">
                        <span className={`font-bold ${metric.puntajeGeneral >= 80 ? 'text-emerald-500' : metric.puntajeGeneral >= 60 ? 'text-blue-500' : 'text-red-500'}`}>
                          {metric.puntajeGeneral}
                        </span>
                      </td>
                      <td className="p-2 text-center">{fmtPct(metric.puntajeEntrega)}</td>
                      <td className="p-2 text-center">{fmtPct(metric.puntajeCalidad)}</td>
                      <td className="p-2 text-center">{metric.totalOrdenes}</td>
                      <td className="p-2 text-center">{fmtQ(metric.montoTotal)}</td>
                      <td className="p-2 text-center">
                        <TendenciaIcon className={`w-4 h-4 inline ${tendencias[metric.tendencia].color}`} aria-hidden="true" />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {selectedMetrics && (
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
          <h3 className="font-semibold text-foreground mb-3 text-sm sm:text-base flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-500" aria-hidden="true" />
            {t('proveedor_analytics.detalle', 'Detalle')}: {selectedMetrics.proveedorNombre}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-violet-500">{selectedMetrics.puntajeGeneral}</div>
              <div className="text-xs text-muted-foreground">{t('proveedor_analytics.puntaje_general', 'Puntaje General')}</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-emerald-500">{fmtPct(selectedMetrics.puntajeEntrega)}</div>
              <div className="text-xs text-muted-foreground">{t('proveedor_analytics.entrega_tiempo', 'Entrega a Tiempo')}</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-500">{fmtPct(selectedMetrics.puntajeCalidad)}</div>
              <div className="text-xs text-muted-foreground">{t('proveedor_analytics.calidad', 'Calidad')}</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-amber-500">{selectedMetrics.totalOrdenes}</div>
              <div className="text-xs text-muted-foreground">{t('proveedor_analytics.total_ordenes', 'Total Órdenes')}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('proveedor_analytics.confiabilidad_entrega', 'Confiabilidad de Entrega')}</span>
                <span className="font-medium">{fmtPct(selectedMetrics.puntajeEntrega)}</span>
              </div>
              <Progress value={selectedMetrics.puntajeEntrega} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('proveedor_analytics.calidad_servicio', 'Calidad de Servicio')}</span>
                <span className="font-medium">{fmtPct(selectedMetrics.puntajeCalidad)}</span>
              </div>
              <Progress value={selectedMetrics.puntajeCalidad} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('proveedor_analytics.competitividad_costos', 'Competitividad de Costos')}</span>
                <span className="font-medium">{fmtPct(selectedMetrics.puntajeCosto)}</span>
              </div>
              <Progress value={selectedMetrics.puntajeCosto} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('proveedor_analytics.capacidad_respuesta', 'Capacidad de Respuesta')}</span>
                <span className="font-medium">{fmtPct(selectedMetrics.puntajeRespuesta)}</span>
              </div>
              <Progress value={selectedMetrics.puntajeRespuesta} className="h-2" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedorAnalytics;
