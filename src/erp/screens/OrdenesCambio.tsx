import React, { useEffect, useMemo, useState } from 'react';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { OrdenCambio } from '../types';
import { fmtQ, todayISO } from '../utils';
import { GitBranch, Plus, Check, X, Clock, ChevronRight, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type EstadoOC = OrdenCambio['estado'];

const OrdenesCambio: React.FC = () => {
  const { proyectos, user, ordenesCambio, addOrdenCambio, updateOrdenCambio } = useErp();
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);
  const [showForm, setShowForm] = useState(false);
  const [proyectoFilter, setProyectoFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fTitulo, setFTitulo] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fCosto, setFCosto] = useState(0);
  const [fPlazo, setFPlazo] = useState(0);



  const filtered = useMemo(() => {
    if (!proyectoFilter) return ordenesCambio;
    return ordenesCambio.filter(o => o.proyectoId === proyectoFilter);
  }, [ordenesCambio, proyectoFilter]);

  const handleCrear = () => {
    if (!fTitulo.trim()) { toast.error('Título requerido'); return; }
    if (!proyectoFilter) { toast.error('Selecciona un proyecto'); return; }
    addOrdenCambio({
      proyectoId: proyectoFilter,
      titulo: fTitulo.trim(),
      descripcion: fDesc.trim(),
      solicitante: user?.nombre || 'Anónimo',
      solicitanteRol: user?.rol || 'Residente',
      estado: 'solicitud',
      impactoCosto: fCosto,
      impactoPlazo: fPlazo,
      createdAt: new Date().toISOString(),
    });
    toast.success('Solicitud de cambio creada');
    setFTitulo(''); setFDesc(''); setFCosto(0); setFPlazo(0);
    setShowForm(false);
  };

  const handleAprobar = (id: string) => {
    updateOrdenCambio(id, { estado: 'aprobado', aprobador: user?.nombre || 'Gerente', fechaAprobacion: todayISO() });
    toast.success('Cambio aprobado');
  };

  const handleRechazar = (id: string) => {
    updateOrdenCambio(id, { estado: 'rechazado', aprobador: user?.nombre || 'Gerente', fechaAprobacion: todayISO() });
    toast.info('Cambio rechazado');
  };

  const estadoConfig: Record<EstadoOC, { color: string; bg: string; label: string }> = {
    solicitud: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Solicitud' },
    revision: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'En Revisión' },
    aprobado: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Aprobado' },
    rechazado: { color: 'text-red-600', bg: 'bg-red-50', label: 'Rechazado' },
  };

  const pendientes = ordenesCambio.filter(o => o.estado === 'solicitud' || o.estado === 'revision').length;
  const costoTotal = ordenesCambio.filter(o => o.estado === 'aprobado').reduce((a, o) => a + o.impactoCosto, 0);

  if (loading) return <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-64 rounded-2xl" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-[1000px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-amber-500" /> Órdenes de Cambio
        </h1>
        <div className="flex flex-wrap gap-2">
          <ProyectoFilter value={proyectoFilter} onChange={setProyectoFilter} proyectos={proyectos} />
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Nueva
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="text-[10px] text-slate-400">Total Órdenes</div>
          <div className="text-lg font-bold text-slate-800">{ordenesCambio.length}</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
          <div className="text-[10px] text-amber-600">Pendientes</div>
          <div className="text-lg font-bold text-amber-600">{pendientes}</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
          <div className="text-[10px] text-emerald-600">Costo Aprobado</div>
          <div className="text-lg font-bold text-emerald-600">{fmtQ(costoTotal)}</div>
        </div>
      </div>

      {showForm && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-sm text-slate-700 mb-3">📝 Nueva Solicitud de Cambio</h3>
          <div className="space-y-2">
            <input value={fTitulo} onChange={e => setFTitulo(e.target.value)} placeholder="Título del cambio *" className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-amber-400" />
            <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Descripción detallada del cambio..." rows={2} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-amber-400 resize-none" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 mb-0.5 block">Impacto Costo (Q)</label>
                <input type="number" value={fCosto || ''} onChange={e => setFCosto(+e.target.value)} min={0} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 mb-0.5 block">Impacto Plazo (días)</label>
                <input type="number" value={fPlazo || ''} onChange={e => setFPlazo(+e.target.value)} min={0} className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCrear} className="text-xs px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-medium">Enviar Solicitud</button>
              <button onClick={() => setShowForm(false)} className="text-xs px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <GitBranch className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Sin órdenes de cambio</p>
          </div>
        )}
        {filtered.map(oc => {
          const cfg = estadoConfig[oc.estado];
          const isOpen = expanded === oc.id;
          return (
            <div key={oc.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : oc.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${oc.estado === 'aprobado' ? 'bg-emerald-400' : oc.estado === 'rechazado' ? 'bg-red-400' : oc.estado === 'revision' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-700 truncate">{oc.titulo}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {oc.createdAt?.slice(0, 10)} · {oc.solicitante}
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-slate-700">{fmtQ(oc.impactoCosto)}</div>
                  <div className="text-[9px] text-slate-400">+{oc.impactoPlazo} días</div>
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-600 mb-3">{oc.descripcion}</p>
                  {oc.aprobador && (
                    <div className="text-[10px] text-slate-400 mb-2">
                      Aprobado por: <span className="font-medium text-slate-600">{oc.aprobador}</span> — {oc.fechaAprobacion}
                    </div>
                  )}
                  {(oc.estado === 'solicitud' || oc.estado === 'revision') && (user?.rol === 'Administrador' || user?.rol === 'Gerente') && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleAprobar(oc.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
                        <Check className="w-3 h-3" /> Aprobar
                      </button>
                      <button onClick={() => handleRechazar(oc.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600">
                        <X className="w-3 h-3" /> Rechazar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdenesCambio;
