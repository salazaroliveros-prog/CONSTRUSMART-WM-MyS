import React, { useMemo } from 'react';
import { useErp } from '../store';
import { Layout, TrendingUp, CheckCircle2, Clock, BarChart3, Star, Award, Zap } from 'lucide-react';
import { Progress } from './Charts';

const PlantillasDashboard: React.FC = () => {
  const { plantillas } = useErp();
  const plantillasActivas = plantillas.filter(p => p.activa);

  const metricasGlobales = useMemo(() => {
    const totalPlantillas = plantillasActivas.length;
    const totalUsos = plantillasActivas.reduce((sum, p) => sum + (p.usosCount || 0), 0);
    const avgExito = plantillasActivas.length > 0
      ? plantillasActivas.reduce((sum, p) => sum + (p.metricas?.exitoPromedio || 50), 0) / plantillasActivas.length
      : 0;
    const avgAvance = plantillasActivas.length > 0
      ? plantillasActivas.reduce((sum, p) => sum + (p.metricas?.avgAvanceProyectos || 0), 0) / plantillasActivas.length
      : 0;
    const avgMargen = plantillasActivas.length > 0
      ? plantillasActivas.reduce((sum, p) => sum + (p.metricas?.avgMargenProyectos || 0), 0) / plantillasActivas.length
      : 0;

    const porCategoria = plantillasActivas.reduce((acc, p) => {
      acc[p.categoria] = (acc[p.categoria] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const plantillasMasUsadas = [...plantillasActivas]
      .sort((a, b) => (b.usosCount || 0) - (a.usosCount || 0))
      .slice(0, 5);

    const plantillasRecientes = [...plantillasActivas]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const plantillasMejorExito = [...plantillasActivas]
      .filter(p => p.metricas?.exitoPromedio)
      .sort((a, b) => (b.metricas?.exitoPromedio || 0) - (a.metricas?.exitoPromedio || 0))
      .slice(0, 5);

    return {
      totalPlantillas,
      totalUsos,
      avgExito,
      avgAvance,
      avgMargen,
      porCategoria,
      plantillasMasUsadas,
      plantillasRecientes,
      plantillasMejorExito,
    };
  }, [plantillasActivas]);

  const getExitoColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30';
    if (score >= 60) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
    return 'text-red-600 bg-red-50 dark:bg-red-950/30';
  };

  if (plantillasActivas.length === 0) {
    return (
      <div className="p-6 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
        <Layout className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No hay plantillas para mostrar en el dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Layout className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Plantillas</span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{metricasGlobales.totalPlantillas}</div>
        </div>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Total Usos</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{metricasGlobales.totalUsos}</div>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Éxito Promedio</span>
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{Math.round(metricasGlobales.avgExito)}%</div>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Margen Promedio</span>
          </div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{Math.round(metricasGlobales.avgMargen)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Plantillas por Categoría</span>
          </div>
          <div className="space-y-2">
            {Object.entries(metricasGlobales.porCategoria).map(([categoria, count]) => (
              <div key={categoria} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-600 dark:text-slate-400">{categoria}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-4 rounded-lg ${getExitoColor(metricasGlobales.avgExito)}`}>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5" />
            <span className="font-semibold">Índice de Éxito Global</span>
          </div>
          <div className="text-3xl font-bold mb-2">{Math.round(metricasGlobales.avgExito)}%</div>
          <Progress value={metricasGlobales.avgExito} className="mb-2" />
          <div className="text-xs text-muted-foreground">
            Basado en {metricasGlobales.totalPlantillas} plantillas activas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Más Usadas</span>
          </div>
          <div className="space-y-2">
            {metricasGlobales.plantillasMasUsadas.map((plantilla) => (
              <div key={plantilla.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400 truncate flex-1 mr-2">{plantilla.nombre}</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{plantilla.usosCount || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Recientes</span>
          </div>
          <div className="space-y-2">
            {metricasGlobales.plantillasRecientes.map((plantilla) => (
              <div key={plantilla.id} className="text-sm">
                <div className="text-slate-600 dark:text-slate-400 truncate">{plantilla.nombre}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(plantilla.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-slate-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Mejor Éxito</span>
          </div>
          <div className="space-y-2">
            {metricasGlobales.plantillasMejorExito.map((plantilla) => (
              <div key={plantilla.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400 truncate flex-1 mr-2">{plantilla.nombre}</span>
                <span className={`font-semibold ${plantilla.metricas?.exitoPromedio && plantilla.metricas.exitoPromedio >= 80 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                  {Math.round(plantilla.metricas?.exitoPromedio || 0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantillasDashboard;
