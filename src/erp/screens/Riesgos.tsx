import React, { useState, useMemo, useEffect } from 'react';
import { useErp } from '../store';
import { Riesgo } from '../types';
import { AlertTriangle, Shield, Plus, X, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { INPUT } from '../ui';
import { toast } from 'sonner';
import { todayISO } from '../utils';

const calcularNivel = (prob: number, imp: number): Riesgo['nivel'] => {
  const score = prob * imp;
  if (score >= 15) return 'critico';
  if (score >= 8) return 'alto';
  if (score >= 4) return 'medio';
  return 'bajo';
};

const Riesgos: React.FC = () => {
  const { proyectos, selectedProyectoId, setSelectedProyectoId, riesgos, addRiesgo, updateRiesgo, deleteRiesgo, addNotificacion } = useErp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    proyectoId: '',
    nombre: '',
    descripcion: '',
    tipo: 'tecnico' as Riesgo['tipo'],
    probabilidad: 2 as 1|2|3|4|5,
    impacto: 2 as 1|2|3|4|5,
    planMitigacion: '',
    responsable: '',
    costoSoporte: 0,
  });

  useEffect(() => {
    if (selectedProyectoId && !form.proyectoId) {
      setForm(prev => ({ ...prev, proyectoId: selectedProyectoId }));
    }
  }, [selectedProyectoId, form.proyectoId]);

  const notifyCriticos = (todos: Riesgo[]) => {
    const criticos = todos.filter(ri => ri.nivel === 'critico' && ri.estado === 'identificado');
    if (criticos.length > 0 && selectedProyectoId) {
      const proy = proyectos.find(p => p.id === selectedProyectoId);
      addNotificacion('general', 'Riesgos críticos sin mitigar', `${criticos.length} riesgo(s) crítico(s) en ${proy?.nombre || 'el proyecto'}`, selectedProyectoId || undefined);
    }
  };

  const agregar = () => {
    if (!form.nombre.trim() || !form.proyectoId) {
      toast.error('Nombre y proyecto son requeridos');
      return;
    }
    const nuevo: Riesgo = {
      id: crypto.randomUUID(),
      proyectoId: form.proyectoId,
      nombre: form.nombre,
      descripcion: form.descripcion,
      tipo: form.tipo,
      probabilidad: form.probabilidad,
      impacto: form.impacto,
      nivel: calcularNivel(form.probabilidad, form.impacto),
      planMitigacion: form.planMitigacion,
      responsable: form.responsable,
      fechaIdentificacion: todayISO(),
      estado: 'identificado',
      costoSoporte: form.costoSoporte || undefined,
      createdAt: new Date().toISOString(),
    };
    addRiesgo(nuevo);
    notifyCriticos([nuevo, ...riesgos]);
    toast.success('Riesgo registrado');
    setShowForm(false);
    setForm({ proyectoId: selectedProyectoId || '', nombre: '', descripcion: '', tipo: 'tecnico', probabilidad: 2, impacto: 2, planMitigacion: '', responsable: '', costoSoporte: 0 });
  };

  const actualizarEstado = (id: string, estado: Riesgo['estado']) => {
    updateRiesgo(id, { estado });
    if (estado === 'materializado') {
      const riesgo = riesgos.find(r => r.id === id);
      addNotificacion('general', 'Riesgo materializado', `"${riesgo?.nombre}" se ha materializado.`, riesgo?.proyectoId);
    }
  };

  const eliminar = (id: string) => {
    if (!confirm('¿Eliminar este riesgo?')) return;
    deleteRiesgo(id);
  };

  const nivelColor = (n: Riesgo['nivel']) => {
    const map = { bajo: 'bg-emerald-50 text-emerald-600', medio: 'bg-amber-50 text-amber-600', alto: 'bg-orange-50 text-orange-600', critico: 'bg-red-50 text-red-600' };
    return map[n];
  };

  const riesgosFiltrados = useMemo(() => {
    if (!selectedProyectoId) return riesgos;
    return riesgos.filter(r => r.proyectoId === selectedProyectoId);
  }, [riesgos, selectedProyectoId]);

  const proyActual = selectedProyectoId ? proyectos.find(p => p.id === selectedProyectoId) : null;
  const matrizRiesgos = riesgosFiltrados.filter(r => r.estado !== 'mitigado').length;
  const costoSoportable = riesgosFiltrados.filter(r => r.estado === 'materializado').reduce((a, r) => a + (r.costoSoporte || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" /> Gestión de Riesgos
            {proyActual && <span className="text-base font-normal text-slate-400">— {proyActual.nombre}</span>}
          </h1>
          <p className="text-sm text-slate-400">Identificación, evaluación y mitigación de riesgos del proyecto</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Riesgo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-xs text-slate-500">Riesgos activos</span></div>
          <div className="text-xl font-bold text-slate-800">{matrizRiesgos}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-red-500" /><span className="text-xs text-slate-500">Críticos/Altos</span></div>
          <div className="text-xl font-bold text-red-600">{riesgosFiltrados.filter(r => r.nivel === 'critico' || r.nivel === 'alto').length}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2"><TrendingDown className="w-4 h-4 text-emerald-500" /><span className="text-xs text-slate-500">Mitigados</span></div>
          <div className="text-xl font-bold text-emerald-600">{riesgosFiltrados.filter(r => r.estado === 'mitigado').length}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-xs text-slate-500">Costo soportado</span></div>
          <div className="text-xl font-bold text-slate-800">Q{costoSoportable.toLocaleString()}</div>
        </div>
      </div>

      {/* Filtro global por proyecto */}
      {proyectos.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={selectedProyectoId || ''} onChange={e => setSelectedProyectoId(e.target.value || null)} className={`${INPUT} max-w-xs`}>
            <option value="">Todos los proyectos</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-slate-100 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">🎯 Matriz de Calor (Probabilidad × Impacto)</h3>
          <div className="flex gap-2 text-[9px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Bajo</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Medio</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />Alto</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Crítico</span>
          </div>
        </div>
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0">
            <div className="text-[9px] text-slate-400 text-center mb-1">Impacto →</div>
            <div className="grid grid-cols-5 gap-0.5" style={{ gridTemplateColumns: 'repeat(5, 44px)' }}>
              {[5,4,3,2,1].map(prob => 
                [1,2,3,4,5].map(imp => {
                  const nivel = calcularNivel(prob as 1|2|3|4|5, imp as 1|2|3|4|5);
                  const colorMap: Record<string, string> = { bajo: 'bg-emerald-100', medio: 'bg-amber-100', alto: 'bg-orange-100', critico: 'bg-red-100' };
                  const dotColorMap: Record<string, string> = { bajo: 'bg-emerald-500', medio: 'bg-amber-500', alto: 'bg-orange-500', critico: 'bg-red-500' };
                  const riesgosEnCelda = riesgosFiltrados.filter(r => r.probabilidad === prob && r.impacto === imp && r.estado !== 'mitigado');
                  return (
                    <div key={`${prob}-${imp}`} className={`w-[44px] h-[44px] rounded relative ${colorMap[nivel]} flex items-center justify-center font-bold text-[9px]`}>
                      <span className="text-slate-500">{prob * imp}</span>
                      {riesgosEnCelda.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-slate-800 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow">
                          {riesgosEnCelda.length}
                        </div>
                      )}
                      {riesgosEnCelda.length > 0 && riesgosEnCelda.length <= 3 && (
                        <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                          {riesgosEnCelda.slice(0, 3).map((r, i) => (
                            <span key={i} className={`w-2 h-2 rounded-full ${dotColorMap[nivel]} shadow-sm border border-white`} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="text-[9px] text-slate-400 text-center mt-1">← Probabilidad (1-5 arriba a abajo)</div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 mb-2">Riesgos por nivel:</p>
            <div className="space-y-1.5">
              {(['critico', 'alto', 'medio', 'bajo'] as const).map(nivel => {
                const count = riesgosFiltrados.filter(r => r.nivel === nivel && r.estado !== 'mitigado').length;
                const colorMap: Record<string, string> = { bajo: 'bg-emerald-100 text-emerald-700', medio: 'bg-amber-100 text-amber-700', alto: 'bg-orange-100 text-orange-700', critico: 'bg-red-100 text-red-700' };
                return (
                  <div key={nivel} className={`flex items-center justify-between px-2 py-1 rounded-lg text-[10px] ${colorMap[nivel]}`}>
                    <span className="font-semibold capitalize">{nivel}</span>
                    <span className="font-bold">{count} riesgo{count !== 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
            {riesgosFiltrados.filter(r => r.estado !== 'mitigado').length === 0 && (
              <p className="text-[10px] text-slate-400 text-center py-2">Sin riesgos activos</p>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del riesgo *" className={INPUT} />
            <select value={form.proyectoId} onChange={e => setForm(p => ({ ...p, proyectoId: e.target.value }))} className={INPUT}>
              <option value="">Seleccionar proyecto *</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as any }))} className={INPUT}>
              <option value="tecnico">Técnico</option>
              <option value="financiero">Financiero</option>
              <option value="cronograma">Cronograma</option>
              <option value="legal">Legal</option>
              <option value="ambiental">Ambiental</option>
              <option value="seguridad">Seguridad</option>
              <option value="otro">Otro</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-500">Probabilidad (1-5)</label>
              <input type="number" min={1} max={5} value={form.probabilidad} onChange={e => setForm(p => ({ ...p, probabilidad: Math.min(5, Math.max(1, +e.target.value)) as any }))} className={INPUT} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-500">Impacto (1-5)</label>
              <input type="number" min={1} max={5} value={form.impacto} onChange={e => setForm(p => ({ ...p, impacto: Math.min(5, Math.max(1, +e.target.value)) as any }))} className={INPUT} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción del riesgo" className={`${INPUT} min-h-[60px]`} />
            <textarea value={form.planMitigacion} onChange={e => setForm(p => ({ ...p, planMitigacion: e.target.value }))} placeholder="Plan de mitigación" className={`${INPUT} min-h-[60px]`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input value={form.responsable} onChange={e => setForm(p => ({ ...p, responsable: e.target.value }))} placeholder="Responsable" className={INPUT} />
            <input type="number" value={form.costoSoporte || ''} onChange={e => setForm(p => ({ ...p, costoSoporte: +e.target.value }))} placeholder="Costo estimado de soporte Q" className={INPUT} />
          </div>
          <div className="flex gap-2">
            <button onClick={agregar} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-xs font-semibold">Registrar Riesgo</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {riesgosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Shield className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Sin riesgos para {proyActual?.nombre || 'el filtro actual'}. Identifica el primero.</p>
          </div>
        ) : riesgosFiltrados.map(r => (
          <div key={r.id} className={`bg-white rounded-xl border p-4 ${nivelColor(r.nivel).split(' ')[0]} bg-opacity-20`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${nivelColor(r.nivel)}`}>{r.nivel.toUpperCase()}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{r.tipo}</span>
                  <span className="text-[10px] text-slate-400">{proyectos.find(p => p.id === r.proyectoId)?.nombre || '—'}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{r.nombre}</p>
                {r.descripcion && <p className="text-xs text-slate-500 mt-0.5">{r.descripcion}</p>}
                <div className="flex gap-3 mt-2 text-[10px] text-slate-400">
                  <span>🎲 P:{r.probabilidad} I:{r.impacto} = {r.probabilidad * r.impacto}pts</span>
                  {r.responsable && <span>👤 {r.responsable}</span>}
                  {r.costoSoporte ? <span>💰 Q{r.costoSoporte.toLocaleString()}</span> : null}
                  <span>📅 {r.fechaIdentificacion}</span>
                </div>
                {r.planMitigacion && <div className="mt-1 text-[10px] text-slate-500 italic">🛡️ {r.planMitigacion}</div>}
              </div>
              <div className="flex gap-1 shrink-0 ml-2">
                <select value={r.estado} onChange={e => actualizarEstado(r.id, e.target.value as any)}
                  className={`text-[10px] px-1.5 py-1 rounded-lg border ${r.estado === 'mitigado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : r.estado === 'materializado' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                  <option value="identificado">Identificado</option>
                  <option value="en_mitigacion">En mitigación</option>
                  <option value="mitigado">Mitigado</option>
                  <option value="materializado">Materializado</option>
                </select>
                <button onClick={() => eliminar(r.id)} className="p-1 text-slate-300 hover:text-red-500"><X className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Riesgos;
