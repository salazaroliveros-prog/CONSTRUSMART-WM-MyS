import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import {
  LineChart, TrendingUp, TrendingDown, AlertTriangle, ChevronDown,
  CloudSun, Download, FileText, Minus, Cloud, Sun, CloudRain, Wind, Activity
} from 'lucide-react';
import { fmtQ, fmtPct, todayISO } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Proyecto } from '../types';

interface SCurveDataPoint {
  month: number;
  label: string;
  planned: number;
  earned: number;
  actual: number;
  weatherAdjusted: number;
}

interface EVMMetrics {
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  bac: number;
  eac: number;
}

const MONTH_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

function generateSCurve(
  proyecto: Proyecto,
  weatherScore: number
): { data: SCurveDataPoint[]; metrics: EVMMetrics } {
  const months = 12;
  const totalPresupuesto = proyecto.presupuestoTotal || proyecto.montoContrato || 1000000;
  const avanceActual = (proyecto.avanceFisico || 0) / 100;
  const avanceFinanciero = (proyecto.avanceFinanciero || 0) / 100;

  const weatherFactor = Math.max(0.7, 1 - weatherScore / 200);

  const data: SCurveDataPoint[] = [];
  let cumulativeEV = 0;

  for (let m = 0; m < months; m++) {
    const t = (m + 1) / months;
    const plannedPct = 1 / (1 + Math.exp(-12 * (t - 0.5)));

    const earnedPct = m < Math.round(months * avanceActual)
      ? 1 / (1 + Math.exp(-12 * (t - 0.5)))
      : avanceActual + (plannedPct - avanceActual) * weatherFactor;

    const finalEarned = Math.min(1, m < Math.round(months * avanceActual) ? plannedPct * avanceActual / 0.5 : earnedPct);
    const finalPlanned = Math.min(1, plannedPct);

    cumulativeEV += finalEarned;

    const adjusted = weatherScore > 0
      ? finalPlanned * weatherFactor
      : finalPlanned;

    data.push({
      month: m + 1,
      label: MONTH_LABELS[m % 12],
      planned: Math.round(finalPlanned * totalPresupuesto),
      earned: Math.round(finalEarned * totalPresupuesto),
      actual: Math.round((avanceFinanciero || avanceActual) * totalPresupuesto * (m + 1) / months),
      weatherAdjusted: Math.round(adjusted * totalPresupuesto),
    });
  }

  const latest = data[Math.min(Math.round(months * avanceActual), months - 1)] || data[0];
  const pv = latest.planned;
  const ev = latest.earned;
  const ac = latest.actual;

  const metrics: EVMMetrics = {
    pv,
    ev,
    ac,
    cv: ev - ac,
    sv: ev - pv,
    cpi: ac > 0 ? ev / ac : 1,
    spi: pv > 0 ? ev / pv : 1,
    bac: totalPresupuesto,
    eac: weatherScore > 30 ? totalPresupuesto * (1 + weatherScore / 200) : totalPresupuesto,
  };

  return { data, metrics };
}

function getWeatherIcon(level: string | undefined) {
  switch (level) {
    case 'critical': return <CloudRain className="w-4 h-4 text-red-500" aria-hidden="true" />;
    case 'high': return <Wind className="w-4 h-4 text-orange-500" aria-hidden="true" />;
    case 'medium': return <Cloud className="w-4 h-4 text-yellow-500" aria-hidden="true" />;
    default: return <Sun className="w-4 h-4 text-green-500" aria-hidden="true" />;
  }
}

function getImpactColor(level: string | undefined): string {
  switch (level) {
    case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200';
    default: return 'text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200';
  }
}

const SVGRenderer: React.FC<{ data: SCurveDataPoint[] }> = ({ data }) => {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => Math.max(d.planned, d.earned, d.actual, d.weatherAdjusted))) * 1.1;
  const w = 600;
  const h = 280;
  const pad = { top: 20, right: 20, bottom: 40, left: 60 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;
  const xScale = (i: number) => pad.left + (i / (data.length - 1)) * plotW;
  const yScale = (v: number) => pad.top + plotH - (v / maxVal) * plotH;

  const makePath = (values: number[], dash?: string) => {
    const pts = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');
    return <path d={pts} fill="none" strokeWidth={2} strokeDasharray={dash || 'none'} className="transition-all duration-300" />;
  };

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal / yTicks) * i);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="S-Curve chart">
      <rect x={pad.left} y={pad.top} width={plotW} height={plotH} fill="none" stroke="hsl(var(--border))" strokeWidth={0.5} />
      {yTickValues.map((v, i) => (
        <g key={i}>
          <line x1={pad.left} y1={yScale(v)} x2={w - pad.right} y2={yScale(v)} stroke="hsl(var(--border))" strokeWidth={0.5} strokeDasharray="4,4" />
          <text x={pad.left - 5} y={yScale(v) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
            {fmtQ(v)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        if (i % 2 !== 0 && i !== data.length - 1) return null;
        return (
          <text key={i} x={xScale(i)} y={h - 8} textAnchor="middle" className="fill-muted-foreground text-[9px]">
            {d.label}
          </text>
        );
      })}
      <g>
        {makePath(data.map(d => d.planned), 'none')}
        {data.length > 1 && (
          <>
            <path d={data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.planned).toFixed(1)}`).join(' ')}
              fill="none" stroke="#3b82f6" strokeWidth={2} />
            <path d={data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.earned).toFixed(1)}`).join(' ')}
              fill="none" stroke="#10b981" strokeWidth={2} />
            <path d={data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.actual).toFixed(1)}`).join(' ')}
              fill="none" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6,3" />
            <path d={data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.weatherAdjusted).toFixed(1)}`).join(' ')}
              fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="3,3" />
          </>
        )}
      </g>
    </svg>
  );
};

const CurvasS: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, currentProjectId, setCurrentProjectId, proyectoWeather } = useErp();
  const [selectedProyectoId, setSelectedProyectoId] = useState<string>(currentProjectId || proyectos[0]?.id || '');

  const selectedProyecto = proyectos.find(p => p.id === selectedProyectoId);
  const selectedWeather = selectedProyecto
    ? proyectoWeather.find(w => w.proyectoId === selectedProyecto.id)
    : undefined;

  const weatherScore = selectedWeather?.impact?.score ?? 0;
  const weatherLevel = selectedWeather?.impact?.level;

  const { data: curveData, metrics } = useMemo(
    () => selectedProyecto ? generateSCurve(selectedProyecto, weatherScore) : { data: [], metrics: null as unknown as EVMMetrics },
    [selectedProyecto, weatherScore]
  );

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const title = selectedProyecto?.nombre || t('curvas.titulo');
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`${t('curvas.evm_metrics')} - ${todayISO()}`, 14, 28);
    if (metrics) {
      autoTable(doc, {
        startY: 35,
        head: [[t('curvas.evm_metrics'), t('curvas.valor_planificado'), t('curvas.valor_ganado'), t('curvas.costo_real'), t('curvas.cpi'), t('curvas.spi')]],
        body: [[
          title,
          fmtQ(metrics.pv),
          fmtQ(metrics.ev),
          fmtQ(metrics.ac),
          metrics.cpi.toFixed(2),
          metrics.spi.toFixed(2),
        ]],
      });
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [[t('curvas.mes'), t('curvas.curva_planificada'), t('curvas.curva_ejecutada'), t('curvas.costo_real'), t('curvas.curva_ajustada_clima')]],
        body: curveData.map(d => [
          d.label,
          fmtQ(d.planned),
          fmtQ(d.earned),
          fmtQ(d.actual),
          fmtQ(d.weatherAdjusted),
        ]),
      });
    }
    doc.save(`curvas-s-${selectedProyectoId || 'general'}.pdf`);
  };

  const handleExportExcel = () => {
    if (!curveData.length) return;
    const ws = XLSX.utils.json_to_sheet(curveData.map(d => ({
      [t('curvas.mes')]: d.label,
      [t('curvas.curva_planificada')]: d.planned,
      [t('curvas.curva_ejecutada')]: d.earned,
      [t('curvas.costo_real')]: d.actual,
      [t('curvas.curva_ajustada_clima')]: d.weatherAdjusted,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CurvasS');
    XLSX.writeFile(wb, `curvas-s-${selectedProyectoId || 'general'}.xlsx`);
  };

  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!selectedProyecto && proyectos.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <LineChart className="w-16 h-16 text-muted-foreground/30 mb-4" aria-hidden="true" />
        <h2 className="text-xl font-bold text-foreground mb-2">{t('curvas.titulo')}</h2>
        <p className="text-muted-foreground">{t('curvas.sin_proyecto')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2">
            <LineChart className="w-7 h-7 text-primary" aria-hidden="true" />
            {t('curvas.titulo')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('curvas.curva_s')} &middot; EVM {t('curvas.evm_metrics')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedProyectoId}
              onChange={(e) => {
                setSelectedProyectoId(e.target.value);
                setCurrentProjectId(e.target.value);
              }}
              className="appearance-none bg-card border border-border rounded-xl px-3 py-2 pr-8 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              aria-label={t('curvas.sin_proyecto')}
            >
              {proyectos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          </div>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-card border border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t('curvas.exportar_pdf')}
          >
            <FileText className="w-4 h-4" aria-hidden="true" />
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-card border border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t('curvas.exportar_excel')}
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
            {t('curvas.curva_s')}
          </h2>
          <SVGRenderer data={curveData} metrics={metrics} />
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" aria-hidden="true" /> {t('curvas.valor_planificado')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" aria-hidden="true" /> {t('curvas.valor_ganado')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 inline-block" aria-hidden="true" /> {t('curvas.costo_real')}
            </span>
            {weatherScore > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-red-500 inline-block" aria-hidden="true" /> {t('curvas.curva_ajustada_clima')}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              {t('curvas.evm_metrics')}
            </h3>
            {metrics ? (
              <div className="space-y-2.5">
                <MetricRow label={t('curvas.valor_planificado')} value={fmtQ(metrics.pv)} />
                <MetricRow label={t('curvas.valor_ganado')} value={fmtQ(metrics.ev)} />
                <MetricRow label={t('curvas.costo_real')} value={fmtQ(metrics.ac)} />
                <div className="h-px bg-border/50" />
                <MetricRow
                  label={t('curvas.variacion_costo')}
                  value={fmtQ(metrics.cv)}
                  color={metrics.cv >= 0 ? 'text-emerald-600' : 'text-red-600'}
                  icon={metrics.cv >= 0 ? TrendingUp : TrendingDown}
                />
                <MetricRow
                  label={t('curvas.variacion_cronograma')}
                  value={fmtQ(metrics.sv)}
                  color={metrics.sv >= 0 ? 'text-emerald-600' : 'text-red-600'}
                  icon={metrics.sv >= 0 ? TrendingUp : TrendingDown}
                />
                <div className="h-px bg-border/50" />
                <MetricRow label={t('curvas.cpi')} value={metrics.cpi.toFixed(2)} color={metrics.cpi >= 1 ? 'text-emerald-600' : 'text-red-600'} />
                <MetricRow label={t('curvas.spi')} value={metrics.spi.toFixed(2)} color={metrics.spi >= 1 ? 'text-emerald-600' : 'text-red-600'} />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t('curvas.sin_datos')}</p>
            )}
          </div>

          {selectedWeather?.impact && (
            <div className={`rounded-2xl p-4 border ${getImpactColor(weatherLevel)}`}>
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1.5 truncate" title={t('curvas.impacto_clima_productividad')}>
                {getWeatherIcon(weatherLevel)}
                {t('curvas.impacto_clima_productividad')}
              </h3>
              <div className="text-xs space-y-1.5">
                <p className="flex justify-between">
                  <span>{t('curvas.factor_ajuste')}</span>
                  <span className="font-bold">{fmtPct(1 - weatherScore / 200)}</span>
                </p>
                <p className="flex justify-between">
                  <span>{t('curvas.productividad_base')}</span>
                  <span className="font-bold">100%</span>
                </p>
                <p className="flex justify-between">
                  <span>{t('curvas.productividad_ajustada')}</span>
                  <span className="font-bold">{fmtPct(Math.max(0.7, 1 - weatherScore / 200))}</span>
                </p>
                {weatherScore > 0 && (
                  <div className="pt-2 space-y-1">
                    {selectedWeather.impact.factors.slice(0, 2).map((f: string, i: number) => (
                      <p key={i} className="flex items-start gap-1">
                        <Minus className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{f}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!selectedWeather?.impact && selectedProyecto?.lat && selectedProyecto?.lng && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CloudSun className="w-4 h-4" aria-hidden="true" />
                <span>{t('curvas.sin_coordenadas')}. {t('common.weather_forecast')}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-xs" role="table">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th scope="col" className="text-left px-4 py-2.5 font-semibold text-foreground">{t('curvas.mes')}</th>
                <th scope="col" className="text-right px-4 py-2.5 font-semibold text-foreground">{t('curvas.curva_planificada')}</th>
                <th scope="col" className="text-right px-4 py-2.5 font-semibold text-foreground">{t('curvas.curva_ejecutada')}</th>
                <th scope="col" className="text-right px-4 py-2.5 font-semibold text-foreground">{t('curvas.costo_real')}</th>
                <th scope="col" className="text-right px-4 py-2.5 font-semibold text-foreground">{t('curvas.curva_ajustada_clima')}</th>
                <th scope="col" className="text-right px-4 py-2.5 font-semibold text-foreground">{t('curvas.porcentaje_avance')}</th>
              </tr>
            </thead>
            <tbody>
              {curveData.map((d) => (
                <tr key={d.month} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 font-medium text-foreground">{d.month}. {d.label}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{fmtQ(d.planned)}</td>
                  <td className="px-4 py-2 text-right font-medium text-emerald-600">{fmtQ(d.earned)}</td>
                  <td className="px-4 py-2 text-right text-amber-600">{fmtQ(d.actual)}</td>
                  <td className="px-4 py-2 text-right text-red-500">{fmtQ(d.weatherAdjusted)}</td>
                  <td className="px-4 py-2 text-right text-muted-foreground">{fmtPct(d.earned / (d.planned || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {weatherScore >= 30 && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold mb-1">{t('curvas.alertas')}</p>
            <p>{t('curvas.curva_ajustada_clima')}: {fmtPct(1 - weatherScore / 200)} {t('curvas.productividad_ajustada')}.</p>
            {metrics && metrics.eac > metrics.bac && (
              <p className="mt-1">{t('curvas.alertas_presupuesto')}: {fmtQ(metrics.eac - metrics.bac)} sobre {t('curvas.valor_planificado')}.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MetricRow: React.FC<{
  label: string;
  value: string;
  color?: string;
  icon?: React.ElementType;
}> = ({ label, value, color = 'text-foreground', icon: Icon }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-semibold flex items-center gap-1 ${color}`}>
      {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
      {value}
    </span>
  </div>
);

export default CurvasS;