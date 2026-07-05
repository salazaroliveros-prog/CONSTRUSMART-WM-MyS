import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { Cloud, Sun, CloudRain, Thermometer, Droplets, Wind, AlertTriangle } from 'lucide-react';
import { CARD, CARD_TITLE } from '../ui';

const WeatherWidget: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, selectedProyectoId, proyectoWeather } = useErp();

  const proyecto = selectedProyectoId 
    ? proyectos.find(p => p.id === selectedProyectoId) 
    : proyectos.find(p => p.estado === 'ejecucion') || proyectos[0];

  const weather = proyecto ? proyectoWeather.find(w => w.proyectoId === proyecto.id) : undefined;
  const currentWeather = weather?.weatherData?.current;
  const impact = weather?.impact;

  const getWeatherIcon = (weather: any) => {
    if (!weather) return <Cloud className="w-4 h-4" />;
    const main = weather.weather?.[0]?.main?.toLowerCase();
    if (main?.includes('rain')) return <CloudRain className="w-4 h-4" />;
    if (main?.includes('cloud')) return <Cloud className="w-4 h-4" />;
    return <Sun className="w-4 h-4" />;
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-green-600 dark:text-green-400';
    }
  };

  if (!currentWeather) {
    return (
      <div className={`${CARD} p-2 sm:p-3`}>
        <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-2 flex items-center gap-1`}>
          <Cloud className="w-3 h-3 sm:w-4 sm:h-4 text-primary" aria-hidden="true" />
          {t('weather.title', 'Clima')}
        </h3>
        <div className="text-xs text-muted-foreground">
          {proyecto ? t('weather.no_data', 'Sin datos') : t('weather.no_project', 'Sin proyecto')}
        </div>
      </div>
    );
  }

  return (
    <div className={`${CARD} p-2 sm:p-3`}>
      <h3 className={`${CARD_TITLE} text-xs sm:text-sm mb-2 flex items-center gap-1`}>
        {getWeatherIcon(currentWeather)}
        {t('weather.title', 'Clima')}
        {impact && (
          <span className={`ml-auto text-[10px] font-medium ${getImpactColor(impact.level)}`}>
            {t(`weather.level.${impact.level}`)}
          </span>
        )}
      </h3>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-orange-500" aria-hidden="true" />
            <span className="text-xs font-medium">{Math.round(currentWeather.temp)}°C</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-blue-500" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{currentWeather.humidity}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-gray-500" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{Math.round(currentWeather.wind_speed)} m/s</span>
          </div>
          {impact?.level === 'critical' || impact?.level === 'high' ? (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              <span className="text-[10px] font-medium">{t('weather.alert', 'Alerta')}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
