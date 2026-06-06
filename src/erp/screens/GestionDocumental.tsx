import React, { useState } from 'react';
import { useErp } from '../store';
import type { Plano, RFI, Submittal } from '../types';
import { toast } from 'sonner';
import { FileText, Plus, Upload, Send, MessageSquare, Package } from 'lucide-react';
import { INPUT } from '../ui';
import { todayISO } from '../utils';
import { z } from 'zod';

// Zod schemas
const planoSchema = z.object({
  nombre: z.string().min(1, 'Nombre del plano requerido').max(200, 'Máximo 200 caracteres'),
  disciplina: z.enum(['arquitectura', 'estructura', 'electricas', 'sanitarias', 'mecanicas', 'otra']),
  version: z.string().min(1, 'Versión requerida').max(20, 'Máximo 20 caracteres'),
});
const rfiSchema = z.object({
  titulo: z.string().min(1, 'Título requerido').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().min(1, 'Descripción requerida').max(2000, 'Máximo 2000 caracteres'),
  destino: z.string().min(1, 'Destino requerido').max(200, 'Máximo 200 caracteres'),
});
const submittalSchema = z.object({
  titulo: z.string().min(1, 'Título requerido').max(200, 'Máximo 200 caracteres'),
  categoria: z.enum(['material', 'equipo', 'especificacion', 'otro']),
  proveedor: z.string().min(1, 'Proveedor requerido').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().max(2000, 'Máximo 2000 caracteres').optional().default(''),
  estado: z.enum(['pendiente', 'aprobado', 'rechazado', 'revision']),
  fechaLimite: z.string().min(1, 'Fecha requerida'),
});

type TabDoc = 'planos' | 'rfis' | 'submittals';

const GestionDocumental: React.FC = () => {
  const { proyectos, user } = useErp();
  const [tab, setTab] = useState<TabDoc>('planos');
  const [selProyecto, setSelProyecto] = useState('');

  // === STORAGE KEYS ===
  const PLANO_KEY = 'wm_planos';
  const RFI_KEY = 'wm_rfis';
  const SUB_KEY = 'wm_submittals';
  const VERSION_KEY = 'wm_plano_versiones';

  // === STATE ===
  const [planos, setPlanos] = useState<Plano[]>(() => {
    try { return JSON.parse(localStorage.getItem(PLANO_KEY) || '[]'); } catch { return []; }
  });
  const [rfis, setRfis] = useState<RFI[]>(() => {
    try { return JSON.parse(localStorage.getItem(RFI_KEY) || '[]'); } catch { return []; }
  });
  const [submittals, setSubmittals] = useState<Submittal[]>(() => {
    try { return JSON.parse(localStorage.getItem(SUB_KEY) || '[]'); } catch { return []; }
  });
  const [versiones, setVersiones] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem(VERSION_KEY) || '{}'); } catch { return {}; }
  });
  const [gdFormErrors, setGdFormErrors] = useState<Record<string, string>>({});

  const save = (key: string, data: unknown) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const clearGdError = (field: string) => setGdFormErrors(prev => ({ ...prev, [field]: '' }));
  const resetGdErrors = () => setGdFormErrors({});

  const _proyectoActual = proyectos.find(p => p.id === selProyecto);
  const _rfiCount = rfis.filter(r => !selProyecto || r.proyectoId === selProyecto).length;
  const _subCount = submittals.filter(s => !selProyecto || s.proyectoId === selProyecto).length;

  // === PLANO FORM ===
  const [showPlanoForm, setShowPlanoForm] = useState(false);
  const [planoForm, setPlanoForm] = useState({ nombre: '', disciplina: 'arquitectura' as Plano['disciplina'], version: '1.0', descripcion: '' });

  const handleAddPlano = () => {
    if (!selProyecto) { toast.error('Selecciona un proyecto'); return; }
    const planoResult = planoSchema.safeParse(planoForm);
    if (!planoResult.success) {
      const errs: Record<string, string> = {};
      planoResult.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setGdFormErrors(errs);
      toast.error(planoResult.error.errors[0].message);
      return;
    }
    setGdFormErrors({});
    const nuevo: Plano = {
      id: Date.now().toString(),
      proyectoId: selProyecto,
      nombre: planoResult.data.nombre,
      disciplina: planoResult.data.disciplina,
      version: planoResult.data.version,
      fechaSubida: todayISO(),
      descripcion: planoForm.descripcion || undefined,
      estado: 'vigente',
      subidoPor: user?.nombre || 'Anónimo',
    };
    const updated = [nuevo, ...planos];
    setPlanos(updated);
    save(PLANO_KEY, updated);
    // Track version
    const vid = nuevo.id;
    const vers = versiones[vid] || [];
    const newVers = [...vers, nuevo.version];
    const newVersiones = { ...versiones, [vid]: newVers };
    setVersiones(newVersiones);
    save(VERSION_KEY, newVersiones);
    toast.success(`Plano "${planoForm.nombre}" v${planoForm.version} subido`);
    setShowPlanoForm(false);
    setPlanoForm({ nombre: '', disciplina: 'arquitectura', version: '1.0', descripcion: '' });
  };

  const togglePlanoEstado = (id: string) => {
    const updated = planos.map(p => {
      if (p.id !== id) return p;
      const next: Plano['estado'] = p.estado === 'vigente' ? 'obsoleto' : 'vigente';
      return { ...p, estado: next };
    });
    setPlanos(updated);
    save(PLANO_KEY, updated);
    toast.success('Estado actualizado');
  };

  const addVersionPlano = (id: string) => {
    const plano = planos.find(p => p.id === id);
    if (!plano) return;
    const [major, minor] = plano.version.split('.').map(Number);
    const newVer = `${major}.${(minor || 0) + 1}`;
    const updated = planos.map(p => p.id === id ? { ...p, version: newVer, fechaSubida: todayISO(), estado: 'vigente' } : p);
    setPlanos(updated);
    save(PLANO_KEY, updated);
    const vers = versiones[id] || [];
    const newVers = [...vers, newVer];
    const newVersiones = { ...versiones, [id]: newVers };
    setVersiones(newVersiones);
    save(VERSION_KEY, newVersiones);
    toast.success(`Nueva versión ${newVer}`);
  };

  // === RFI FORM ===
  const [showRFIForm, setShowRFIForm] = useState(false);
  const [rfiForm, setRfiForm] = useState({ titulo: '', descripcion: '', destino: '' });

  const handleAddRFI = () => {
    if (!selProyecto) { toast.error('Selecciona un proyecto'); return; }
    const rfiResult = rfiSchema.safeParse(rfiForm);
    if (!rfiResult.success) {
      const errs: Record<string, string> = {};
      rfiResult.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setGdFormErrors(errs);
      toast.error(rfiResult.error.errors[0].message);
      return;
    }
    setGdFormErrors({});
    const count = rfis.filter(r => r.proyectoId === selProyecto).length + 1;
    const nueva: RFI = {
      id: Date.now().toString(),
      proyectoId: selProyecto,
      numero: `RFI-${selProyecto.slice(0, 4)}-${String(count).padStart(3, '0')}`,
      titulo: rfiResult.data.titulo,
      descripcion: rfiResult.data.descripcion,
      solicitante: user?.nombre || 'Anónimo',
      destino: rfiForm.destino,
      estado: 'abierto',
      fechaSolicitud: todayISO(),
    };
    const updated = [nueva, ...rfis];
    setRfis(updated);
    save(RFI_KEY, updated);
    toast.success(`RFI ${nueva.numero} creado`);
    setShowRFIForm(false);
    setRfiForm({ titulo: '', descripcion: '', destino: '' });
  };

  const actualizarRFI = (id: string, estado: RFI['estado'], respuesta?: string) => {
    const updated = rfis.map(r => r.id === id ? { ...r, estado, respuesta, fechaRespuesta: respuesta ? todayISO() : r.fechaRespuesta } : r);
    setRfis(updated);
    save(RFI_KEY, updated);
    toast.success(`RFI actualizado: ${estado}`);
  };

  // === SUBMITTAL FORM ===
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState({ titulo: '', descripcion: '', categoria: 'material' as Submittal['categoria'], proveedor: '' });

  const handleAddSubmittal = () => {
    if (!selProyecto) { toast.error('Selecciona un proyecto'); return; }
    const subResult = submittalSchema.safeParse({
      titulo: subForm.titulo,
      categoria: subForm.categoria,
      proveedor: subForm.proveedor,
      descripcion: subForm.descripcion,
      estado: 'pendiente' as const,
      fechaLimite: todayISO(),
    });
    if (!subResult.success) {
      const errs: Record<string, string> = {};
      subResult.error.errors.forEach(err => { errs[err.path[0] as string] = err.message; });
      setGdFormErrors(errs);
      toast.error(subResult.error.errors[0].message);
      return;
    }
    setGdFormErrors({});
    const nuevo: Submittal = {
      id: Date.now().toString(),
      proyectoId: selProyecto,
      titulo: subResult.data.titulo,
      descripcion: subForm.descripcion,
      categoria: subForm.categoria,
      proveedor: subForm.proveedor,
      fechaEnvio: todayISO(),
      estado: 'pendiente',
    };
    const updated = [nuevo, ...submittals];
    setSubmittals(updated);
    save(SUB_KEY, updated);
    toast.success('Submittal registrado');
    setShowSubForm(false);
    setSubForm({ titulo: '', descripcion: '', categoria: 'material', proveedor: '' });
  };

  const actualizarSubmittal = (id: string, estado: Submittal['estado']) => {
    const updated = submittals.map(s => s.id === id ? { ...s, estado } : s);
    setSubmittals(updated);
    save(SUB_KEY, updated);
    toast.success(`Submittal: ${estado}`);
  };

  const tabs = [
    { id: 'planos' as TabDoc, label: 'Planos', icon: FileText },
    { id: 'rfis' as TabDoc, label: 'RFIs', icon: MessageSquare },
    { id: 'submittals' as TabDoc, label: 'Submittals', icon: Package },
  ];

  const disciplinas: { value: Plano['disciplina']; label: string }[] = [
    { value: 'arquitectura', label: 'Arquitectura' },
    { value: 'estructura', label: 'Estructura' },
    { value: 'instalaciones', label: 'Instalaciones' },
    { value: 'electricas', label: 'Eléctricas' },
    { value: 'sanitarias', label: 'Sanitarias' },
    { value: 'otra', label: 'Otra' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-500" /> Gestión Documental
        </h1>
        <select
          value={selProyecto}
          onChange={e => setSelProyecto(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-400 bg-white"
        >
          <option value="">— Todos los proyectos —</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-card text-card-foreground rounded-xl p-3 border border-border">
          <div className="text-[10px] text-muted-foreground">Planos</div>
          <div className="text-lg font-bold text-foreground">{planos.filter(p => !selProyecto || p.proyectoId === selProyecto).length}</div>
        </div>
        <div className="bg-card text-card-foreground rounded-xl p-3 border border-border">
          <div className="text-[10px] text-muted-foreground">RFIs Activos</div>
          <div className="text-lg font-bold text-warning">{rfis.filter(r => r.estado !== 'cerrado' && (!selProyecto || r.proyectoId === selProyecto)).length}</div>
        </div>
        <div className="bg-card text-card-foreground rounded-xl p-3 border border-border">
          <div className="text-[10px] text-muted-foreground">Submittals Pendientes</div>
          <div className="text-lg font-bold text-info">{submittals.filter(s => s.estado === 'pendiente' && (!selProyecto || s.proyectoId === selProyecto)).length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-muted p-1 rounded-xl">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========== PLANOS ========== */}
      {tab === 'planos' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" /> Planos por Disciplina
            </h2>
            <button onClick={() => { setShowPlanoForm(true); resetGdErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600">
              <Upload className="w-3.5 h-3.5" /> Subir Plano
            </button>
          </div>

          {showPlanoForm && (
            <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={planoForm.nombre} onChange={e => setPlanoForm(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Nombre del plano" className="w-full px-3 py-2 text-xs rounded-lg border border-blue-200 outline-none focus:border-blue-400" />
                <select value={planoForm.disciplina} onChange={e => setPlanoForm(prev => ({ ...prev, disciplina: e.target.value as Plano['disciplina'] }))} className={INPUT}>
                  {disciplinas.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={planoForm.version} onChange={e => setPlanoForm(prev => ({ ...prev, version: e.target.value }))} placeholder="Versión (ej: 1.0)" className={INPUT} />
                <input value={planoForm.descripcion} onChange={e => setPlanoForm(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="Descripción (opcional)" className={INPUT} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddPlano} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold">Subir Plano</button>
                <button onClick={() => setShowPlanoForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancelar</button>
              </div>
            </div>
          )}

          {/* Historial de versiones */}
          {Object.keys(versiones).length > 0 && (
            <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Historial de Versiones</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(versiones).map(([planoId, vers]) => {
                  const plano = planos.find(p => p.id === planoId);
                  if (!plano) return null;
                  return (
                    <div key={planoId} className="text-[10px] bg-white border border-slate-200 rounded px-2 py-1">
                      <span className="font-semibold text-slate-700">{plano.nombre}</span>: {vers.join(' → ')}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {planos.filter(p => !selProyecto || p.proyectoId === selProyecto).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-sm">Sin planos registrados</p>
              </div>
            ) : (
              planos.filter(p => !selProyecto || p.proyectoId === selProyecto).map(p => (
                <div key={p.id} className={`p-3 rounded-lg border ${p.estado === 'vigente' ? 'bg-card border-border' : p.estado === 'obsoleto' ? 'bg-muted border-border opacity-60' : 'bg-warning/10 border-warning/30'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-info/10 text-info font-medium">{p.disciplina}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          p.estado === 'vigente' ? 'bg-success/10 text-success' : p.estado === 'obsoleto' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                        }`}>{p.estado}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{p.nombre}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>📄 v{p.version}</span>
                        <span>📅 {p.fechaSubida}</span>
                        <span>👤 {p.subidoPor}</span>
                      </div>
                      {p.descripcion && <p className="text-[10px] text-muted-foreground mt-1">{p.descripcion}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button onClick={() => addVersionPlano(p.id)} className="px-2 py-1 bg-blue-500 text-white rounded text-[10px] hover:bg-blue-600" title="Nueva versión">+v</button>
                      <button onClick={() => togglePlanoEstado(p.id)} className={`px-2 py-1 rounded text-[10px] ${p.estado === 'vigente' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}>
                        {p.estado === 'vigente' ? 'Obsoleto' : 'Activar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========== RFIs ========== */}
      {tab === 'rfis' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-amber-500" /> Request for Information (RFI)
            </h2>
            <button onClick={() => { setShowRFIForm(true); resetGdErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600">
              <Send className="w-3.5 h-3.5" /> Nuevo RFI
            </button>
          </div>

          {showRFIForm && (
            <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200 space-y-2">
              <input value={rfiForm.titulo} onChange={e => setRfiForm(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Título del RFI" className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 outline-none focus:border-amber-400" />
              <textarea value={rfiForm.descripcion} onChange={e => setRfiForm(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="Descripción detallada..." className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 outline-none focus:border-amber-400 min-h-[60px]" />
              <input value={rfiForm.destino} onChange={e => setRfiForm(prev => ({ ...prev, destino: e.target.value }))} placeholder="Destinatario (ej: Arquitecto de proyecto)" className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 outline-none focus:border-amber-400" />
              <div className="flex gap-2">
                <button onClick={handleAddRFI} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg text-xs font-semibold">Enviar RFI</button>
                <button onClick={() => setShowRFIForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {rfis.filter(r => !selProyecto || r.proyectoId === selProyecto).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-sm">Sin RFIs registrados</p>
              </div>
            ) : (
              rfis.filter(r => !selProyecto || r.proyectoId === selProyecto).map(r => (
                <div key={r.id} className={`p-3 rounded-lg border ${r.estado === 'cerrado' ? 'bg-success/10 border-success/30' : 'bg-card border-border'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded">{r.numero}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          r.estado === 'abierto' ? 'bg-destructive/10 text-destructive' : r.estado === 'en_respuesta' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                        }`}>{r.estado.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{r.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.descripcion}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>📅 {r.fechaSolicitud}</span>
                        <span>👤 {r.solicitante}</span>
                        <span>📬 → {r.destino}</span>
                      </div>
                      {r.respuesta && (
                        <div className="mt-2 p-2 bg-success/10 rounded-lg border border-success/30">
                          <p className="text-[10px] font-bold text-success mb-0.5">Respuesta ({r.fechaRespuesta}):</p>
                          <p className="text-xs text-foreground">{r.respuesta}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2 flex-col">
                      {r.estado === 'abierto' && (
                        <button onClick={() => {
                          const resp = prompt('Escribe la respuesta:');
                          if (resp) actualizarRFI(r.id, 'en_respuesta', resp);
                        }} className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] hover:bg-amber-600">Responder</button>
                      )}
                      {r.estado === 'en_respuesta' && (
                        <button onClick={() => actualizarRFI(r.id, 'cerrado')} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">Cerrar</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========== SUBMITTALS ========== */}
      {tab === 'submittals' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
              <Package className="w-4 h-4 text-purple-500" /> Submittals
            </h2>
            <button onClick={() => { setShowSubForm(true); resetGdErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600">
              <Plus className="w-3.5 h-3.5" /> Nuevo Submittal
            </button>
          </div>

          {showSubForm && (
            <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={subForm.titulo} onChange={e => setSubForm(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Título" className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 outline-none focus:border-purple-400" />
                <select value={subForm.categoria} onChange={e => setSubForm(prev => ({ ...prev, categoria: e.target.value as Submittal['categoria'] }))} className={INPUT}>
                  <option value="material">Material</option>
                  <option value="equipo">Equipo</option>
                  <option value="especificacion">Especificación</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <input value={subForm.proveedor} onChange={e => setSubForm(prev => ({ ...prev, proveedor: e.target.value }))} placeholder="Proveedor" className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 outline-none focus:border-purple-400" />
              <textarea value={subForm.descripcion} onChange={e => setSubForm(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="Descripción..." className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 outline-none focus:border-purple-400 min-h-[50px]" />
              <div className="flex gap-2">
                <button onClick={handleAddSubmittal} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-xs font-semibold">Registrar</button>
                <button onClick={() => setShowSubForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-xs text-slate-600">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {submittals.filter(s => !selProyecto || s.proyectoId === selProyecto).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Sin submittals registrados</p>
              </div>
            ) : (
              submittals.filter(s => !selProyecto || s.proyectoId === selProyecto).map(s => (
                <div key={s.id} className={`p-3 rounded-lg border ${s.estado === 'aprobado' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">{s.categoria}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          s.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-600' : s.estado === 'rechazado' ? 'bg-red-50 text-red-500' : s.estado === 'con_comentarios' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                        }`}>{s.estado.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-700">{s.titulo}</p>
                      <div className="flex gap-2 mt-1 text-[10px] text-slate-400">
                        <span>📅 {s.fechaEnvio}</span>
                        <span>🏭 {s.proveedor}</span>
                      </div>
                      {s.descripcion && <p className="text-[10px] text-slate-500 mt-0.5">{s.descripcion}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2 flex-col">
                      {s.estado === 'pendiente' && (
                        <>
                          <button onClick={() => actualizarSubmittal(s.id, 'aprobado')} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">Aprobar</button>
                          <button onClick={() => { const c = prompt('Comentarios:'); if (c) actualizarSubmittal(s.id, 'con_comentarios'); }} className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] hover:bg-amber-600">Comentar</button>
                          <button onClick={() => actualizarSubmittal(s.id, 'rechazado')} className="px-2 py-1 bg-red-500 text-white rounded text-[10px] hover:bg-red-600">Rechazar</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionDocumental;