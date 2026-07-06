import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonWeather } from '@/components/SkeletonScreens';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { 
  Cloud, Sun, CloudRain, Wind, Thermometer, Droplets, AlertTriangle, 
  Calendar, RefreshCw, Settings, MapPin, Clock, Activity, Shield, 
  ChevronDown, ChevronUp, Zap, TrendingUp, TrendingDown, CheckCircle, 
  X, Eye, EyeOff, Bell, BellOff, ExternalLink, Download
} from 'lucide-react';
import { 
  getWeatherIconUrl, 
  formatWeatherDescription, 
  isWeatherDataStale,
  getCompleteWeatherData,
  calculateWeatherImpact,
  calculateConstructionMetrics,
  calculateSchedulingWindows,
  getHistoricalWeatherImpact,
  saveWeatherToSupabase,
  loadWeatherFromSupabase
} from '../services/weatherService';
import { CARD, CARD_TITLE, SECTION_TITLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER, COLOR_INFO, COLOR_PRIMARY, BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_ICON, KPI_CARD } from '../ui';
import { toast } from 'sonner';
import { todayISO } from '../utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProyectoWeather, ConstructionMetrics, SchedulingWindow, WeatherImpact, WeatherHistoryItem } from '../store/schemas/weather';

const Weather: React.FC = () => {
  const { t } = useTranslation();
  const { 
    proyectos, 
    selectedProyectoId, 
    setSelectedProyectoId, 
    proyectoWeather, 
    updateProyectoWeather,
    addNotificacion 
  } = useErp();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [showDetails, setShowDetails] = useState(true);
  const [showScheduling, setShowScheduling] = useState(true);
  const [showConstruction, setShowConstruction] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState<'low' | 'medium' | 'high' | 'critical'>('high');

  useEffect(() => { setLoading(false); }, []);

  const proyecto = selectedProyectoId ? proyectos.find(p => p.id === selectedProyectoId) : proyectos[0];
  const weather = proyecto ? proyectoWeather.find(w => w.proyectoId === proyecto.id) : undefined;

  const refreshWeather = useCallback(async () => {
    if (!proyecto || !(proyecto.lat && proyecto.lng)) {
      toast.error(t('weather.no_coordinates', 'El proyecto no tiene coordenadas configuradas'));
      return;
    }

    setRefreshing(true);
    try {
      const weatherData = await getCompleteWeatherData(proyecto.lat, proyecto.lng, proyecto.ubicacion);
      if (weatherData) {
        const impact = calculateWeatherImpact(weatherData);
        const constructionMetrics = calculateConstructionMetrics(weatherData);
        const schedulingWindows = calculateSchedulingWindows(weatherData, 7);

        const historySnapshot: WeatherHistoryItem = {
          date: todayISO(),
          temp: weatherData.current.temp,
          tempMin: Math.min(...weatherData.forecast.slice(0, 4).map(f => f.main.temp_min)),
          tempMax: Math.max(...weatherData.forecast.slice(0, 4).map(f => f.main.temp_max)),
          humidity: weatherData.current.humidity,
          windSpeed: weatherData.current.wind_speed,
          condition: weatherData.current.weather[0]?.main || 'Unknown',
          icon: weatherData.current.weather[0]?.icon || '01d',
          precipitation: weatherData.forecast.slice(0, 4).reduce((sum, f) => sum + (f.rain?.['3h'] || 0), 0),
          impactScore: impact.score,
          impactLevel: impact.level,
        };

        updateProyectoWeather(proyecto.id, weatherData, {
          ...impact,
          constructionMetrics,
          schedulingWindows,
          history: [historySnapshot],
          lastUpdated: new Date().toISOString()
        });

        await saveWeatherToSupabase(proyecto.id, weatherData, impact, constructionMetrics, schedulingWindows, [historySnapshot]);

        if (impact.level === 'critical' || impact.level === 'high') {
          addNotificacion('general', `Alerta climática: ${impact.level}`, `${impact.factors.length} factores adversos en ${proyecto.nombre}`, proyecto.id);
        }

        toast.success(t('weather.updated', 'Datos climáticos actualizados'));
      }
    } catch (error) {
      console.error('Error refreshing weather:', error);
      toast.error(t('weather.error_refresh', 'Error al actualizar datos climáticos'));
    } finally {
      setRefreshing(false);
    }
  }, [proyecto, updateProyectoWeather, addNotificacion, t]);

  useEffect(() => {
    if (autoRefresh && weather?.weatherData && isWeatherDataStale(weather.weatherData, 60)) {
      refreshWeather();
    }
  }, [weather, autoRefresh, refreshWeather]);

  useEffect(() => {
    const loadWeatherFromStorage = async () => {
      if (!proyecto?.id) return;
      
      try {
        const savedWeather = await loadWeatherFromSupabase(proyecto.id);
        if (savedWeather) {
          updateProyectoWeather(proyecto.id, savedWeather.weather_data, {
            ...savedWeather.impact,
            constructionMetrics: savedWeather.construction_metrics,
            schedulingWindows: savedWeather.scheduling_windows,
            history: savedWeather.history,
            lastUpdated: savedWeather.last_updated
          });
        }
      } catch (error) {
        console.error('Error loading weather from Supabase:', error);
      }
    };

    loadWeatherFromStorage();
  }, [proyecto?.id, updateProyectoWeather]);

  const currentWeather = weather?.weatherData?.current;
  const forecast = useMemo(() => weather?.weatherData?.forecast || [], [weather?.weatherData?.forecast]);
  const impact = weather?.impact;
  const metrics = weather?.constructionMetrics;
  const scheduling = useMemo(() => weather?.schedulingWindows || [], [weather?.schedulingWindows]);

  const groupedForecast = useMemo(() => {
    const days: Map<string, typeof forecast> = new Map();
    forecast.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().slice(0, 10);
      if (!days.has(date)) {
        days.set(date, []);
      }
      days.get(date)!.push(item);
    });
    return Array.from(days.values());
  }, [forecast]);

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getImpactBgColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'high': return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
    }
  };

  const getImpactIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      case 'high': return <Wind className="w-5 h-5" />;
      case 'medium': return <CloudRain className="w-5 h-5" />;
      default: return <Sun className="w-5 h-5" />;
    }
  };

  const getSuitabilityColor = (suitable: boolean) => {
    return suitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short' });
  }, []);

  const shouldAlert = (level: string) => {
    const levels = ['low', 'medium', 'high', 'critical'];
    return levels.indexOf(level) >= levels.indexOf(alertThreshold);
  };

  const handleKeyDown = (callback: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  const exportToPDF = useCallback(() => {
    if (!weather || !proyecto) return;

    const doc = new jsPDF();
    const title = `${t('weather.title', 'Clima y Condiciones Ambientales')} - ${proyecto.nombre}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`${t('weather.location', 'Ubicación')}: ${proyecto.ubicacion}`, 14, 30);
    doc.text(`${t('weather.last_update', 'Última actualización')}: ${weather.lastUpdated ? new Date(weather.lastUpdated).toLocaleString() : '-'}`, 14, 36);

    if (currentWeather) {
      const currentData = [
        [t('weather.temperature', 'Temperatura'), `${Math.round(currentWeather.temp)}°C`],
        [t('weather.feels_like', 'Sensación'), `${Math.round(currentWeather.feels_like)}°C`],
        [t('weather.humidity', 'Humedad'), `${currentWeather.humidity}%`],
        [t('weather.wind', 'Viento'), `${Math.round(currentWeather.wind_speed)} m/s`],
        [t('weather.visibility', 'Visibilidad'), `${Math.round(currentWeather.visibility / 1000)} km`],
      ];

      autoTable(doc, {
        startY: 44,
        head: [[t('weather.current_conditions', 'Condiciones Actuales'), '']],
        body: currentData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    if (impact) {
      const impactData = [
        [t('weather.level', 'Nivel'), t(`weather.level.${impact.level}`)],
        [t('weather.score', 'Puntuación'), `${impact.score}/100`],
        [t('weather.factors', 'Factores'), impact.factors.join(', ')],
        [t('weather.recommendations', 'Recomendaciones'), impact.recommendations.join(', ')],
      ];

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [[t('weather.impact_analysis', 'Análisis de Impacto'), '']],
        body: impactData,
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] },
      });
    }

    if (metrics) {
      const metricsData = [
        [t('weather.concrete_curing', 'Curado de Concreto'), metrics.concreteCuring.suitable ? t('weather.suitable', 'Adecuado') : t('weather.not_suitable', 'No adecuado')],
        [t('weather.workforce_safety', 'Seguridad de Mano de Obra'), t(`weather.heat_stress.${metrics.workforceSafety.heatStressRisk}`)],
        [t('weather.equipment_operation', 'Operación de Equipos'), metrics.equipmentOperation.cranes.suitable ? t('weather.suitable', 'Adecuado') : t('weather.not_suitable', 'No adecuado')],
        [t('weather.material_protection', 'Protección de Materiales'), metrics.materialProtection.protectionRequired ? t('weather.required', 'Requerido') : t('weather.not_required', 'No requerido')],
      ];

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [[t('weather.construction_metrics', 'Métricas de Construcción'), '']],
        body: metricsData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
      });
    }

    if (scheduling.length > 0) {
      const schedulingData = scheduling.map(window => [
        formatDate(window.date),
        window.suitable ? t('weather.suitable', 'Adecuado') : t('weather.not_suitable', 'No adecuado'),
        `${window.score}/100`,
        window.conditions.slice(0, 2).join(', '),
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [[t('weather.date', 'Fecha'), t('weather.suitability', 'Adecuado'), t('weather.score', 'Puntuación'), t('weather.conditions', 'Condiciones')]],
        body: schedulingData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
      });
    }

    doc.save(`weather-report-${proyecto.nombre}-${todayISO()}.pdf`);
    toast.success(t('weather.export_pdf_success', 'Reporte PDF exportado exitosamente'));
  }, [weather, proyecto, currentWeather, impact, metrics, scheduling, t, formatDate]);

  const exportToExcel = useCallback(() => {
    if (!weather || !proyecto) return;

    const workbook = XLSX.utils.book_new();

    const summaryData = [
      [t('weather.project', 'Proyecto'), proyecto.nombre],
      [t('weather.location', 'Ubicación'), proyecto.ubicacion],
      [t('weather.last_update', 'Última actualización'), weather.lastUpdated ? new Date(weather.lastUpdated).toLocaleString() : '-'],
    ];

    if (currentWeather) {
      summaryData.push(
        [t('weather.temperature', 'Temperatura'), `${Math.round(currentWeather.temp)}°C`],
        [t('weather.feels_like', 'Sensación'), `${Math.round(currentWeather.feels_like)}°C`],
        [t('weather.humidity', 'Humedad'), `${currentWeather.humidity}%`],
        [t('weather.wind', 'Viento'), `${Math.round(currentWeather.wind_speed)} m/s`],
        [t('weather.visibility', 'Visibilidad'), `${Math.round(currentWeather.visibility / 1000)} km`],
      );
    }

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, t('weather.summary', 'Resumen'));

    if (impact) {
      const impactData = [
        [t('weather.level', 'Nivel'), t(`weather.level.${impact.level}`)],
        [t('weather.score', 'Puntuación'), impact.score],
        [t('weather.factors', 'Factores'), ...impact.factors],
        [t('weather.recommendations', 'Recomendaciones'), ...impact.recommendations],
      ];
      const impactSheet = XLSX.utils.aoa_to_sheet(impactData);
      XLSX.utils.book_append_sheet(workbook, impactSheet, t('weather.impact', 'Impacto'));
    }

    if (metrics) {
      const metricsData = [
        [t('weather.concrete_curing', 'Curado de Concreto'), metrics.concreteCuring.suitable ? t('weather.suitable', 'Adecuado') : t('weather.not_suitable', 'No adecuado'), metrics.concreteCuring.tempRange, metrics.concreteCuring.humidityRange],
        [t('weather.workforce_safety', 'Seguridad de Mano de Obra'), t(`weather.heat_stress.${metrics.workforceSafety.heatStressRisk}`), `${Math.round(metrics.workforceSafety.heatIndex)}°F`, metrics.workforceSafety.workScheduleAdjustment],
        [t('weather.equipment_operation', 'Operación de Equipos'), '', '', ''],
        ['', t('weather.cranes', 'Grúas'), metrics.equipmentOperation.cranes.suitable ? t('weather.suitable', 'Adecuado') : t('weather.not_suitable', 'No adecuado'), metrics.equipmentOperation.cranes.reason],
        ['', t('weather.excavators', 'Excavadoras'), metrics.equipmentOperation.excavators.suitable ? t('weather.suitable', 'Adecuado') : t('weather.not_suitable', 'No adecuado'), metrics.equipmentOperation.excavators.reason],
        ['', t('weather.welding', 'Soldadura'), metrics.equipmentOperation.welding.suitable ? t('weather.suitable', 'Adecuado') : t('weather.not_suitable', 'No adecuado'), metrics.equipmentOperation.welding.reason],
        [t('weather.material_protection', 'Protección de Materiales'), metrics.materialProtection.protectionRequired ? t('weather.required', 'Requerido') : t('weather.not_required', 'No requerido'), t(`weather.urgency.${metrics.materialProtection.urgency}`), metrics.materialProtection.materialsToProtect.join(', ')],
      ];
      const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(workbook, metricsSheet, t('weather.metrics', 'Métricas'));
    }

    if (scheduling.length > 0) {
      const schedulingData = [
        [t('weather.date', 'Fecha'), t('weather.suitability', 'Adecuado'), t('weather.score', 'Puntuación'), t('weather.conditions', 'Condiciones'), t('weather.best_activities', 'Mejores Actividades'), t('weather.avoid_activities', 'Evitar')],
        ...scheduling.map(window => [
          formatDate(window.date),
          window.suitable ? t('weather.suitable', 'Adecuado') : t('weather.not_suitable', 'No adecuado'),
          window.score,
          window.conditions.join(', '),
          window.bestActivities.join(', '),
          window.avoidActivities.join(', '),
        ]),
      ];
      const schedulingSheet = XLSX.utils.aoa_to_sheet(schedulingData);
      XLSX.utils.book_append_sheet(workbook, schedulingSheet, t('weather.scheduling', 'Programación'));
    }

    XLSX.writeFile(workbook, `weather-report-${proyecto.nombre}-${todayISO()}.xlsx`);
    toast.success(t('weather.export_excel_success', 'Reporte Excel exportado exitosamente'));
  }, [weather, proyecto, currentWeather, impact, metrics, scheduling, t, formatDate]);

  if (loading) {
    return <SkeletonWeather />;
  }

  if (!proyecto) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        <div className="text-center py-16 text-muted-foreground">
          <Cloud className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{t('weather.no_project', 'No hay proyectos disponibles')}</p>
          <p className="text-sm">{t('weather.create_project', 'Crea un proyecto para ver datos climáticos')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-500" />
            {t('weather.title', 'Clima y Condiciones Ambientales')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {proyecto.nombre} · {proyecto.ubicacion}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedProyectoId || ''}
            onChange={(e) => setSelectedProyectoId(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-blue-400 bg-card"
          >
            {proyectos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <button
            onClick={refreshWeather}
            disabled={refreshing}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Refresh weather"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
          {weather?.weatherData && (
            <>
              <button
                onClick={exportToPDF}
                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Export to PDF"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={exportToExcel}
                className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                aria-label="Export to Excel"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>

      {!weather?.weatherData ? (
        <div className="text-center py-16 text-muted-foreground">
          <Cloud className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">{t('weather.no_data', 'No hay datos climáticos')}</p>
          <p className="text-sm mb-4">{t('weather.click_refresh', 'Haz clic en actualizar para obtener datos')}</p>
          <button
            onClick={refreshWeather}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {t('weather.refresh_now', 'Actualizar ahora')}
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KPI_CARD className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('weather.temperature', 'Temperatura')}</span>
                <Thermometer className="w-4 h-4 text-orange-500" aria-hidden="true" />
              </div>
              <div className="text-2xl font-bold">{Math.round(currentWeather?.temp || 0)}°C</div>
              <div className="text-xs text-muted-foreground">
                {t('weather.feels_like', 'Sensación')}: {Math.round(currentWeather?.feels_like || 0)}°C
              </div>
            </KPI_CARD>

            <KPI_CARD className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('weather.humidity', 'Humedad')}</span>
                <Droplets className="w-4 h-4 text-blue-500" aria-hidden="true" />
              </div>
              <div className="text-2xl font-bold">{currentWeather?.humidity || 0}%</div>
              <div className="text-xs text-muted-foreground">
                {t('weather.visibility', 'Visibilidad')}: {Math.round((currentWeather?.visibility || 0) / 1000)}km
              </div>
            </KPI_CARD>

            <KPI_CARD className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('weather.wind', 'Viento')}</span>
                <Wind className="w-4 h-4 text-teal-500" aria-hidden="true" />
              </div>
              <div className="text-2xl font-bold">{Math.round(currentWeather?.wind_speed || 0)} m/s</div>
              <div className="text-xs text-muted-foreground">
                {t('weather.direction', 'Dirección')}: {currentWeather?.wind_deg || 0}°
              </div>
            </KPI_CARD>

            <KPI_CARD className={`relative overflow-hidden ${getImpactBgColor(impact?.level || 'low')}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('weather.impact_level', 'Nivel de Impacto')}</span>
                {getImpactIcon(impact?.level || 'low')}
              </div>
              <div className="text-2xl font-bold capitalize">{t(`weather.level.${impact?.level || 'low'}`)}</div>
              <div className="text-xs text-muted-foreground">
                {t('weather.score', 'Puntuación')}: {impact?.score || 0}/100
              </div>
            </KPI_CARD>
          </div>

          {impact && shouldAlert(impact.level) && (
            <CARD className={`border-l-4 ${getImpactColor(impact.level)}`}>
              <div className="flex items-start gap-3">
                {getImpactIcon(impact.level)}
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{t('weather.alert_title', 'Alerta Climática')}</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">{t('weather.factors', 'Factores')}:</span>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {impact.factors.map((factor, i) => (
                          <li key={i}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-sm font-medium">{t('weather.recommendations', 'Recomendaciones')}:</span>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {impact.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CARD>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CARD>
              <div className="flex items-center justify-between mb-4">
                <h3 className={CARD_TITLE}>{t('weather.current_conditions', 'Condiciones Actuales')}</h3>
                {currentWeather?.weather[0] && (
                  <img
                    src={getWeatherIconUrl(currentWeather.weather[0].icon)}
                    alt={currentWeather.weather[0].description}
                    className="w-16 h-16"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t('weather.condition', 'Condición')}</div>
                    <div className="font-medium">{formatWeatherDescription(currentWeather?.weather[0]?.description || '')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" aria-hidden="true" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t('weather.last_update', 'Última actualización')}</div>
                    <div className="font-medium">{weather.lastUpdated ? new Date(weather.lastUpdated).toLocaleTimeString() : '-'}</div>
                  </div>
                </div>
              </div>
            </CARD>

            <CARD>
              <div className="flex items-center justify-between mb-4">
                <h3 className={CARD_TITLE}>{t('weather.settings', 'Configuración')}</h3>
                <Settings className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('weather.auto_refresh', 'Actualización automática')}</span>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
                    aria-label={autoRefresh ? 'Disable auto refresh' : 'Enable auto refresh'}
                  >
                    {autoRefresh ? <Bell className="w-4 h-4" aria-hidden="true" /> : <BellOff className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('weather.alert_threshold', 'Umbral de alertas')}</span>
                  <select
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value as any)}
                    className="text-xs px-2 py-1 rounded border border-border bg-card focus:outline-none focus:ring-2 focus:ring-blue-400"
                    aria-label="Alert threshold"
                  >
                    <option value="low">{t('weather.level.low', 'Bajo')}</option>
                    <option value="medium">{t('weather.level.medium', 'Medio')}</option>
                    <option value="high">{t('weather.level.high', 'Alto')}</option>
                    <option value="critical">{t('weather.level.critical', 'Crítico')}</option>
                  </select>
                </div>
              </div>
            </CARD>
          </div>

          {showConstruction && metrics && (
            <CARD>
              <div className="flex items-center justify-between mb-4">
                <h3 className={CARD_TITLE}>{t('weather.construction_metrics', 'Métricas de Construcción')}</h3>
                <button
                  onClick={() => setShowConstruction(!showConstruction)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Toggle construction metrics"
                >
                  {showConstruction ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-purple-500" aria-hidden="true" />
                    <span className="font-medium">{t('weather.concrete_curing', 'Curado de Concreto')}</span>
                  </div>
                  <div className={`text-sm font-medium ${getSuitabilityColor(metrics.concreteCuring.suitable)}`}>
                    {metrics.concreteCuring.suitable ? t('weather.suitable', 'Adecuado') : t('weather.not_suitable', 'No adecuado')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {metrics.concreteCuring.tempRange} · {metrics.concreteCuring.humidityRange}
                  </div>
                  {metrics.concreteCuring.recommendations.length > 0 && (
                    <ul className="text-xs text-muted-foreground list-disc list-inside mt-2">
                      {metrics.concreteCuring.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-orange-500" aria-hidden="true" />
                    <span className="font-medium">{t('weather.workforce_safety', 'Seguridad de Mano de Obra')}</span>
                  </div>
                  <div className="text-sm font-medium capitalize">
                    {t(`weather.heat_stress.${metrics.workforceSafety.heatStressRisk}`)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('weather.heat_index', 'Índice de calor')}: {Math.round(metrics.workforceSafety.heatIndex)}°F
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metrics.workforceSafety.workScheduleAdjustment}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                    <span className="font-medium">{t('weather.equipment_operation', 'Operación de Equipos')}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span>{t('weather.cranes', 'Grúas')}</span>
                      <span className={getSuitabilityColor(metrics.equipmentOperation.cranes.suitable)}>
                        {metrics.equipmentOperation.cranes.suitable ? t('weather.suitable_short', 'Idóneo') : t('weather.not_suitable_short', 'No')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('weather.excavators', 'Excavadoras')}</span>
                      <span className={getSuitabilityColor(metrics.equipmentOperation.excavators.suitable)}>
                        {metrics.equipmentOperation.excavators.suitable ? t('weather.suitable_short', 'Idóneo') : t('weather.not_suitable_short', 'No')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('weather.welding', 'Soldadura')}</span>
                      <span className={getSuitabilityColor(metrics.equipmentOperation.welding.suitable)}>
                        {metrics.equipmentOperation.welding.suitable ? t('weather.suitable_short', 'Idóneo') : t('weather.not_suitable_short', 'No')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
                    <span className="font-medium">{t('weather.material_protection', 'Protección de Materiales')}</span>
                  </div>
                  {metrics.materialProtection.materialsToProtect.length > 0 ? (
                    <>
                      <div className="text-xs text-muted-foreground capitalize">
                        {t('weather.urgency', 'Urgencia')}: {t(`weather.urgency.${metrics.materialProtection.urgency}`)}
                      </div>
                      <ul className="text-xs text-muted-foreground list-disc list-inside mt-1">
                        {metrics.materialProtection.materialsToProtect.map((material, i) => (
                          <li key={i}>{material}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <div className="text-sm text-green-600 dark:text-green-400">{t('weather.no_protection_needed', 'No se requiere protección')}</div>
                  )}
                </div>
              </div>
            </CARD>
          )}

          {showHistory && weather?.history && weather.history.length > 1 && (
            <CARD>
              <div className="flex items-center justify-between mb-4">
                <h3 className={CARD_TITLE}>{t('weather.history_chart', 'Historial Climático')}</h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Toggle history chart"
                >
                  {showHistory ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
              <WeatherHistoryChart history={weather.history} />
            </CARD>
          )}

          {showScheduling && scheduling.length > 0 && (
            <CARD>
              <div className="flex items-center justify-between mb-4">
                <h3 className={CARD_TITLE}>{t('weather.scheduling_windows', 'Ventanas de Programación')}</h3>
                <button
                  onClick={() => setShowScheduling(!showScheduling)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Toggle scheduling windows"
                >
                  {showScheduling ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {groupedForecast.slice(0, 7).map((dayData, index) => {
                  const date = new Date(dayData[0].dt * 1000).toISOString().slice(0, 10);
                  const window = scheduling.find(w => w.date === date);
                  if (!window) return null;

                  return (
                    <div
                      key={date}
                      tabIndex={0}
                      role="button"
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                        window.suitable 
                          ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                      }`}
                      onClick={() => setSelectedDay(index)}
                      onKeyDown={handleKeyDown(() => setSelectedDay(index))}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{formatDate(date)}</span>
                        <div className={`w-2 h-2 rounded-full ${window.suitable ? 'bg-green-500' : 'bg-red-500'}`} aria-hidden="true" />
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {window.conditions.slice(0, 2).join(', ')}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{t('weather.score', 'Puntuación')}: {window.score}</span>
                        {window.suitable ? (
                          <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CARD>
          )}

          {showDetails && groupedForecast.length > 0 && (
            <CARD>
              <div className="flex items-center justify-between mb-4">
                <h3 className={CARD_TITLE}>{t('weather.forecast', 'Pronóstico')}</h3>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Toggle forecast details"
                >
                  {showDetails ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
              <div className="space-y-3">
                {groupedForecast.slice(0, 5).map((dayData, index) => {
                  const date = new Date(dayData[0].dt * 1000).toISOString().slice(0, 10);
                  const avgTemp = dayData.reduce((sum, f) => sum + f.main.temp, 0) / dayData.length;
                  const icon = dayData[4]?.weather[0]?.icon || dayData[0]?.weather[0]?.icon;

                  return (
                    <div key={date} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center gap-3">
                        {icon && (
                          <img
                            src={getWeatherIconUrl(icon)}
                            alt="Weather icon"
                            className="w-10 h-10"
                          />
                        )}
                        <div>
                          <div className="font-medium">{formatDate(date)}</div>
                          <div className="text-xs text-muted-foreground">
                            {dayData[0]?.weather[0]?.description && formatWeatherDescription(dayData[0].weather[0].description)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{Math.round(avgTemp)}°C</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(dayData[0].main.temp_min)}° / {Math.round(dayData[0].main.temp_max)}°
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CARD>
          )}
        </>
      )}
    </div>
  );
};

const WeatherHistoryChart: React.FC<{ history: WeatherHistoryItem[] }> = ({ history }) => {
  const { t } = useTranslation();
  const recent = history.slice(-14);

  const maxTemp = Math.max(...recent.map(h => h.tempMax), 0);
  const minTemp = Math.min(...recent.map(h => h.tempMin), 0);
  const tempRange = maxTemp - minTemp || 1;
  const maxPrecip = Math.max(...recent.map(h => h.precipitation), 0.1);
  const precipScale = (val: number) => Math.max(2, (val / maxPrecip) * 25);
  const barWidth = Math.max(20, Math.min(40, 600 / recent.length));

  const getTempColor = (temp: number) => {
    if (temp > 35) return '#ef4444';
    if (temp > 25) return '#f97316';
    if (temp > 15) return '#3b82f6';
    return '#06b6d4';
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <svg width={Math.max(300, recent.length * (barWidth + 4))} height="160" className="min-w-full">
          {recent.map((item, i) => {
            const x = i * (barWidth + 4) + 8;
            const highY = 10 + (1 - (item.tempMax - minTemp) / tempRange) * 100;
            const barH = Math.max(3, ((item.tempMax - item.tempMin) / tempRange) * 100);
            const avgY = 10 + (1 - (item.temp - minTemp) / tempRange) * 100;

            return (
              <g key={`${item.date}-${i}`}>
                <rect x={x} y={highY} width={barWidth} height={barH} rx="3" fill={getTempColor(item.temp)} opacity="0.7">
                  <title>{item.date}: {Math.round(item.temp)}°C ({Math.round(item.tempMin)}-{Math.round(item.tempMax)})</title>
                </rect>
                {item.precipitation > 0 && (
                  <rect x={x} y={125 - precipScale(item.precipitation)} width={barWidth} height={precipScale(item.precipitation)} rx="2" fill="#60a5fa" opacity="0.5">
                    <title>{t('weather.precipitation', 'Precipitación')}: {item.precipitation.toFixed(1)}mm</title>
                  </rect>
                )}
                {recent.length > 0 && (
                  <text x={x + barWidth / 2} y="148" textAnchor="middle" className="fill-muted-foreground text-[9px]">
                    {new Date(item.date).getDate()}
                  </text>
                )}
                <line x1={x + barWidth / 2} y1={avgY} x2={x + barWidth / 2} y2={avgY + 4} stroke={getTempColor(item.temp)} strokeWidth="2" />
              </g>
            );
          })}
          <line x1="0" y1="110" x2={recent.length * (barWidth + 4) + 8} y2="110" stroke="#e5e7eb" strokeWidth="1" />
        </svg>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500 inline-block" aria-hidden="true" /> {t('weather.temperature', 'Temperatura')}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 opacity-50 inline-block" aria-hidden="true" /> {t('weather.precipitation_short', 'Precip.')}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-muted-foreground inline-block" aria-hidden="true" /> {t('weather.avg_temp', 'Temp. promedio')}</span>
      </div>
    </div>
  );
};

export default Weather;
