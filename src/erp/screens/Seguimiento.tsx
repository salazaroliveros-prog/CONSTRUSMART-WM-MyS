import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useErp } from '../store';
import type { BitacoraEntry } from '../types';
import { fmtQ, todayISO, duracionPorRendimiento } from '../utils';
import { Progress, Gauge, BarChart } from '../components/Charts';
import { CARD, CARD_TITLE, INPUT } from '../ui';
import { ClipboardCheck, Plus, CloudRain, Camera, Pencil, Trash2, Save, X, Calendar, MapPin, Upload, Fingerprint } from 'lucide-react';
import GanttChart, { type GanttTask } from '../components/GanttChart';
import SignaturePad from '../components/SignaturePad';
import ChecklistCalidad from '../components/ChecklistCalidad';
import AvanceObraModal from '../components/AvanceObraModal';
import { toast } from 'sonner';

// Helper functions for Gantt calculations
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
}

function addDays(date: string, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const Seguimiento: React.FC = () => {
  const { proyectos, movimientos, bitacora, presupuestos, addBitacora, updateProyecto, updateBitacora, deleteBitacora } = useErp();
  const [selProy, setSelProy] = useState(proyectos[0]?.id || '');
  const [ganttProy, setGanttProy] = useState(proyectos[0]?.id || '');
  const [bit, setBit] = useState({ clima: 'Despejado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
  const [bitFotos, setBitFotos] = useState<string[]>([]);
  const [bitFirma, setBitFirma] = useState('');
  const [bitGeo, setBitGeo] = useState<{lat: number; lng: number} | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [pendingProgress, setPendingProgress] = useState<Record<string, string>>({});
  const [editingBit, setEditingBit] = useState<BitacoraEntry | null>(null);

  const proyData = useMemo(() => proyectos.map(p => {
    const ing = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'ingreso').reduce((a, b) => a + b.costoTotal, 0);
    const gas = movimientos.filter(m => m.proyectoId === p.id && m.tipo === 'gasto').reduce((a, b) => a + b.costoTotal, 0);
    const pendiente = Math.max(0, p.montoContrato - ing);
    return { ...p, ing, gas, pendiente };
  }), [proyectos, movimientos]);

  const proy = proyectos.find(p => p.id === selProy);
  const PV = proy ? proy.presupuestoTotal * (proy.avanceFinanciero / 100) : 0;
  const EV = proy ? proy.presupuestoTotal * (proy.avanceFisico / 100) : 0;
  const AC = proy ? proyData.find(p => p.id === proy.id)?.gas || 0 : 0;
  const CV = EV - AC, SV = EV - PV;

  // Generar tareas Gantt desde presupuestos
  const ganttData = useMemo(() => {
    const proyActual = proyectos.find(p => p.id === ganttProy);
    if (!proyActual) return { tasks: [], start: '', end: '', name: '' };

    const presupuesto = proyActual.presupuestoActualId 
      ? presupuestos.find(p => p.id === proyActual.presupuestoActualId)
      : presupuestos.find(p => p.proyectoId === ganttProy);

    if (!presupuesto || !presupuesto.renglones || presupuesto.renglones.length === 0) {
      return { tasks: [], start: '', end: '', name: proyActual.nombre };
    }

    const startDate = proyActual.fechaInicio || todayISO();
    const endDate = proyActual.fechaFin || addDays(startDate, 90);
    const totalDays = daysBetween(startDate, endDate);
    const tasksPerDay = Math.floor(totalDays / presupuesto.renglones.length) || 1;

    const tasks = presupuesto.renglones.map((r, idx) => {
      const duration = Math.max(1, Math.ceil(duracionPorRendimiento(r.cantidad, r.rendimientoCuadrilla)));
      const offset = idx * tasksPerDay;
      const inicio = addDays(startDate, offset);
      const fin = addDays(inicio, duration - 1);
      return {
        id: r.id,
        codigo: r.codigo,
        nombre: r.nombre,
        cantidad: r.cantidad,
        unidad: r.unidad,
        rendimiento: r.rendimientoCuadrilla,
        fechaInicio: inicio,
        fechaFin: fin,
        avance: Math.min(100, Math.round((offset / totalDays) * 100)),
        subrenglones: r.subrenglones?.map(s => ({
          nombre: s.nombreMaterial,
          cantidad: s.cantidadUnitaria * r.cantidad,
          unidad: s.unidad,
        })),
      };
    });

    return { tasks, start: startDate, end: endDate, name: proyActual.nombre };
  }, [ganttProy, proyectos, presupuestos]);

  const handleUpdateGanttTask = useCallback((id: string, patch: Partial<GanttTask>) => {
    setGanttTasks(prev => {
      const current = prev[ganttProy] || [];
      return {
        ...prev,
        [ganttProy]: current.map(t => t.id === id ? { ...t, ...patch } : t),
      };
    });
  }, [ganttProy]);

  const saveProjectProgress = (id: string) => {
    const raw = pendingProgress[id] ?? '';
    const value = Math.min(100, Math.max(0, Number(raw)));
    if (!Number.isNaN(value)) {
      updateProyecto(id, { avanceFisico: value });
    }
    setEditingProject(null);
  };

  const startEditProjectProgress = (id: string, current: number) => {
    setEditingProject(id);
    setPendingProgress(prev => ({ ...prev, [id]: String(current) }));
  };

  const cancelProjectProgress = () => {
    setEditingProject(null);
  };

  const startEditBitacora = (entry: BitacoraEntry) => {
    setEditingBit(entry);
    setSelProy(entry.proyectoId);
    setBit({ clima: entry.clima, personal: String(entry.personal), maquinaria: entry.maquinaria, tareas: entry.tareas, observaciones: entry.observaciones });
    setBitFotos(entry.fotos || []);
    setBitFirma(entry.firma || '');
    setBitGeo(entry.lat ? { lat: entry.lat, lng: entry.lng || 0 } : null);
  };

  const cancelEditBitacora = () => {
    setEditingBit(null);
    setBit({ clima: 'Despejado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
    setBitFotos([]);
    setBitFirma('');
    setBitGeo(null);
  };

  const capturarGeo = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada en este navegador');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBitGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
        toast.success('Ubicación capturada');
      },
      () => {
        setGeoLoading(false);
        toast.error('No se pudo obtener la ubicación');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const agregarFoto = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === 'string' ? reader.result : null;
      if (data) {
        setBitFotos(prev => [...prev, data]);
        if (bitFotos.length === 0) toast.success('Foto agregada');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const quitarFoto = (idx: number) => {
    setBitFotos(prev => prev.filter((_, i) => i !== idx));
  };

  const guardarBit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selProy) return;
    const payload: Omit<BitacoraEntry, 'id'> = {
      proyectoId: selProy,
      fecha: editingBit?.fecha || todayISO(),
      clima: bit.clima,
      personal: +bit.personal || 0,
      maquinaria: bit.maquinaria,
      tareas: bit.tareas,
      observaciones: bit.observaciones,
      fotos: bitFotos.length > 0 ? bitFotos : undefined,
      firma: bitFirma || undefined,
      lat: bitGeo?.lat,
      lng: bitGeo?.lng,
    };

    if (editingBit) {
      updateBitacora(editingBit.id, payload);
      setEditingBit(null);
    } else {
      addBitacora(payload);
    }

    setBit({ clima: 'Despejado', personal: '12', maquinaria: 'Retroexcavadora', tareas: '', observaciones: '' });
    setBitFotos([]);
    setBitFirma('');
    setBitGeo(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-emerald-500" /> Seguimiento y Control</h1>
        <p className="text-sm text-slate-400">Avance físico-financiero, bitácora y valor ganado (EVM)</p>
      </div>

      <div className={`${CARD} overflow-hidden mb-4`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-left p-3">Proyecto</th>
                <th className="p-3 w-40">Avance Físico</th>
                <th className="p-3 w-40">Avance Financiero</th>
                <th className="p-3 text-right">Ingresos</th>
                <th className="p-3 text-right">Gastos</th>
                <th className="p-3 text-right">Pendiente de Aportar</th>
              </tr>
            </thead>
            <tbody>
              {proyData.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-xs text-slate-400 animate-pulse">Cargando proyectos...</td></tr>
              ) : proyData.map(p => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <div className="font-semibold text-slate-700">{p.nombre}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.estado === 'ejecucion' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{p.estado}</span>
                  </td>
                  <td className="p-3">
                    {editingProject === p.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={pendingProgress[p.id] ?? String(p.avanceFisico)}
                          onChange={e => setPendingProgress(prev => ({ ...prev, [p.id]: e.target.value }))}
                          placeholder="0-100"
                          className="w-20 px-2 py-1 border border-slate-200 rounded text-xs"
                        />
                        <button type="button" onClick={() => saveProjectProgress(p.id)} className="p-1 rounded bg-emerald-500 text-white text-xs"><Save className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={cancelProjectProgress} className="p-1 rounded bg-slate-100 text-slate-600 text-xs"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Progress value={p.avanceFisico} color="#3b82f6" />
                        <span className="text-xs font-semibold w-10">{p.avanceFisico}%</span>
                        <button type="button" onClick={() => startEditProjectProgress(p.id, p.avanceFisico)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="p-3"><div className="flex items-center gap-2"><Progress value={p.avanceFinanciero} color="#f97316" /><span className="text-xs font-semibold w-10">{p.avanceFinanciero}%</span></div></td>
                  <td className="p-3 text-right text-emerald-600 font-semibold">{fmtQ(p.ing)}</td>
                  <td className="p-3 text-right text-red-500 font-semibold">{fmtQ(p.gas)}</td>
                  <td className="p-3 text-right text-slate-700 font-bold">{fmtQ(p.pendiente)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagrama de Gantt */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" /> Cronograma de Actividades
          </h2>
          <select 
            value={ganttProy} 
            onChange={e => setGanttProy(e.target.value)} 
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-400 bg-white"
          >
            <option value="">Selecciona proyecto</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        {ganttProy && ganttData.tasks.length > 0 ? (
          <GanttChart
            tasks={ganttData.tasks}
            projectStart={ganttData.start}
            projectEnd={ganttData.end}
            projectName={ganttData.name}
            onUpdateTask={handleUpdateGanttTask}
          />
        ) : ganttProy ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No hay renglones de presupuesto para este proyecto.</p>
            <p className="text-xs mt-1">Ve a Presupuestos, crea un presupuesto con renglones y vincúlalo al proyecto.</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className={`${CARD}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`${CARD_TITLE}`}>Valor Ganado (EVM)</h3>
            <select value={selProy} onChange={e => setSelProy(e.target.value)} className="text-xs px-2 py-1 rounded border border-slate-200">
              <option value="">Selecciona proyecto</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Gauge value={CV} max={Math.abs(CV) + EV * 0.3 + 1} label="CV (Costo)" color={CV >= 0 ? '#10b981' : '#ef4444'} /><div className={`text-center text-xs font-bold ${CV >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtQ(CV)}</div></div>
            <div><Gauge value={SV} max={Math.abs(SV) + EV * 0.3 + 1} label="SV (Tiempo)" color={SV >= 0 ? '#10b981' : '#ef4444'} /><div className={`text-center text-xs font-bold ${SV >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtQ(SV)}</div></div>
          </div>
        </div>

        <div className={`${CARD}`}>
          <h3 className={`${CARD_TITLE}`}>Físico vs Financiero</h3>
          {proy && <BarChart height={150} data={[
            { label: 'Físico', value: proy.avanceFisico, color: '#3b82f6' },
            { label: 'Financ.', value: proy.avanceFinanciero, color: '#f97316' },
          ]} />}
        </div>

        <div className={`${CARD}`}>
          <h3 className={`${CARD_TITLE} flex items-center gap-1`}><Camera className="w-4 h-4 text-emerald-500" /> Bitácora Reciente</h3>
          <div className="space-y-2 max-h-44 overflow-y-auto">
            {bitacora.length === 0 && <p className="text-xs text-slate-400">Sin entradas. Registre el reporte diario abajo.</p>}
            {bitacora.slice(0, 6).map(b => (
              <div key={b.id} className="bg-slate-50 rounded-lg p-2 text-xs">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-semibold text-slate-600">{proyectos.find(p => p.id === b.proyectoId)?.nombre}</div>
                    <div className="text-slate-400 text-[10px]">{b.fecha}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => startEditBitacora(b)} className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => deleteBitacora(b.id)} className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500 mt-0.5"><CloudRain className="w-3 h-3" /> {b.clima} · {b.personal} pers.</div>
                {b.tareas && <p className="text-slate-500 mt-0.5">{b.tareas}</p>}
                {b.observaciones && <p className="text-slate-500 mt-0.5 italic">{b.observaciones}</p>}
                {b.fotos && b.fotos.length > 0 && <p className="text-emerald-600 text-[10px] mt-0.5">📷 {b.fotos.length} foto(s)</p>}
                {b.firma && <p className="text-purple-600 text-[10px] mt-0.5">✍️ Firmado</p>}
                {b.lat && <p className="text-blue-600 text-[10px] mt-0.5">📍 Con ubicación</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={guardarBit} className={`${CARD}`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`${CARD_TITLE}`}>{editingBit ? 'Editar entrada de Bitácora' : 'Reporte Diario de Campo (Bitácora Digital)'}</h3>
            {editingBit && <p className="text-xs text-slate-500">Editando registro de {proyectos.find(p => p.id === editingBit.proyectoId)?.nombre}</p>}
          </div>
          {editingBit && (
            <button type="button" onClick={cancelEditBitacora} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1"><X className="w-3.5 h-3.5" /> Cancelar</button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select value={selProy} onChange={e => setSelProy(e.target.value)} className={`${INPUT} col-span-2`}>
            <option value="">Selecciona proyecto</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <input value={bit.clima} onChange={e => setBit({ ...bit, clima: e.target.value })} placeholder="Clima (soleado, nublado, lluvia)" className={INPUT} />
          <input type="number" value={bit.personal} onChange={e => setBit({ ...bit, personal: e.target.value })} placeholder="Personal activo" className={INPUT} />
          <input value={bit.maquinaria} onChange={e => setBit({ ...bit, maquinaria: e.target.value })} placeholder="Maquinaria/equipo utilizado" className={`${INPUT} md:col-span-2`} />
          <input value={bit.tareas} onChange={e => setBit({ ...bit, tareas: e.target.value })} placeholder="Tareas ejecutadas" className={`${INPUT} md:col-span-2`} />
        </div>

        {/* Campos adicionales: foto, geo, firma */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Foto */}
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
            <button type="button" onClick={agregarFoto} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
              <Camera className="w-4 h-4" /> {bitFotos.length > 0 ? `${bitFotos.length} foto(s)` : 'Agregar foto'}
            </button>
            {bitFotos.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {bitFotos.map((foto, idx) => (
                  <div key={idx} className="relative group">
                    <img src={foto} alt={`Foto ${idx + 1}`} className="w-12 h-12 rounded object-cover border border-slate-200" />
                    <button type="button" onClick={() => quitarFoto(idx)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Geolocalización */}
          <div>
            <button type="button" onClick={capturarGeo} disabled={geoLoading} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50">
              <MapPin className="w-4 h-4" /> 
              {geoLoading ? 'Obteniendo ubicación...' : bitGeo ? `📍 ${bitGeo.lat.toFixed(4)}, ${bitGeo.lng.toFixed(4)}` : 'Capturar ubicación'}
            </button>
          </div>

          {/* Firma digital */}
          <div>
            <details className="group">
              <summary className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 hover:border-purple-400 hover:text-purple-600 transition-colors">
                <Fingerprint className="w-4 h-4" /> {bitFirma ? '✍️ Firmado' : 'Agregar firma'}
              </summary>
              <div className="mt-2">
                <SignaturePad value={bitFirma} onChange={setBitFirma} width={350} height={120} />
              </div>
            </details>
          </div>
        </div>

        <button type="submit" className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"><Plus className="w-4 h-4" /> {editingBit ? 'Guardar cambios' : 'Registrar Reporte'}</button>
      </form>

      {/* Avance de Obra */}
      <div className="mt-4">
        <AvanceObraModal />
      </div>

      {/* Checklist de Calidad */}
      <div className="mt-4">
        <ChecklistCalidad />
      </div>
    </div>
  );
};

export default Seguimiento;