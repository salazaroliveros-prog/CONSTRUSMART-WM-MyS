import React, { useState, useRef } from 'react';
import { useErp } from '../store';
import { fmtQ, todayISO } from '../utils';
import {
  FileText, Download, BarChart3,
  Package,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type Reporte = 'cubicacion' | 'rendimientos' | 'ejecutivo';

const ReportesTecnicos: React.FC = () => {
  const { proyectos, movimientos, empleados, presupuestos, valesSalida, materiales } = useErp();
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Reporte>('cubicacion');
  const [proyectoId, setProyectoId] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);



  const proyecto = proyectos.find(p => p.id === proyectoId);
  const presupuesto = presupuestos.find(p => p.proyectoId === proyectoId);

  // Datos para cubicación
  const cubicacion = presupuesto?.renglones?.map(r => ({
    codigo: r.codigo,
    nombre: r.nombre,
    unidad: r.unidad,
    cantidad: r.cantidad,
    costoUnitario: r.costoMateriales + r.costoManoObra + r.costoEquipo,
    costoTotal: (r.costoMateriales + r.costoManoObra + r.costoEquipo) * r.cantidad,
    memoria: `Cubicación según diseño estructural — ${r.nombre} (${r.unidad})`,
  })) || [];

  const totalCubicacion = cubicacion.reduce((a, r) => a + r.costoTotal, 0);

  // Datos para rendimientos
  const movimientosProy = movimientos.filter(m => m.proyectoId === proyectoId);
  const gastosMO = movimientosProy.filter(m => m.tipo === 'gasto' && m.categoria === 'mano_obra');
  const totalMO = gastosMO.reduce((a, b) => a + b.costoTotal, 0);
  const diasTranscurridos = proyecto
    ? Math.max(1, Math.ceil((new Date().getTime() - new Date(proyecto.fechaInicio).getTime()) / (24 * 60 * 60 * 1000)))
    : 1;

  // Datos para ejecutivo
  const ingresos = movimientosProy.filter(m => m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
  const egresos = movimientosProy.filter(m => m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
  const valesSalidaProy = valesSalida.filter(v => v.proyectoId === proyectoId);
  const empleadosProy = empleados.filter(e => e.proyectoIds?.includes(proyectoId));

  const handleExportar = () => {
    if (!reportRef.current) return;
    import('html2canvas').then(html2canvas => {
      html2canvas.default(reportRef.current!).then(canvas => {
        const link = document.createElement('a');
        link.download = `reporte-${selectedReport}-${proyecto?.nombre || 'general'}-${todayISO()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        toast.success('📥 Reporte exportado como imagen');
      });
    }).catch(() => toast.error('Error al exportar'));
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const REPORTES: { id: Reporte; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'cubicacion', label: 'Cubicación', icon: Package, desc: 'Memoria de cálculo por renglón' },
    { id: 'rendimientos', label: 'Rendimientos', icon: BarChart3, desc: 'Productividad semanal' },
    { id: 'ejecutivo', label: 'Ejecutivo', icon: FileText, desc: 'Resumen de obra mensual' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-violet-500" /> Reportes Técnicos
        </h1>
        <div className="flex gap-2">
          <select
            value={proyectoId}
            onChange={e => setProyectoId(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white"
          >
            <option value="">— Seleccionar proyecto —</option>
            {proyectos.filter(p => p.estado !== 'finalizado').map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <button onClick={handleExportar} disabled={!proyectoId} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {REPORTES.map(r => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl transition-colors ${
                selectedReport === r.id
                  ? 'bg-violet-500 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {r.label}
            </button>
          );
        })}
      </div>

      {/* Contenido del reporte */}
      <div ref={reportRef} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {/* Encabezado del reporte */}
        <div className="border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800">CONSTRUCTORA WM/M&S</h2>
              <p className="text-xs text-slate-500 italic">&quot;Edificando el Futuro&quot;</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div className="font-semibold text-slate-700">
                {selectedReport === 'cubicacion' ? 'REPORTE DE CUBICACIÓN' :
                 selectedReport === 'rendimientos' ? 'REPORTE DE RENDIMIENTOS' :
                 'INFORME EJECUTIVO MENSUAL'}
              </div>
              <div>{new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div>Proyecto: {proyecto?.nombre || 'Sin seleccionar'}</div>
            </div>
          </div>
        </div>

        {!proyectoId ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="text-sm">Selecciona un proyecto para generar el reporte</p>
          </div>
        ) : selectedReport === 'cubicacion' ? (
          /* REPORTE DE CUBICACIÓN */
          <div>
            <h3 className="font-bold text-sm text-slate-700 mb-3">1. CUBICACIÓN POR RENGLÓN</h3>
            <p className="text-xs text-slate-500 mb-4">
              Presupuesto: {fmtQ(presupuesto?.totalCalculado || 0)} · {cubicacion.length} renglones
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-2 px-2 border border-slate-200 font-medium">Código</th>
                    <th className="text-left py-2 px-2 border border-slate-200 font-medium">Renglón</th>
                    <th className="text-left py-2 px-2 border border-slate-200 font-medium">Unidad</th>
                    <th className="text-right py-2 px-2 border border-slate-200 font-medium">Cantidad</th>
                    <th className="text-right py-2 px-2 border border-slate-200 font-medium">Costo Unit.</th>
                    <th className="text-right py-2 px-2 border border-slate-200 font-medium">Costo Total</th>
                    <th className="text-left py-2 px-2 border border-slate-200 font-medium">Memoria de Cálculo</th>
                  </tr>
                </thead>
                <tbody>
                  {cubicacion.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2 px-2 border border-slate-200 font-mono text-slate-600">{r.codigo}</td>
                      <td className="py-2 px-2 border border-slate-200 font-medium text-slate-700">{r.nombre}</td>
                      <td className="py-2 px-2 border border-slate-200 text-slate-500">{r.unidad}</td>
                      <td className="py-2 px-2 border border-slate-200 text-right font-semibold">{r.cantidad}</td>
                      <td className="py-2 px-2 border border-slate-200 text-right">{fmtQ(r.costoUnitario)}</td>
                      <td className="py-2 px-2 border border-slate-200 text-right font-bold text-violet-600">{fmtQ(r.costoTotal)}</td>
                      <td className="py-2 px-2 border border-slate-200 text-slate-500 text-[10px] italic">{r.memoria}</td>
                    </tr>
                  ))}
                  <tr className="bg-violet-50 font-bold">
                    <td colSpan={5} className="py-2 px-2 border border-slate-200 text-right text-slate-700">TOTAL PRESUPUESTO:</td>
                    <td className="py-2 px-2 border border-slate-200 text-right text-violet-700">{fmtQ(totalCubicacion)}</td>
                    <td className="py-2 px-2 border border-slate-200"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-slate-500 italic">
              * Costos según Análisis de Precios Unitarios (APU) con factor de sobrecosto por tipología {proyecto?.tipologia || ''}
            </div>
          </div>
        ) : selectedReport === 'rendimientos' ? (
          /* REPORTE DE RENDIMIENTOS */
          <div>
            <h3 className="font-bold text-sm text-slate-700 mb-3">2. RENDIMIENTO SEMANAL</h3>
            <p className="text-xs text-slate-500 mb-4">
              Período: {proyecto?.fechaInicio} — {todayISO()} ({diasTranscurridos} días)
            </p>

            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-400">Avance Físico</div>
                <div className="text-xl font-bold text-blue-600">{proyecto?.avanceFisico || 0}%</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-400">Avance Financiero</div>
                <div className="text-xl font-bold text-emerald-600">{proyecto?.avanceFinanciero || 0}%</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-400">Costo MO Total</div>
                <div className="text-xl font-bold text-orange-600">{fmtQ(totalMO)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-400">Días Transcurridos</div>
                <div className="text-xl font-bold text-slate-700">{diasTranscurridos}</div>
              </div>
            </div>

            {/* Resumen por empleados */}
            <h4 className="font-bold text-xs text-slate-700 mb-2">Personal Asignado</h4>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-2 px-2 border border-slate-200 font-medium">Nombre</th>
                    <th className="text-left py-2 px-2 border border-slate-200 font-medium">Puesto</th>
                    <th className="text-right py-2 px-2 border border-slate-200 font-medium">Salario/Día</th>
                    <th className="text-right py-2 px-2 border border-slate-200 font-medium">Días</th>
                    <th className="text-right py-2 px-2 border border-slate-200 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {empleadosProy.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2 border border-slate-200 font-medium">{e.nombre}</td>
                      <td className="py-1.5 px-2 border border-slate-200 text-slate-500">{e.puesto}</td>
                      <td className="py-1.5 px-2 border border-slate-200 text-right">{fmtQ(e.salarioDiario)}</td>
                      <td className="py-1.5 px-2 border border-slate-200 text-right">{e.diasTrabajados || 0}</td>
                      <td className="py-1.5 px-2 border border-slate-200 text-right font-bold">{fmtQ(e.salarioDiario * (e.diasTrabajados || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-slate-500 italic">
              * Rendimiento calculado según APU por actividad. Consultar módulo &quot;Rendimientos&quot; para datos detallados de producción diaria.
            </div>
          </div>
        ) : (
          /* INFORME EJECUTIVO MENSUAL */
          <div>
            <h3 className="font-bold text-sm text-slate-700 mb-3">3. INFORME EJECUTIVO MENSUAL</h3>
            <p className="text-xs text-slate-500 mb-4">
              Mes de {new Date().toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })} — {proyecto?.nombre}
            </p>

            {/* Resumen ejecutivo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="text-[10px] text-blue-600 font-medium">Presupuesto</div>
                <div className="text-lg font-bold text-blue-700">{fmtQ(proyecto?.presupuestoTotal || 0)}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="text-[10px] text-emerald-600 font-medium">Ingresos</div>
                <div className="text-lg font-bold text-emerald-700">{fmtQ(ingresos)}</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <div className="text-[10px] text-red-600 font-medium">Egresos</div>
                <div className="text-lg font-bold text-red-700">{fmtQ(egresos)}</div>
              </div>
            </div>

            {/* Desglose de egresos */}
            <h4 className="font-bold text-xs text-slate-700 mb-2">Desglose de Egresos</h4>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-2 px-2 border border-slate-200 font-medium">Fecha</th>
                    <th className="text-left py-2 px-2 border border-slate-200 font-medium">Descripción</th>
                    <th className="text-left py-2 px-2 border border-slate-200 font-medium">Categoría</th>
                    <th className="text-right py-2 px-2 border border-slate-200 font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosProy.filter(m => m.tipo === 'gasto').slice(0, 15).map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-1.5 px-2 border border-slate-200">{m.fecha}</td>
                      <td className="py-1.5 px-2 border border-slate-200 font-medium">{m.descripcion}</td>
                      <td className="py-1.5 px-2 border border-slate-200 text-slate-500">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                          m.categoria === 'materiales' ? 'bg-blue-50 text-blue-600' :
                          m.categoria === 'mano_obra' ? 'bg-emerald-50 text-emerald-600' :
                          m.categoria === 'subcontrato' ? 'bg-purple-50 text-purple-600' :
                          'bg-slate-50 text-slate-600'
                        }`}>{m.categoria}</span>
                      </td>
                      <td className="py-1.5 px-2 border border-slate-200 text-right font-semibold">{fmtQ(m.costoTotal || m.monto || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vales de salida */}
            {valesSalidaProy.length > 0 && (
              <>
                <h4 className="font-bold text-xs text-slate-700 mb-2">Vales de Salida ({valesSalidaProy.length})</h4>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left py-2 px-2 border border-slate-200 font-medium">Fecha</th>
                        <th className="text-left py-2 px-2 border border-slate-200 font-medium">Responsable</th>
                        <th className="text-right py-2 px-2 border border-slate-200 font-medium">Items</th>
                        <th className="text-right py-2 px-2 border border-slate-200 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valesSalidaProy.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2 border border-slate-200">{v.fecha}</td>
                          <td className="py-1.5 px-2 border border-slate-200 font-medium">{v.solicitante}</td>
                          <td className="py-1.5 px-2 border border-slate-200 text-right">{v.items.length}</td>
                          <td className="py-1.5 px-2 border border-slate-200 text-right font-bold">{fmtQ(v.items.reduce((sum, item) => {
                            const mat = materiales.find(m => m.id === item.materialId);
                            return sum + (mat?.precio || 0) * item.cantidad;
                          }, 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Indicadores clave */}
            <h4 className="font-bold text-xs text-slate-700 mb-2">Indicadores Clave</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-[9px] text-slate-400">Avance Físico</div>
                <div className="text-base font-bold text-blue-600">{proyecto?.avanceFisico || 0}%</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-[9px] text-slate-400">Avance Financiero</div>
                <div className="text-base font-bold text-emerald-600">{proyecto?.avanceFinanciero || 0}%</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-[9px] text-slate-400">Estado</div>
                <div className={`text-base font-bold ${proyecto?.estado === 'ejecucion' ? 'text-amber-600' : 'text-slate-600'}`}>{proyecto?.estado}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-center">
                <div className="text-[9px] text-slate-400">Desviación</div>
                <div className={`text-base font-bold ${Math.abs((proyecto?.avanceFisico || 0) - (proyecto?.avanceFinanciero || 0)) > 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {((proyecto?.avanceFisico || 0) - (proyecto?.avanceFinanciero || 0)) > 0 ? '+' : ''}{(proyecto?.avanceFisico || 0) - (proyecto?.avanceFinanciero || 0)}%
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 italic">
              * Informe generado automáticamente por CONSTRUSMART ERP
            </div>
          </div>
        )}

        {/* Pie del reporte */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
          <div>CONSTRUCTORA WM/M&S — Guatemala, C.A.</div>
          <div>Página 1 de 1 · Generado {todayISO()}</div>
        </div>
      </div>
    </div>
  );
};

export default ReportesTecnicos;