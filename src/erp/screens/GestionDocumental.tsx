import { Skeleton } from '@/components/ui/skeleton';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { toast } from 'sonner';
import { FileText, Plus, Upload, Send, MessageSquare, Package } from 'lucide-react';
import { INPUT } from '../ui';
import { todayISO } from '../utils';
import { z } from 'zod';
import type { Plano, RFI, Submittal } from '../types';

// Zod schemas
const planoSchema = z.object({
  nombre: z.string().min(1, 'Nombre del plano requerido').max(200, 'Máximo 200 caracteres'),
  disciplina: z.enum(['arquitectura', 'estructura', 'instalaciones', 'electricas', 'sanitarias', 'mecanicas', 'otra']),
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
  estado: z.enum(['pendiente', 'aprobado', 'rechazado', 'con_comentarios']),
  fechaLimite: z.string().min(1, 'Fecha requerida'),
});

type TabDoc = 'planos' | 'rfis' | 'submittals';

const GestionDocumental: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, user, planos, addPlano, updatePlano, rfis, addRfi, updateRfi, submittals, addSubmittal, updateSubmittal } = useErp();
  const [tab, setTab] = useState<TabDoc>('planos');
  const [selProyecto, setSelProyecto] = useState('');
  const [loading, setLoading] = useState(true);

  React.useEffect(() => { setLoading(false); }, []);

  const [versiones, setVersiones] = useState<Record<string, string[]>>({});
  const [_gdFormErrors, setGdFormErrors] = useState<Record<string, string>>({});
  const resetGdErrors = () => setGdFormErrors({});

  // === PLANO FORM ===
  const [showPlanoForm, setShowPlanoForm] = useState(false);
  const [planoForm, setPlanoForm] = useState({ nombre: '', disciplina: 'arquitectura' as Plano['disciplina'], version: '1.0', descripcion: '' });

  const handleAddPlano = async () => {
    if (!selProyecto) { toast.error(t('gestion_documental.selecciona_proyecto', 'Selecciona un proyecto')); return; }
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
    const vid = nuevo.id;
    const vers = versiones[vid] || [];
    setVersiones({ ...versiones, [vid]: [...vers, nuevo.version] });
    await addPlano(nuevo);
    toast.success(`Plano "${planoForm.nombre}" v${planoForm.version} subido`);
    setShowPlanoForm(false);
    setPlanoForm({ nombre: '', disciplina: 'arquitectura', version: '1.0', descripcion: '' });
  };

  const togglePlanoEstado = (id: string) => {
    const plano = planos.find(p => p.id === id);
    if (!plano) return;
    const next: Plano['estado'] = plano.estado === 'vigente' ? 'obsoleto' : 'vigente';
    updatePlano(id, { estado: next });
    toast.success('Estado actualizado');
  };

  const addVersionPlano = (id: string) => {
    const plano = planos.find(p => p.id === id);
    if (!plano) return;
    const [major, minor] = plano.version.split('.').map(Number);
    const newVer = `${major}.${(minor || 0) + 1}`;
    updatePlano(id, { version: newVer, fechaSubida: todayISO(), estado: 'vigente' });
    const vers = versiones[id] || [];
    setVersiones(prev => ({ ...prev, [id]: [...vers, newVer] }));
    toast.success(`Nueva versión ${newVer}`);
  };

  // === RFI FORM ===
  const [showRFIForm, setShowRFIForm] = useState(false);
  const [rfiForm, setRfiForm] = useState({ titulo: '', descripcion: '', destino: '' });

  const handleAddRFI = async () => {
    if (!selProyecto) { toast.error(t('gestion_documental.selecciona_proyecto', 'Selecciona un proyecto')); return; }
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
    await addRfi(nueva);
    toast.success(`RFI ${nueva.numero} creado`);
    setShowRFIForm(false);
    setRfiForm({ titulo: '', descripcion: '', destino: '' });
  };

  const actualizarRFI = (id: string, estado: RFI['estado'], respuesta?: string) => {
    updateRfi(id, { estado, respuesta, ...(respuesta ? { fechaRespuesta: todayISO() } : {}) });
    toast.success(`RFI actualizado: ${estado}`);
  };

  // === SUBMITTAL FORM ===
  const [showSubForm, setShowSubForm] = useState(false);
  const [subForm, setSubForm] = useState({ titulo: '', descripcion: '', categoria: 'material' as Submittal['categoria'], proveedor: '' });

  const handleAddSubmittal = async () => {
    if (!selProyecto) { toast.error(t('gestion_documental.selecciona_proyecto', 'Selecciona un proyecto')); return; }
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
    await addSubmittal(nuevo);
    toast.success('Submittal registrado');
    setShowSubForm(false);
    setSubForm({ titulo: '', descripcion: '', categoria: 'material', proveedor: '' });
  };

  const actualizarSubmittal = (id: string, estado: Submittal['estado']) => {
    updateSubmittal(id, { estado });
    toast.success(`Submittal: ${estado}`);
  };

  const tabs = [
    { id: 'planos' as TabDoc, label: t('gestion_documental.tab_planos', 'Planos'), icon: FileText },
    { id: 'rfis' as TabDoc, label: t('gestion_documental.tab_rfis', 'RFIs'), icon: MessageSquare },
    { id: 'submittals' as TabDoc, label: t('gestion_documental.tab_submittals', 'Submittals'), icon: Package },
  ];

  const disciplinas: { value: Plano['disciplina']; label: string }[] = [
    { value: 'arquitectura', label: t('gestion_documental.disciplina_arquitectura', 'Arquitectura') },
    { value: 'estructura', label: t('gestion_documental.disciplina_estructura', 'Estructura') },
    { value: 'instalaciones', label: t('gestion_documental.disciplina_instalaciones', 'Instalaciones') },
    { value: 'electricas', label: t('gestion_documental.disciplina_electricas', 'Eléctricas') },
    { value: 'sanitarias', label: t('gestion_documental.disciplina_sanitarias', 'Sanitarias') },
    { value: 'mecanicas', label: t('gestion_documental.disciplina_mecanicas', 'Mecánicas') },
    { value: 'otra', label: t('gestion_documental.disciplina_otra', 'Otra') },
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-info" /> {t('gestion_documental.titulo', 'Gestión Documental')}
        </h1>
        <select
          value={selProyecto}
          onChange={e => setSelProyecto(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-input outline-none focus:border-ring bg-background text-foreground"
        >
          <option value="">{t('gestion_documental.todos_proyectos', '— Todos los proyectos —')}</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-card text-card-foreground rounded-xl p-3 border border-border">
          <div className="text-[10px] text-muted-foreground">{t('gestion_documental.kpi_planos', 'Planos')}</div>
          <div className="text-lg font-bold text-foreground">{planos.filter(p => !selProyecto || p.proyectoId === selProyecto).length}</div>
        </div>
        <div className="bg-card text-card-foreground rounded-xl p-3 border border-border">
          <div className="text-[10px] text-muted-foreground">{t('gestion_documental.kpi_rfis', 'RFIs Activos')}</div>
          <div className="text-lg font-bold text-warning">{rfis.filter(r => r.estado !== 'cerrado' && (!selProyecto || r.proyectoId === selProyecto)).length}</div>
        </div>
        <div className="bg-card text-card-foreground rounded-xl p-3 border border-border">
          <div className="text-[10px] text-muted-foreground">{t('gestion_documental.kpi_submittals', 'Submittals Pendientes')}</div>
          <div className="text-lg font-bold text-info">{submittals.filter(s => s.estado === 'pendiente' && (!selProyecto || s.proyectoId === selProyecto)).length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-muted p-1 rounded-xl">
        {tabs.map(tabItem => {
          const Icon = tabItem.icon;
          const active = tab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tabItem.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========== PLANOS ========== */}
      {tab === 'planos' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-info" /> {t('gestion_documental.planos_titulo', 'Planos por Disciplina')}
            </h2>
            <button onClick={() => { setShowPlanoForm(true); resetGdErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-info text-info-foreground rounded-lg text-xs font-medium hover:bg-info/90">
              <Upload className="w-3.5 h-3.5" /> {t('gestion_documental.subir_plano', 'Subir Plano')}
            </button>
          </div>

          {showPlanoForm && (
            <div className="bg-muted rounded-xl p-4 mb-4 border border-border space-y-2">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 <div>
                   <input value={planoForm.nombre} onChange={e => { setPlanoForm(prev => ({ ...prev, nombre: e.target.value })); setGdFormErrors(prev => ({ ...prev, nombre: '' })); }} placeholder={t('gestion_documental.nombre_plano_placeholder', 'Nombre del plano')} className="w-full px-3 py-2 text-xs rounded-lg border border-input outline-none focus:border-ring bg-background text-foreground" />
                   {_gdFormErrors.nombre && <p className="text-xs text-red-500 mt-0.5">{_gdFormErrors.nombre}</p>}
                 </div>
                 <div>
                   <select value={planoForm.disciplina} onChange={e => { setPlanoForm(prev => ({ ...prev, disciplina: e.target.value as Plano['disciplina'] })); setGdFormErrors(prev => ({ ...prev, disciplina: '' })); }} className={INPUT}>
                     {disciplinas.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                   </select>
                   {_gdFormErrors.disciplina && <p className="text-xs text-red-500 mt-0.5">{_gdFormErrors.disciplina}</p>}
                 </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                 <div>
                   <input value={planoForm.version} onChange={e => { setPlanoForm(prev => ({ ...prev, version: e.target.value })); setGdFormErrors(prev => ({ ...prev, version: '' })); }} placeholder={t('gestion_documental.version_placeholder', 'Versión (ej: 1.0)')} className={INPUT} />
                   {_gdFormErrors.version && <p className="text-xs text-red-500 mt-0.5">{_gdFormErrors.version}</p>}
                 </div>
                 <div>
                   <input value={planoForm.descripcion} onChange={e => { setPlanoForm(prev => ({ ...prev, descripcion: e.target.value })); setGdFormErrors(prev => ({ ...prev, descripcion: '' })); }} placeholder={t('gestion_documental.descripcion_placeholder', 'Descripción (opcional)')} className={INPUT} />
                   {_gdFormErrors.descripcion && <p className="text-xs text-red-500 mt-0.5">{_gdFormErrors.descripcion}</p>}
                 </div>
               </div>
              <div className="flex gap-2">
                <button onClick={handleAddPlano} className="flex-1 bg-info hover:bg-info/90 text-info-foreground py-2 rounded-lg text-xs font-semibold">{t('gestion_documental.subir_plano', 'Subir Plano')}</button>
                <button onClick={() => setShowPlanoForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground">{t('common.cancelar', 'Cancelar')}</button>
              </div>
            </div>
          )}

          {/* Historial de versiones */}
          {Object.keys(versiones).length > 0 && (
            <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">{t('gestion_documental.historial_versiones', 'Historial de Versiones')}</h3>
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
                <p className="text-sm">{t('gestion_documental.sin_planos', 'Sin planos registrados')}</p>
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
                      <button onClick={() => addVersionPlano(p.id)} className="px-2 py-1 bg-blue-500 text-white rounded text-[10px] hover:bg-blue-600" title={t('gestion_documental.nueva_version', 'Nueva versión')}>+v</button>
                      <button onClick={() => togglePlanoEstado(p.id)} className={`px-2 py-1 rounded text-[10px] ${p.estado === 'vigente' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}>
                        {p.estado === 'vigente' ? t('gestion_documental.obsoleto', 'Obsoleto') : t('gestion_documental.activar', 'Activar')}
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
            <h2 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-warning" /> {t('gestion_documental.rfis_titulo', 'Request for Information (RFI)')}
            </h2>
            <button onClick={() => { setShowRFIForm(true); resetGdErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-warning text-warning-foreground rounded-lg text-xs font-medium hover:bg-warning/90">
              <Send className="w-3.5 h-3.5" /> {t('gestion_documental.nuevo_rfi', 'Nuevo RFI')}
            </button>
          </div>

           {showRFIForm && (
             <div className="bg-warning/10 rounded-xl p-4 mb-4 border border-warning/30 space-y-2">
               <div>
                 <input value={rfiForm.titulo} onChange={e => { setRfiForm(prev => ({ ...prev, titulo: e.target.value })); setGdFormErrors(prev => ({ ...prev, titulo: '' })); }} placeholder={t('gestion_documental.rfi_titulo_placeholder', 'Título del RFI')} className="w-full px-3 py-2 text-xs rounded-lg border border-input outline-none focus:border-ring bg-background text-foreground" />
                 {_gdFormErrors.titulo && <p className="text-xs text-red-500 mt-0.5">{_gdFormErrors.titulo}</p>}
               </div>
               <div>
                 <textarea value={rfiForm.descripcion} onChange={e => { setRfiForm(prev => ({ ...prev, descripcion: e.target.value })); setGdFormErrors(prev => ({ ...prev, descripcion: '' })); }} placeholder={t('gestion_documental.rfi_descripcion_placeholder', 'Descripción detallada...')} className="w-full px-3 py-2 text-xs rounded-lg border border-input outline-none focus:border-ring bg-background text-foreground min-h-[60px]" />
                 {_gdFormErrors.descripcion && <p className="text-xs text-red-500 mt-0.5">{_gdFormErrors.descripcion}</p>}
               </div>
               <div>
                 <input value={rfiForm.destino} onChange={e => { setRfiForm(prev => ({ ...prev, destino: e.target.value })); setGdFormErrors(prev => ({ ...prev, destino: '' })); }} placeholder={t('gestion_documental.rfi_destino_placeholder', 'Destinatario (ej: Arquitecto de proyecto)')} className="w-full px-3 py-2 text-xs rounded-lg border border-input outline-none focus:border-ring bg-background text-foreground" />
                 {_gdFormErrors.destino && <p className="text-xs text-red-500 mt-0.5">{_gdFormErrors.destino}</p>}
               </div>
               <div className="flex gap-2">
                 <button onClick={handleAddRFI} className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground py-2 rounded-lg text-xs font-semibold">{t('gestion_documental.enviar_rfi', 'Enviar RFI')}</button>
                 <button onClick={() => setShowRFIForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground">{t('common.cancelar', 'Cancelar')}</button>
               </div>
             </div>
           )}

          <div className="space-y-2">
            {rfis.filter(r => !selProyecto || r.proyectoId === selProyecto).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-sm">{t('gestion_documental.sin_rfis', 'Sin RFIs registrados')}</p>
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
                          <p className="text-[10px] font-bold text-success mb-0.5">{t('gestion_documental.respuesta_label', 'Respuesta')} ({r.fechaRespuesta}):</p>
                          <p className="text-xs text-foreground">{r.respuesta}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2 flex-col">
                      {r.estado === 'abierto' && (
                        <button onClick={() => {
                          const resp = prompt(t('gestion_documental.escribe_respuesta', 'Escribe la respuesta:'));
                          if (resp) actualizarRFI(r.id, 'en_respuesta', resp);
                        }} className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] hover:bg-amber-600">{t('gestion_documental.responder', 'Responder')}</button>
                      )}
                      {r.estado === 'en_respuesta' && (
                        <button onClick={() => actualizarRFI(r.id, 'cerrado')} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">{t('gestion_documental.cerrar', 'Cerrar')}</button>
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
            <h2 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <Package className="w-4 h-4 text-purple-500" /> {t('gestion_documental.submittals_titulo', 'Submittals')}
            </h2>
            <button onClick={() => { setShowSubForm(true); resetGdErrors(); }} className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium hover:bg-purple-600">
              <Plus className="w-3.5 h-3.5" /> {t('gestion_documental.nuevo_submittal', 'Nuevo Submittal')}
            </button>
          </div>

          {showSubForm && (
            <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <input value={subForm.titulo} onChange={e => { setSubForm(prev => ({ ...prev, titulo: e.target.value })); setGdFormErrors(prev => ({ ...prev, titulo: '' })); }} placeholder={t('gestion_documental.submittal_titulo_placeholder', 'Título')} className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 outline-none focus:border-purple-400" />
                  {_gdFormErrors.titulo && <p className="text-xs text-red-500 mt-0.5">{_gdFormErrors.titulo}</p>}
                </div>
                <div>
                  <select value={subForm.categoria} onChange={e => { setSubForm(prev => ({ ...prev, categoria: e.target.value as Submittal['categoria'] })); setGdFormErrors(prev => ({ ...prev, categoria: '' })); }} className={INPUT}>
                    <option value="material">{t('gestion_documental.cat_material', 'Material')}</option>
                    <option value="equipo">{t('gestion_documental.cat_equipo', 'Equipo')}</option>
                    <option value="especificacion">{t('gestion_documental.cat_especificacion', 'Especificación')}</option>
                    <option value="otro">{t('gestion_documental.cat_otro', 'Otro')}</option>
                  </select>
                  {_gdFormErrors.categoria && <p className="text-xs text-red-500 mt-0.5">{_gdFormErrors.categoria}</p>}
                </div>
              </div>
              <div>
                <input value={subForm.proveedor} onChange={e => { setSubForm(prev => ({ ...prev, proveedor: e.target.value })); setGdFormErrors(prev => ({ ...prev, proveedor: '' })); }} placeholder={t('gestion_documental.proveedor_placeholder', 'Proveedor')} className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 outline-none focus:border-purple-400" />
                {_gdFormErrors.proveedor && <p className="text-xs text-red-500 mt-0.5">{_gdFormErrors.proveedor}</p>}
              </div>
              <div>
                <textarea value={subForm.descripcion} onChange={e => { setSubForm(prev => ({ ...prev, descripcion: e.target.value })); setGdFormErrors(prev => ({ ...prev, descripcion: '' })); }} placeholder={t('gestion_documental.descripcion_submittal_placeholder', 'Descripción...')} className="w-full px-3 py-2 text-xs rounded-lg border border-purple-200 outline-none focus:border-purple-400 min-h-[50px]" />
                {_gdFormErrors.descripcion && <p className="text-xs text-red-500 mt-0.5">{_gdFormErrors.descripcion}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddSubmittal} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-xs font-semibold">{t('gestion_documental.registrar_submittal', 'Registrar')}</button>
                <button onClick={() => setShowSubForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground">{t('common.cancelar', 'Cancelar')}</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {submittals.filter(s => !selProyecto || s.proyectoId === selProyecto).length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">{t('gestion_documental.sin_submittals', 'Sin submittals registrados')}</p>
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
                          <button onClick={() => actualizarSubmittal(s.id, 'aprobado')} className="px-2 py-1 bg-emerald-500 text-white rounded text-[10px] hover:bg-emerald-600">{t('gestion_documental.aprobar', 'Aprobar')}</button>
                          <button onClick={() => { const c = prompt(t('gestion_documental.comentarios_prompt', 'Comentarios:')); if (c) actualizarSubmittal(s.id, 'con_comentarios'); }} className="px-2 py-1 bg-amber-500 text-white rounded text-[10px] hover:bg-amber-600">{t('gestion_documental.comentar', 'Comentar')}</button>
                          <button onClick={() => actualizarSubmittal(s.id, 'rechazado')} className="px-2 py-1 bg-red-500 text-white rounded text-[10px] hover:bg-red-600">{t('gestion_documental.rechazar', 'Rechazar')}</button>
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