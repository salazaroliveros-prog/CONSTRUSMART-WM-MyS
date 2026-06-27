const fs = require('fs');
const path = 'src/erp/screens/Dashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldKpiStart = '      {/* ─── KPI Row: Velocímetros animados ────────── */}';
const oldKpiEnd = '      </div>\n\n      {/* ─── ROW 2: Presupuesto + Avance + Recursos ────────── */}';

const newKpi = `      {/* ─── KPI Row: concentrado en negocio ────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2 flex-shrink-0" style={{ opacity: s1, transform: \`translateY(${(1 - s1) * 12}px)\`, transition: 'all 0.4s ease-out' }}>
        <GaugeKpi label={t('dashboard.proyectos')} sublabel={\`\${activos.length} activos · \${proyectos.length} total\`} value={activos.length} displayValue={String(activos.length)} max={Math.max(proyectos.length, 1)} color="from-blue-500 to-indigo-500" icon={<Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} hasData={hasData} delay={0} sparkData={proyTrend} zones={[{ from: 0, to: Math.max(proyectos.length, 1) * 0.3, color: '#6366f1' }, { from: Math.max(proyectos.length, 1) * 0.3, to: Math.max(proyectos.length, 1) * 0.7, color: '#3b82f6' }, { from: Math.max(proyectos.length, 1) * 0.7, to: Math.max(proyectos.length, 1), color: '#10b981' }]} />
        <GaugeKpi label={t('dashboard.presupuesto')} sublabel={fmtQ(presupuestoTotal)} value={presupuestoTotal} displayValue={presupuestoTotal > 0 ? 'Q ' + (presupuestoTotal / 1000000).toFixed(1) + 'M' : 'Q 0'} max={Math.max(presupuestoTotal * 1.5, 1000000)} color="from-orange-500 to-amber-500" icon={<DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} hasData={hasData} delay={100} sparkData={gastoTrend} />
        <GaugeKpi label={t('dashboard.margen_util')} sublabel={margenProm > 0 ? t('dashboard.sano') : t('dashboard.riesgo')} value={Math.max(0, margenProm)} displayValue={fmtPct(margenProm)} max={50} color="from-emerald-500 to-teal-500" icon={<TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} hasData={hasData && presupuestoTotal > 0} delay={200} zones={[{ from: 0, to: 10, color: '#ef4444' }, { from: 10, to: 25, color: '#f59e0b' }, { from: 25, to: 50, color: '#10b981' }]} />
        <GaugeKpi label="Alertas" sublabel={\`\${riesgosActivos.total} riesgos · \${stockData.criticos} stock · \${ocPendientes.length} OC\`} value={riesgosActivos.total + stockData.criticos + ocPendientes.length} displayValue={String(riesgosActivos.total + stockData.criticos + ocPendientes.length)} max={Math.max(riesgosActivos.total + stockData.criticos + ocPendientes.length, 1)} color="from-rose-500 to-orange-500" icon={<AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />} hasData={hasData} delay={300} />
      </div>\n`;

const idx1 = code.indexOf(oldKpiStart);
const idx2 = code.indexOf(oldKpiEnd);
if (idx1 >= 0 && idx2 >= 0) {
  code = code.slice(0, idx1) + newKpi + code.slice(idx2);
  fs.writeFileSync(path, code);
  console.log('DASHBOARD_ROW1_2_OK');
} else {
  console.log('NOT_FOUND', idx1, idx2);
}
