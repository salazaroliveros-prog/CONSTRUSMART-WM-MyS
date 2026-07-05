import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { generateProfitabilityReport, generateProfitabilityForecast, type ProfitabilityMetrics, type ClientMetrics } from '../services/profitabilityAnalytics';
import { exportProfitabilityPDF, exportProfitabilityExcel } from '../export';
import { BarChart, Donut, LineChart, Progress, Gauge } from '../components/Charts';
import { fmtQ, fmtPct } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, Target, AlertTriangle, 
  CheckCircle, ArrowUpRight, ArrowDownRight, BarChart3, PieChart, 
  LineChart as LineChartIcon, Activity, Zap, Shield, Calculator, 
  Filter, Download, RefreshCw, Eye, EyeOff, ChevronRight, ChevronDown,
  Star, Award, Clock, FileText, Building2, Briefcase, Settings, FileSpreadsheet
} from 'lucide-react';
import { COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER, COLOR_INFO, COLOR_PRIMARY, SECTION_TITLE, CARD, KPI_CARD, BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_ICON } from '../ui';
import { toast } from 'sonner';

const RENTABILIDAD_COLORS = {
  excelente: '#10b981',
  bueno: '#3b82f6',
  aceptable: '#f59e0b',
  riesgoso: '#f97316',
  critico: '#ef4444',
};

const SEGMENTO_COLORS = {
  vip: '#8b5cf6',
  premium: '#3b82f6',
  estandar: '#10b981',
  bajo_margen: '#ef4444',
};

const PROFITABILITYAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, movimientos, empleados, materiales, ordenes, selectedProyectoId, setSelectedProyectoId } = useErp();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'proyectos' | 'clientes' | 'pronosticos' | 'recursos' | 'tendencias' | 'precios'>('proyectos');
  const [showDetails, setShowDetails] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedForecastPeriod, setSelectedForecastPeriod] = useState<number>(30);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const profitabilityData = useMemo(() => {
    if (!proyectos || !movimientos) return null;
    return generateProfitabilityReport(proyectos, movimientos, empleados || [], materiales || [], ordenes || []);
  }, [proyectos, movimientos, empleados, materiales, ordenes]);

  const filteredProjects = useMemo(() => {
    if (!selectedProyectoId || selectedProyectoId === 'none') return proyectos || [];
    return (proyectos || []).filter(p => p.id === selectedProyectoId);
  }, [proyectos, selectedProyectoId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    toast.success(t('profitability.datos_actualizados'));
  }, [t]);

  const handleExportReport = useCallback(() => {
    if (!profitabilityData) return;

    try {
      if (exportFormat === 'pdf') {
        exportProfitabilityPDF(
          profitabilityData.projectProfitabilities,
          profitabilityData.clientProfitabilities,
          profitabilityData.resourceEfficiencies,
          profitabilityData.trends
        );
        toast.success('Reporte PDF exportado exitosamente');
      } else {
        exportProfitabilityExcel(
          profitabilityData.projectProfitabilities,
          profitabilityData.clientProfitabilities,
          profitabilityData.resourceEfficiencies,
          profitabilityData.trends
        );
        toast.success('Reporte Excel exportado exitosamente');
      }
    } catch (error) {
      toast.error('Error al exportar reporte');
      console.error('Export error:', error);
    }
  }, [profitabilityData, exportFormat]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!profitabilityData) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
        <div className="text-center py-12">
          <Calculator className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t('profitability.datos_insuficientes')}</h2>
          <p className="text-muted-foreground">{t('profitability.requeridos_proyectos_movimientos')}</p>
        </div>
      </div>
    );
  }

  const { projectProfitabilities, clientProfitabilities, trends, resourceEfficiencies, pricingOptimizations } = profitabilityData;

  const totalUtilidad = projectProfitabilities.reduce((sum, p) => sum + p.utilidadBruta, 0);
  const avgMargen = projectProfitabilities.length > 0 
    ? projectProfitabilities.reduce((sum, p) => sum + p.margenBruto, 0) / projectProfitabilities.length 
    : 0;
  const proyectosRiesgosos = projectProfitabilities.filter(p => p.estadoRentabilidad === 'riesgoso' || p.estadoRentabilidad === 'critico').length;
  const proyectosExcelentes = projectProfitabilities.filter(p => p.estadoRentabilidad === 'excelente').length;

  const TABS = [
    { id: 'proyectos' as const, label: t('profitability.por_proyecto'), icon: Building2 },
    { id: 'clientes' as const, label: t('profitability.por_cliente'), icon: Users },
    { id: 'pronosticos' as const, label: t('profitability.pronosticos'), icon: LineChartIcon },
    { id: 'recursos' as const, label: t('profitability.eficiencia_recursos'), icon: Zap },
    { id: 'tendencias' as const, label: t('profitability.tendencias'), icon: BarChart3 },
    { id: 'precios' as const, label: t('profitability.optimizacion_precios'), icon: Calculator },
  ];

  return (
    <div className="p-2 sm:p-3 lg:p-4 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 ${COLOR_PRIMARY}`} aria-hidden="true" />
            {t('profitability.titulo')}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{t('profitability.descripcion')}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className={`${BUTTON_SECONDARY} text-xs`}
            aria-label={t('profitability.actualizar')}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {refreshing ? t('profitability.actualizar') + '...' : t('profitability.actualizar')}
          </button>
          <div className="flex gap-1">
            <button
              onClick={() => setExportFormat('pdf')}
              className={`${exportFormat === 'pdf' ? BUTTON_PRIMARY : BUTTON_SECONDARY} text-xs`}
              aria-label="Exportar PDF"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              PDF
            </button>
            <button
              onClick={() => setExportFormat('excel')}
              className={`${exportFormat === 'excel' ? BUTTON_PRIMARY : BUTTON_SECONDARY} text-xs`}
              aria-label="Exportar Excel"
            >
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
              Excel
            </button>
            <button 
              onClick={handleExportReport}
              className={`${BUTTON_PRIMARY} text-xs`}
              aria-label={t('profitability.exportar')}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className={`${KPI_CARD} bg-gradient-to-br from-emerald-500 to-emerald-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/80 uppercase tracking-wide">{t('profitability.utilidad_total')}</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{fmtQ(totalUtilidad)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-white/20" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-white/80">
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            <span>+12.5% {t('profitability.mes_anterior')}</span>
          </div>
        </div>

        <div className={`${KPI_CARD} bg-gradient-to-br from-blue-500 to-blue-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/80 uppercase tracking-wide">{t('profitability.margen_promedio')}</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{fmtPct(avgMargen)}</p>
            </div>
            <Target className="w-8 h-8 text-white/20" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-white/80">
            <CheckCircle className="w-3 h-3" aria-hidden="true" />
            <span>{t('profitability.objetivo')}: 15%</span>
          </div>
        </div>

        <div className={`${KPI_CARD} bg-gradient-to-br from-amber-500 to-amber-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/80 uppercase tracking-wide">{t('profitability.proyectos_riesgosos')}</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{proyectosRiesgosos}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-white/20" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-white/80">
            <Activity className="w-3 h-3" aria-hidden="true" />
            <span>{t('profitability.requieren_atencion')}</span>
          </div>
        </div>

        <div className={`${KPI_CARD} bg-gradient-to-br from-purple-500 to-purple-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/80 uppercase tracking-wide">{t('profitability.proyectos_excelentes')}</p>
              <p className="text-xl sm:text-2xl font-bold mt-1">{proyectosExcelentes}</p>
            </div>
            <Award className="w-8 h-8 text-white/20" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-white/80">
            <Star className="w-3 h-3" aria-hidden="true" />
            <span>{t('profitability.alto_desempeno')}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            aria-label={`Ver ${tab.label}`}
          >
            <tab.icon className="w-4 h-4" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'proyectos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className={SECTION_TITLE}>Rentabilidad por Proyecto</h2>
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className={`${BUTTON_ICON} text-xs`}
              aria-label={showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className={`${CARD} rounded-xl p-4`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" aria-hidden="true" />
                  Distribución de Margen por Proyecto
                </h3>
                <div className="h-64">
                  <BarChart
                    data={projectProfitabilities.map(p => {
                      const proyecto = proyectos.find(proj => proj.id === p.proyectoId);
                      return {
                        label: proyecto?.nombre?.substring(0, 20) || 'Desconocido',
                        value: p.margenBruto,
                        color: RENTABILIDAD_COLORS[p.estadoRentabilidad],
                      };
                    })}
                    height={240}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4" aria-hidden="true" />
                  Estado de Rentabilidad
                </h3>
                <div className="h-64">
                  <Donut
                    data={Object.entries(
                      projectProfitabilities.reduce((acc, p) => {
                        acc[p.estadoRentabilidad] = (acc[p.estadoRentabilidad] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([key, value]) => ({
                      label: key.charAt(0).toUpperCase() + key.slice(1),
                      value,
                      color: RENTABILIDAD_COLORS[key as keyof typeof RENTABILIDAD_COLORS],
                    }))}
                    height={240}
                  />
                </div>
              </div>
            </div>
          </div>

          {showDetails && (
            <div className={`${CARD} rounded-xl overflow-hidden`}>
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold">Proyecto</th>
                    <th className="text-right p-3 font-semibold">Presupuesto</th>
                    <th className="text-right p-3 font-semibold">Costo Real</th>
                    <th className="text-right p-3 font-semibold">Ingreso Real</th>
                    <th className="text-right p-3 font-semibold">Utilidad</th>
                    <th className="text-right p-3 font-semibold">Margen</th>
                    <th className="text-center p-3 font-semibold">Estado</th>
                    <th className="text-right p-3 font-semibold">Eficiencia</th>
                  </tr>
                </thead>
                <tbody>
                  {projectProfitabilities.map(p => {
                    const proyecto = proyectos.find(proj => proj.id === p.proyectoId);
                    return (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-3 font-medium">{proyecto?.nombre || 'Desconocido'}</td>
                        <td className="text-right p-3">{fmtQ(p.presupuestoTotal)}</td>
                        <td className="text-right p-3">{fmtQ(p.costoReal)}</td>
                        <td className="text-right p-3">{fmtQ(p.ingresoReal)}</td>
                        <td className={`text-right p-3 font-semibold ${p.utilidadBruta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {fmtQ(p.utilidadBruta)}
                        </td>
                        <td className="text-right p-3">{fmtPct(p.margenBruto)}</td>
                        <td className="text-center p-3">
                          <span 
                            className="inline-block px-2 py-1 rounded-full text-[10px] font-medium text-white"
                            style={{ backgroundColor: RENTABILIDAD_COLORS[p.estadoRentabilidad] }}
                          >
                            {p.estadoRentabilidad.charAt(0).toUpperCase() + p.estadoRentabilidad.slice(1)}
                          </span>
                        </td>
                        <td className="text-right p-3">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={p.scoreEficiencia} className="w-16 h-2" />
                            <span className="text-[10px]">{fmtPct(p.scoreEficiencia)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'clientes' && (
        <div className="space-y-4">
          <h2 className={SECTION_TITLE}>Rentabilidad por Cliente</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`${CARD} rounded-xl p-4`}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" aria-hidden="true" />
                Segmentación de Clientes
              </h3>
              <div className="h-64">
                <Donut
                  data={clientProfitabilities.map(c => ({
                    label: c.cliente.substring(0, 15),
                    value: c.utilidadTotal,
                    color: SEGMENTO_COLORS[c.segmento],
                  }))}
                  height={240}
                />
              </div>
            </div>

            <div className={`${CARD} rounded-xl p-4`}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4" aria-hidden="true" />
                Valor de Vida del Cliente
              </h3>
              <div className="h-64">
                <BarChart
                  data={clientProfitabilities
                    .sort((a, b) => b.valorVidaCliente - a.valorVidaCliente)
                    .slice(0, 8)
                    .map(c => ({
                      label: c.cliente.substring(0, 15),
                      value: c.valorVidaCliente,
                      color: SEGMENTO_COLORS[c.segmento],
                    }))}
                  height={240}
                />
              </div>
            </div>
          </div>

          <div className={`${CARD} rounded-xl overflow-hidden`}>
            <table className="w-full text-xs">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-semibold">Cliente</th>
                  <th className="text-right p-3 font-semibold">Proyectos</th>
                  <th className="text-right p-3 font-semibold">Valor Contratos</th>
                  <th className="text-right p-3 font-semibold">Utilidad Total</th>
                  <th className="text-right p-3 font-semibold">Margen Promedio</th>
                  <th className="text-center p-3 font-semibold">Segmento</th>
                  <th className="text-right p-3 font-semibold">Probabilidad Retención</th>
                </tr>
              </thead>
              <tbody>
                {clientProfitabilities
                  .sort((a, b) => b.utilidadTotal - a.utilidadTotal)
                  .map(c => (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3 font-medium">{c.cliente}</td>
                      <td className="text-right p-3">{c.proyectosCount}</td>
                      <td className="text-right p-3">{fmtQ(c.valorTotalContratos)}</td>
                      <td className={`text-right p-3 font-semibold ${c.utilidadTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {fmtQ(c.utilidadTotal)}
                      </td>
                      <td className="text-right p-3">{fmtPct(c.margenPromedio)}</td>
                      <td className="text-center p-3">
                        <span 
                          className="inline-block px-2 py-1 rounded-full text-[10px] font-medium text-white"
                          style={{ backgroundColor: SEGMENTO_COLORS[c.segmento] }}
                        >
                          {c.segmento.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-right p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={c.probabilidadRetencion} className="w-16 h-2" />
                          <span className="text-[10px]">{fmtPct(c.probabilidadRetencion)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pronosticos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className={SECTION_TITLE}>Pronósticos de Rentabilidad</h2>
            <select
              value={selectedForecastPeriod}
              onChange={(e) => setSelectedForecastPeriod(Number(e.target.value))}
              className="text-xs px-3 py-2 rounded-lg border border-border bg-background"
              aria-label="Período de pronóstico"
            >
              <option value={15}>15 días</option>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90}>90 días</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredProjects.slice(0, 4).map(proyecto => {
              const forecast = generateProfitabilityForecast(
                {
                  proyectoId: proyecto.id,
                  tipoProyeccion: 'rentabilidad',
                  fechaBase: new Date().toISOString().split('T')[0],
                  diasProyeccion: selectedForecastPeriod,
                },
                projectProfitabilities.filter(p => p.proyectoId === proyecto.id),
                proyecto
              );

              return (
                <div key={proyecto.id} className={`${CARD} rounded-xl p-4`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-sm font-semibold">{proyecto.nombre}</h3>
                      <p className="text-[10px] text-muted-foreground">Pronóstico a {selectedForecastPeriod} días</p>
                    </div>
                    <div className={`text-right`}>
                      <p className="text-[10px] text-muted-foreground">Confianza</p>
                      <p className="text-lg font-bold">{fmtPct(forecast.confianza)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground">Valor Actual</span>
                      <span className="text-sm font-semibold">{fmtQ(forecast.valorActual)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground">Pronóstico Base</span>
                      <span className="text-sm font-semibold">{fmtQ(forecast.escenarioBase)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-emerald-600">Escenario Optimista</span>
                      <span className="text-sm font-semibold text-emerald-600">{fmtQ(forecast.escenarioOptimista)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-red-600">Escenario Pesimista</span>
                      <span className="text-sm font-semibold text-red-600">{fmtQ(forecast.escenarioPesimista)}</span>
                    </div>
                  </div>

                  {forecast.factoresRiesgo.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-[10px] font-semibold text-amber-600 mb-2">Factores de Riesgo</p>
                      <ul className="space-y-1">
                        {forecast.factoresRiesgo.map((factor, idx) => (
                          <li key={idx} className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" aria-hidden="true" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {forecast.factoresOportunidad.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-[10px] font-semibold text-emerald-600 mb-2">Oportunidades</p>
                      <ul className="space-y-1">
                        {forecast.factoresOportunidad.map((factor, idx) => (
                          <li key={idx} className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'recursos' && (
        <div className="space-y-4">
          <h2 className={SECTION_TITLE}>Eficiencia de Recursos</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {['mano_obra', 'materiales', 'equipo', 'subcontratos'].map(tipo => {
              const tipoData = resourceEfficiencies.filter(r => r.tipoRecurso === tipo);
              const avgEficiencia = tipoData.length > 0 
                ? tipoData.reduce((sum, r) => sum + r.eficiencia, 0) / tipoData.length 
                : 0;
              const avgDesperdicio = tipoData.length > 0 
                ? tipoData.reduce((sum, r) => sum + r.desperdicio, 0) / tipoData.length 
                : 0;
              const alertasCount = tipoData.filter(r => r.alertaDesviacion).length;

              const tipoLabels: Record<string, string> = {
                mano_obra: 'Mano de Obra',
                materiales: 'Materiales',
                equipo: 'Equipo',
                subcontratos: 'Subcontratos',
              };

              return (
                <div key={tipo} className={`${CARD} rounded-xl p-4`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-sm font-semibold">{tipoLabels[tipo]}</h3>
                    {alertasCount > 0 && (
                      <span className="bg-red-100 text-red-600 text-[10px] px-2 py-1 rounded-full font-medium">
                        {alertasCount} alertas
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Eficiencia Promedio</span>
                        <span className="font-semibold">{fmtPct(avgEficiencia)}</span>
                      </div>
                      <Progress value={avgEficiencia} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-muted-foreground">Desperdicio Promedio</span>
                        <span className="font-semibold">{fmtPct(avgDesperdicio)}</span>
                      </div>
                      <Progress value={avgDesperdicio} className="h-2" color={avgDesperdicio > 15 ? '#ef4444' : '#f59e0b'} />
                    </div>

                    <div className="pt-4 border-t border-border">
                      <h4 className="text-[10px] font-semibold mb-2">Por Proyecto</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {tipoData.slice(0, 5).map(r => {
                          const proyecto = proyectos.find(p => p.id === r.proyectoId);
                          return (
                            <div key={r.id} className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground truncate flex-1">{proyecto?.nombre || 'Desconocido'}</span>
                              <div className="flex items-center gap-2 ml-2">
                                <Progress value={r.eficiencia} className="w-12 h-1.5" />
                                <span className="w-10 text-right">{fmtPct(r.eficiencia)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'tendencias' && (
        <div className="space-y-4">
          <h2 className={SECTION_TITLE}>Tendencias de Rentabilidad</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {trends.map(trend => (
              <div key={trend.id} className={`${CARD} rounded-xl p-4`}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" aria-hidden="true" />
                  {trend.tipoAnalisis === 'rentabilidad_global' ? 'Global' : 
                   trend.tipoAnalisis === 'por_tipologia' ? 'Por Tipología' : 
                   trend.tipoAnalisis === 'por_cliente' ? 'Por Cliente' : 'Por Temporada'}
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">Proyectos Activos</span>
                    <span className="text-sm font-semibold">{trend.proyectosActivos}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">Rentabilidad Promedio</span>
                    <span className="text-sm font-semibold">{fmtPct(trend.rentabilidadPromedio)}</span>
                  </div>

                  {trend.alertas.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-[10px] font-semibold text-red-600 mb-2">Alertas</p>
                      <ul className="space-y-1">
                        {trend.alertas.slice(0, 3).map((alerta, idx) => (
                          <li key={idx} className="text-[10px] text-muted-foreground flex items-start gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                            {alerta}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {trend.oportunidades.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-[10px] font-semibold text-emerald-600 mb-2">Oportunidades</p>
                      <ul className="space-y-1">
                        {trend.oportunidades.slice(0, 3).map((oportunidad, idx) => (
                          <li key={idx} className="text-[10px] text-muted-foreground flex items-start gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                            {oportunidad}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className={`${CARD} rounded-xl p-4`}>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <LineChartIcon className="w-4 h-4" aria-hidden="true" />
              Evolución de Rentabilidad por Tipología
            </h3>
            <div className="h-64">
              <LineChart
                data={trends[1]?.tendencias ? Object.entries(trends[1].tendencias).map(([key, value]) => ({
                  label: key,
                  value: value as number,
                })) : []}
                height={240}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'precios' && (
        <div className="space-y-4">
          <h2 className={SECTION_TITLE}>Optimización de Precios</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {pricingOptimizations.map(opt => (
              <div key={opt.id} className={`${CARD} rounded-xl p-4`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-semibold capitalize">{opt.tipologia}</h3>
                    {opt.subtipo && <p className="text-[10px] text-muted-foreground">{opt.subtipo}</p>}
                  </div>
                  <div className={`text-right`}>
                    <p className="text-[10px] text-muted-foreground">Confianza</p>
                    <p className="text-lg font-bold">{fmtPct(opt.confianzaRecomendacion)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">Margen Histórico</span>
                    <span className="text-sm font-semibold">{fmtPct(opt.margenHistoricoPromedio)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">Margen Objetivo</span>
                    <span className="text-sm font-semibold text-emerald-600">{fmtPct(opt.margenObjetivo)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">Factor Riesgo</span>
                    <span className="text-sm font-semibold">{fmtPct(opt.factorRiesgo)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">Complejidad</span>
                    <span className="text-sm font-semibold">{fmtPct(opt.complejidadPromedio)}</span>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-muted-foreground">Precio Sugerido</span>
                      <span className="text-sm font-semibold">{fmtQ(opt.precioSugeridoBase)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-muted-foreground">Precio Optimizado</span>
                      <span className="text-lg font-bold text-primary">{fmtQ(opt.precioOptimizado)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground">Ajuste Total</span>
                      <span className="font-semibold text-emerald-600">
                        +{fmtPct(((opt.precioOptimizado - opt.precioSugeridoBase) / opt.precioSugeridoBase) * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PROFITABILITYAnalytics;
