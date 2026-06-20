import React, { useMemo } from 'react';
import { useErp } from '../store';
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertCircle, Activity, Target, Zap } from 'lucide-react';
import { Progress } from './Charts';

const PlantillaAnalytics: React.FC<{ plantillaId: string }> = ({ plantillaId }) => {
  const { plantillas } = useErp();
  const plantilla = plantillas.find(p => p.id === plantillaId);

  if (!plantilla || !plantilla.metricas) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No hay datos de análisis disponibles</p>
      </div>
    );
  }

  const m = plantilla.metricas;
  const totalProyectos = m.proyectoIds?.length || 0;

  const getExitoColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30';
    if (score >= 60) return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30';
    return 'text-red-600 bg-red-50 dark:bg-red-950/30';
  };

  const getExitoLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Regular';
    return 'Bajo';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Proyectos</span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalProyectos}</div>
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Completados</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{m.proyectosCompletados}</div>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Activos</span>
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{m.proyectosActivos}</div>
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Pausados</span>
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{m.proyectosPausados}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`p-4 rounded-lg ${getExitoColor(m.exitoPromedio || 50)}`}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5" />
            <span className="font-semibold">Índice de Éxito</span>
          </div>
          <div className="text-3xl font-bold mb-1">{Math.round(m.exitoPromedio || 50)}%</div>
          <div className="text-xs font-medium">{getExitoLabel(m.exitoPromedio || 50)}</div>
          <Progress value={m.exitoPromedio || 50} className="mt-2" />
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Avance Promedio</span>
          </div>
          <div className="text-3xl font-bold text-slate-700 dark:text-slate-300 mb-1">
            {Math.round(m.avgAvanceProyectos || 0)}%
          </div>
          <Progress value={m.avgAvanceProyectos || 0} className="mt-2" />
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-700 dark:text-orange-300">Margen Promedio</span>
          </div>
          <div className="text-3xl font-bold text-orange-700 dark:text-orange-300 mb-1">
            {Math.round(m.avgMargenProyectos || 0)}%
          </div>
          <Progress value={m.avgMargenProyectos || 0} className="mt-2" />
        </div>
      </div>

      {m.ultimaUso && (
        <div className="text-xs text-muted-foreground text-center">
          Último uso: {new Date(m.ultimaUso).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default PlantillaAnalytics;