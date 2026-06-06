import React, { useMemo, useState } from 'react';
import { useErp } from '../store';
import { fmtQ as _fmtQ, todayISO } from '../utils';
import {
  BarChart3, CalendarDays, Target, CheckCircle2, XCircle,
  Plus, Trash2, Search, X,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { SEED_RENDIMIENTOS } from '../data';

interface CapturaDiaria {
  id: string;
  proyectoId: string;
  actividad: string;
  cuadrilla: string;
  fecha: string;
  cantidadEjecutada: number;
  unidad: string;
  horasTrabajadas: number;
  observaciones?: string;
}

const Rendimientos: React.FC = () => {
  const { proyectos, notifyDesviacionRendimiento } = useErp();

  const [loading, setLoading] = useState(true);
  const [proyectoId, setProyectoId] = useState('');
  const [capturas, setCapturas] = useState<CapturaDiaria[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchActividad, setSearchActividad] = useState('');

  // Form state
  const [formActividad, setFormActividad] = useState('');
  const [formCuadrilla, setFormCuadrilla] = useState('');
  const [formCantidad, setFormCantidad] = useState(1);
  const [formUnidad, setFormUnidad] = useState('m²');
  const [formHoras, setFormHoras] = useState(8);
  const [formObs, setFormObs] = useState('');

  // Lazy load
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  const proyecto = proyectos.find(p => p.id === proyectoId);
  const rendimientosTeoricos = SEED_RENDIMIENTOS;

  // Capturas filtradas
  const capturasFiltradas = useMemo(() => {
    let f = capturas;
    if (proyectoId) f = f.filter(c => c.proyectoId === proyectoId);
    if (searchActividad) {
      const q = searchActividad.toLowerCase();
      f = f.filter(c => c.actividad.toLowerCase().includes(q));
    }
    return f.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [capturas, proyectoId, searchActividad]);

  // Comparativa teórico vs real
  const comparativa = useMemo(() => {
    const mapActividad: Record<string, { real: number; teorico: number; unidad: string; capturas: number }> = {};

    capturasFiltradas.forEach(c => {
      if (!mapActividad[c.actividad]) {
        const teorico = rendimientosTeoricos.find(r => r.actividad === c.actividad);
        mapActividad[c.actividad] = {
          real: 0,
          teorico: teorico?.rendimientoDiario || 0,
          unidad: c.unidad,
          capturas: 0,
        };
      }
      mapActividad[c.actividad].real += c.cantidadEjecutada;
      mapActividad[c.actividad].capturas += 1;
    });

    return Object.entries(mapActividad).map(([actividad, data]) => {
      const promedioReal = data.capturas > 0 ? data.real / data.capturas : 0;
      const pctEficiencia = data.teorico > 0 ? (promedioReal / data.teorico) * 100 : 0;
      return {
        actividad,
        promedioReal: +promedioReal.toFixed(1),
        teorico: data.teorico,
        unidad: data.unidad,
        capturas: data.capturas,
        totalReal: +data.real.toFixed(1),
        pctEficiencia: +pctEficiencia.toFixed(0),
        alerta: pctEficiencia < 80,
      };
    });
  }, [capturasFiltradas, rendimientosTeoricos]);

  const handleAddCaptura = () => {
    if (!proyectoId) { toast.error('Selecciona un proyecto'); return; }
    if (!formActividad.trim()) { toast.error('Indica la actividad'); return; }
    if (formCantidad <= 0) { toast.error('Cantidad debe ser > 0'); return; }

    const teorico = rendimientosTeoricos.find(r =>
      r.actividad.toLowerCase().includes(formActividad.toLowerCase())
    );

    const nueva: CapturaDiaria = {
      id: Date.now().toString(),
      proyectoId,
      actividad: formActividad.trim(),
      cuadrilla: formCuadrilla.trim() || teorico?.cuadrilla || 'No especificada',
      fecha: todayISO(),
      cantidadEjecutada: formCantidad,
      unidad: formUnidad,
      horasTrabajadas: formHoras,
      observaciones: formObs.trim() || undefined,
    };

    setCapturas(s => [nueva, ...s]);

    // Alerta si rendimiento < 80%
    if (teorico) {
      const rendimientoReal = formHoras > 0 ? formCantidad / (formHoras / 8) : formCantidad;
      const pct = teorico.rendimientoDiario > 0 ? (rendimientoReal / teorico.rendimientoDiario) * 100 : 0;
      if (pct < 80) {
        toast.warning(`⚠️ Rendimiento bajo: ${formActividad} (${pct.toFixed(0)}% del teórico ${teorico.rendimientoDiario} ${teorico.unidad}/día)`);
        notifyDesviacionRendimiento(formActividad.trim(), pct, proyectoId);
      } else {
        toast.success(`✅ Rendimiento dentro de parámetros (${pct.toFixed(0)}%)`);
      }
    } else {
      toast.success('Captura registrada (sin referencia teórica)');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormActividad('');
    setFormCuadrilla('');
    setFormCantidad(1);
    setFormUnidad('m²');
    setFormHoras(8);
    setFormObs('');
    setShowForm(false);
  };

  const handleDeleteCaptura = (id: string) => {
    setCapturas(s => s.filter(c => c.id !== id));
    toast.success('Captura eliminada');
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const totalAlertas = comparativa.filter(c => c.alerta).length;
  const totalCapturas = capturas.length;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-success" /> Control de Rendimientos
        </h1>
        <div className="flex gap-2">
          <select
            value={proyectoId}
            onChange={e => setProyectoId(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-input outline-none focus:border-ring bg-background text-foreground"
          >
            <option value="">— Todos los proyectos —</option>
            {proyectos.filter(p => p.estado !== 'finalizado').map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-success text-success-foreground hover:bg-success/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Capturar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-card text-card-foreground rounded-xl p-3 border border-border">
          <div className="text-[10px] text-muted-foreground">Capturas Registradas</div>
          <div className="text-lg font-bold text-foreground">{totalCapturas}</div>
        </div>
        <div className="bg-card text-card-foreground rounded-xl p-3 border border-border">
          <div className="text-[10px] text-muted-foreground">Actividades Monitorizadas</div>
          <div className="text-lg font-bold text-foreground">{comparativa.length}</div>
        </div>
        <div className={`rounded-xl p-3 border ${totalAlertas > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-card border-border'}`}>
          <div className="text-[10px] text-muted-foreground">Alertas de Rendimiento</div>
          <div className={`text-lg font-bold ${totalAlertas > 0 ? 'text-destructive' : 'text-foreground'}`}>
            {totalAlertas} {totalAlertas > 0 && <span className="text-xs font-normal">{'(< 80%)'}</span>}
          </div>
        </div>
        <div className="bg-card text-card-foreground rounded-xl p-3 border border-border">
          <div className="text-[10px] text-muted-foreground">Proyecto Actual</div>
          <div className="text-lg font-bold text-foreground truncate">{proyecto?.nombre || 'Todos'}</div>
        </div>
      </div>

      {/* Grid: Comparativa + Capturas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Comparativa Teórico vs Real */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border">
          <div className="p-3 border-b border-border bg-muted">
            <h2 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Target className="w-4 h-4 text-success" /> Rendimiento Teórico vs Real
            </h2>
          </div>
          {comparativa.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
              Aún no hay capturas para comparar
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {comparativa.map((item, i) => (
                <div key={i} className="p-3 hover:bg-muted transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">{item.actividad}</span>
                      {item.alerta && (
                        <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                          bajo
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-bold shrink-0 ml-2 ${
                      item.alerta ? 'text-destructive' : 'text-success'
                    }`}>
                      {item.pctEficiencia}%
                    </span>
                  </div>
                  {/* Barra de eficiencia */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.alerta ? 'bg-destructive' : 'bg-success'
                        }`}
                        style={{ width: `${Math.min(item.pctEficiencia, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>
                      Real: {item.promedioReal} {item.unidad}/día · Teórico: {item.teorico} {item.unidad}/día
                    </span>
                    <span>({item.capturas} capturas)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Capturas Recientes */}
        <div className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border">
          <div className="p-3 border-b border-border bg-muted">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-success" /> Capturas Diarias
              </h2>
              <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={searchActividad}
                  onChange={e => setSearchActividad(e.target.value)}
                   placeholder="Buscar actividad..."
                   className="pl-7 pr-3 py-1 text-xs rounded-lg border border-input outline-none focus:border-ring bg-background text-foreground w-36"
                 />
              </div>
            </div>
          </div>
          {capturasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Sin capturas registradas. ¡Captura tu primera producción diaria!
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
              {capturasFiltradas.map(c => {
                // Encontrar teórico para calcular eficiencia
                const teorico = rendimientosTeoricos.find(r =>
                  r.actividad.toLowerCase() === c.actividad.toLowerCase()
                );
                const rendDia = c.horasTrabajadas > 0 ? (c.cantidadEjecutada / (c.horasTrabajadas / 8)) : c.cantidadEjecutada;
                const pct = teorico && teorico.rendimientoDiario > 0
                  ? (rendDia / teorico.rendimientoDiario) * 100
                  : null;
                return (
                  <div key={c.id} className="p-3 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-medium text-slate-700 truncate">{c.actividad}</span>
                        {pct !== null && (
                          pct < 80
                            ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteCaptura(c.id)}
                        className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-500">{c.cantidadEjecutada} {c.unidad}</span>
                      <span>·</span>
                      <span>{c.cuadrilla}</span>
                      <span>·</span>
                      <span>{c.horasTrabajadas}h</span>
                      <span>·</span>
                      <span>{c.fecha}</span>
                    </div>
                    {pct !== null && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct < 80 ? 'bg-red-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-[9px] font-medium ${pct < 80 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    )}
                    {c.observaciones && (
                      <div className="text-[9px] text-slate-400 mt-0.5 italic">{c.observaciones}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de captura */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => resetForm()}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg text-slate-800">📊 Capturar Producción Diaria</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-5 space-y-3">
              {/* Actividad con autocompletado de SEED_RENDIMIENTOS */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Actividad *</label>
                <input
                  value={formActividad}
                  onChange={e => {
                    setFormActividad(e.target.value);
                    // Auto-completar datos si encontramos match
                    const match = rendimientosTeoricos.find(r =>
                      r.actividad.toLowerCase().includes(e.target.value.toLowerCase())
                    );
                    if (match) {
                      setFormCuadrilla(match.cuadrilla);
                      setFormUnidad(match.unidad);
                    }
                  }}
                  placeholder="Ej: Concreto en cimientos"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-emerald-400"
                  list="actividades-list"
                />
                <datalist id="actividades-list">
                  {rendimientosTeoricos.map(r => (
                    <option key={r.id} value={r.actividad} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block font-medium">Cuadrilla</label>
                  <input
                    value={formCuadrilla}
                    onChange={e => setFormCuadrilla(e.target.value)}
                    placeholder="Ej: 1 Albañil + 1 Ayudante"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block font-medium">Unidad</label>
                  <select
                    value={formUnidad}
                    onChange={e => setFormUnidad(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-emerald-400 bg-white"
                  >
                    {['m²', 'm³', 'ml', 'kg', 'u', 'pto', 'global'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block font-medium">Cantidad Ejecutada *</label>
                  <input
                    type="number"
                    value={formCantidad}
                    onChange={e => setFormCantidad(Math.max(0, +e.target.value))}
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block font-medium">Horas Trabajadas</label>
                  <input
                    type="number"
                    value={formHoras}
                    onChange={e => setFormHoras(Math.max(1, +e.target.value))}
                    min={1}
                    max={24}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block font-medium">Observaciones</label>
                <input
                  value={formObs}
                  onChange={e => setFormObs(e.target.value)}
                  placeholder="Condiciones del día, novedades..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-emerald-400"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={resetForm} className="flex-1 py-2.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                Cancelar
              </button>
              <button
                onClick={handleAddCaptura}
                disabled={!formActividad.trim() || formCantidad <= 0}
                className="flex-1 py-2.5 text-sm rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Registrar Captura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rendimientos;