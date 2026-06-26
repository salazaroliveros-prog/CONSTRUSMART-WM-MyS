import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Droplets, AlertTriangle, Calendar, RefreshCw, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { getWeatherIconUrl, formatWeatherDescription, isWeatherDataStale } from '../services/weatherService';
import type { ProyectoWeather, ConstructionMetrics, SchedulingWindow } from '../store/schemas/weather';

interface WeatherWidgetProps {
  proyectoId?: string;
  compact?: boolean;
  showScheduling?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ proyectoId, compact = false, showScheduling = false }) => {
  const { t } = useTranslation();
  const { proyectos, proyectoWeather, updateProyectoWeather } = useErp();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(0);

  const proyecto = proyectoId ? proyectos.find(p => p.id === proyectoId) : proyectos.find(p => p.id === proyectos[0]?.id);
  const weather = proyecto ? proyectoWeather.find(w => w.proyectoId === proyecto.id) : undefined;

  useEffect(() => {
    if (proyecto && weather?.weatherData && isWeatherDataStale(weather.weatherData, 60)) {
      refreshWeather();
    }
  }, [proyecto, weather]);

  const refreshWeather = async () => {
    if (!proyecto || !(proyecto.latitud && proyecto.longitud)) return;
    
    setLoading(true);
    try {
      const { getCompleteWeatherData, calculateWeatherImpact, calculateConstructionMetrics, calculateSchedulingWindows } = await import('../services/weatherService');
      
      const weatherData = await getCompleteWeatherData(proyecto.latitud, proyecto.longitud, proyecto.ubicacion);
      if (weatherData) {
        const impact = calculateWeatherImpact(weatherData);
        const constructionMetrics = calculateConstructionMetrics(weatherData);
        const schedulingWindows = calculateSchedulingWindows(weatherData, 7);
        
        updateProyectoWeather(proyecto.id, weatherData, {
          ...impact,
          constructionMetrics,
          schedulingWindows,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error refreshing weather:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!proyecto) return null;

  const currentWeather = weather?.weatherData?.current;
  const impact = weather?.impact;
  const metrics = weather?.constructionMetrics;
  const scheduling = weather?.schedulingWindows || [];

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-500 bg-red-50 dark:bg-red-950';
      case 'high': return 'text-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      default: return 'text-green-500 bg-green-50 dark:bg-green-950';
    }
  };

  const getImpactIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <Wind className="w-4 h-4" />;
      case 'medium': return <CloudRain className="w-4 h-4" />;
      default: return <Sun className="w-4 h-4" />;
    }
  };

  if (compact) {
    return (
      <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentWeather?.weather[0] ? (
              <img 
                src={getWeatherIconUrl(currentWeather.weather[0].icon)} 
                alt={currentWeather.weather[0].description}
                className="w-8 h-8"
              />
            ) : (
              <Cloud className="w-8 h-8 text-muted-foreground" />
            )}
            <div>
              <div className="text-lg font-bold">{Math.round(currentWeather?.temp || 0)}°C</div>
              <div className="text-xs text-muted-foreground">{currentWeather?.weather[0]?.description || 'No data'}</div>
            </div>
          </div>
          {impact && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getImpactColor(impact.level)}`}>
              {getImpactIcon(impact.level)}
              {t(`weather.level.${impact.level}`)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            {t('weather.title')} - {proyecto.nombre}
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={refreshWeather}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              aria-label="Refresh weather"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle expand"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {currentWeather ? (
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              {currentWeather.weather[0] && (
                <img 
                  src={getWeatherIconUrl(currentWeather.weather[0].icon)} 
                  alt={currentWeather.weather[0].description}
                  className="w-12 h-12 mb-1"
                />
              )}
              <div className="text-2xl font-bold">{Math.round(currentWeather.temp)}°C</div>
              <div className="text-xs text-muted-foreground">{formatWeatherDescription(currentWeather.weather[0]?.description || '')}</div>
            </div>
            <div className="flex flex-col items-center">
              <Thermometer className="w-5 h-5 text-orange-500 mb-1" />
              <div className="text-lg font-semibold">{Math.round(currentWeather.feels_like)}°C</div>
              <div className="text-xs text-muted-foreground">{t('weather.feels_like')}</div>
            </div>
            <div className="flex flex-col items-center">
              <Droplets className="w-5 h-5 text-blue-500 mb-1" />
              <div className="text-lg font-semibold">{currentWeather.humidity}%</div>
              <div className="text-xs text-muted-foreground">{t('weather.humidity')}</div>
            </div>
            <div className="flex flex-col items-center">
              <Wind className="w-5 h-5 text-cyan-500 mb-1" />
              <div className="text-lg font-semibold">{currentWeather.wind_speed} m/s</div>
              <div className="text-xs text-muted-foreground">{t('weather.wind')}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            {proyecto.latitud && proyecto.longitud ? (
              <button 
                onClick={refreshWeather}
                className="text-primary hover:underline"
              >
                {t('weather.load_weather')}
              </button>
            ) : (
              <span>{t('weather.no_location')}</span>
            )}
          </div>
        )}
      </div>

      {impact && (
        <div className={`p-3 border-b border-border ${getImpactColor(impact.level)}`}>
          <div className="flex items-center gap-2 mb-2">
            {getImpactIcon(impact.level)}
            <span className="font-semibold">{t('weather.impact_level')}: {t(`weather.level.${impact.level}`)}</span>
            <span className="text-sm opacity-75">({impact.score}/100)</span>
          </div>
          {impact.factors.length > 0 && (
            <div className="text-sm mb-2">
              <span className="font-medium">{t('weather.factors')}:</span>
              <span className="ml-1">{impact.factors.join(', ')}</span>
            </div>
          )}
          {impact.recommendations.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">{t('weather.recommendations')}:</span>
              <ul className="ml-4 mt-1 list-disc">
                {impact.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {expanded && metrics && (
        <div className="p-4 border-b border-border">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {t('weather.construction_metrics')}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-3 rounded-lg ${metrics.concreteCuring.suitable ? 'bg-green-50 dark:bg-green-950' : 'bg-orange-50 dark:bg-orange-950'}`}>
              <div className="font-medium mb-1">{t('weather.concrete_curing')}</div>
              <div className="text-sm text-muted-foreground">{metrics.concreteCuring.tempRange}</div>
              <div className="text-sm text-muted-foreground">{metrics.concreteCuring.humidityRange}</div>
              {metrics.concreteCuring.recommendations.length > 0 && (
                <ul className="mt-2 text-xs list-disc ml-4">
                  {metrics.concreteCuring.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium mb-2">{t('weather.equipment_operation')}</div>
              <div className="space-y-1 text-sm">
                <div className={`flex justify-between ${metrics.equipmentOperation.cranes.suitable ? 'text-green-600' : 'text-red-600'}`}>
                  <span>{t('weather.cranes')}:</span>
                  <span>{metrics.equipmentOperation.cranes.suitable ? '✓' : '✗'}</span>
                </div>
                <div className={`flex justify-between ${metrics.equipmentOperation.excavators.suitable ? 'text-green-600' : 'text-red-600'}`}>
                  <span>{t('weather.excavators')}:</span>
                  <span>{metrics.equipmentOperation.excavators.suitable ? '✓' : '✗'}</span>
                </div>
                <div className={`flex justify-between ${metrics.equipmentOperation.welding.suitable ? 'text-green-600' : 'text-red-600'}`}>
                  <span>{t('weather.welding')}:</span>
                  <span>{metrics.equipmentOperation.welding.suitable ? '✓' : '✗'}</span>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${metrics.workforceSafety.heatStressRisk === 'low' ? 'bg-green-50 dark:bg-green-950' : metrics.workforceSafety.heatStressRisk === 'extreme' ? 'bg-red-50 dark:bg-red-950' : 'bg-yellow-50 dark:bg-yellow-950'}`}>
              <div className="font-medium mb-1">{t('weather.workforce_safety')}</div>
              <div className="text-sm">Heat Index: {Math.round(metrics.workforceSafety.heatIndex)}°C</div>
              <div className="text-sm">Risk: {t(`weather.heat_risk.${metrics.workforceSafety.heatStressRisk}`)}</div>
              <div className="text-sm mt-1">{metrics.workforceSafety.workScheduleAdjustment}</div>
            </div>

            {metrics.materialProtection.protectionRequired && (
              <div className={`p-3 rounded-lg ${metrics.materialProtection.urgency === 'high' ? 'bg-red-50 dark:bg-red-950' : metrics.materialProtection.urgency === 'medium' ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-blue-50 dark:bg-blue-950'}`}>
                <div className="font-medium mb-1">{t('weather.material_protection')}</div>
                <div className="text-sm">{metrics.materialProtection.materialsToProtect.join(', ')}</div>
                <div className="text-sm mt-1">Urgency: {t(`weather.urgency.${metrics.materialProtection.urgency}`)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {expanded && showScheduling && scheduling.length > 0 && (
        <div className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t('weather.scheduling_windows')}
          </h4>
          
          <div className="space-y-2">
            {scheduling.slice(0, 7).map((window, index) => (
              <div 
                key={window.date}
                onClick={() => setSelectedDay(index)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedDay === index ? 'bg-primary/10 border border-primary' : window.suitable ? 'bg-green-50 dark:bg-green-950' : 'bg-orange-50 dark:bg-orange-950'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{new Date(window.date).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className={`text-sm font-semibold ${window.score >= 80 ? 'text-green-600' : window.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {window.score}%
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-1">{window.conditions.join(', ')}</div>
                {selectedDay === index && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="text-xs">
                      <span className="font-medium">{t('weather.best_activities')}:</span>
                      <span className="ml-1">{window.bestActivities.join(', ')}</span>
                    </div>
                    {window.avoidActivities.length > 0 && (
                      <div className="text-xs mt-1">
                        <span className="font-medium">{t('weather.avoid_activities')}:</span>
                        <span className="ml-1">{window.avoidActivities.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;