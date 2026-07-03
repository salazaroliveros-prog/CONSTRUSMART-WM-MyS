import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { Licitacion } from '../types';
import { fmtQ } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, X, Target, TrendingUp, DollarSign,
  Briefcase, CheckCircle, Clock, Archive,
  Pencil, Trash2, PieChart
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER, COLOR_INFO, COLOR_PRIMARY, SECTION_TITLE, CARD, KPI_CARD, BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_ICON, BUTTON_DANGER, INPUT, MODAL_OVERLAY, MODAL_PANEL, MODAL_HEADER, MODAL_TITLE, MODAL_CLOSE } from '../ui';

const licitacionFormSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200, 'Máximo 200 caracteres'),
  proyectoId: z.string().optional().default(''),
  cliente: z.string().min(1, 'Cliente requerido').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().max(2000).optional().default(''),
  monto: z.coerce.number().min(0, 'Monto debe ser ≥ 0').max(999_999_999, 'Monto muy alto'),
  probabilidad: z.coerce.number().min(0).max(100).default(50),
  notas: z.string().max(2000).optional().default(''),
  fechaLimite: z.string().optional().default(''),
});

type LicitacionFormData = z.infer<typeof licitacionFormSchema>;

const ESTADOS = [
  { key: 'activa' as const, label: 'Activa', color: 'bg-blue-50 border-blue-300', icon: Clock, textColor: 'text-blue-600' },
  { key: 'adjudicada' as const, label: 'Adjudicada 🏆', color: 'bg-emerald-50 border-emerald-300', icon: CheckCircle, textColor: 'text-emerald-600' },
  { key: 'perdida' as const, label: 'Perdida', color: 'bg-red-50 border-red-300', icon: Archive, textColor: COLOR_DANGER },
  { key: 'cerrada' as const, label: 'Cerrada', color: 'bg-slate-100 border-slate-300', icon: Archive, textColor: 'text-slate-500' },
] as const;

const ESTADO_SIGUIENTE: Record<string, string> = {
  activa: 'adjudicada',
  adjudicada: 'cerrada',
  perdida: 'cerrada',
};

const CRM: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, licitaciones, addLicitacion, updateLicitacion, deleteLicitacion } = useErp();
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const licitacionesFiltradas = useMemo(() => licitaciones.filter(l => !filtroProyecto || l.proyectoId === filtroProyecto), [licitaciones, filtroProyecto]);
  const [formData, setFormData] = useState<LicitacionFormData>({
    nombre: '',
    proyectoId: '',
    cliente: '',
    descripcion: '',
    monto: 0,
    probabilidad: 50,
    notas: '',
    fechaLimite: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});



  const columns = useMemo(() => {
    return ESTADOS.map(est => ({
      ...est,
      items: licitacionesFiltradas.filter(l => l.estado === est.key).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }));
  }, [licitacionesFiltradas]);

  const totalMonto = licitacionesFiltradas.reduce((a, l) => a + l.monto, 0);
  const ganadas = licitacionesFiltradas.filter(l => l.estado === 'adjudicada');
  const decididas = licitacionesFiltradas.filter(l => l.estado === 'adjudicada' || l.estado === 'perdida');
  const tasaConversion = decididas.length > 0
    ? Math.round((ganadas.length / decididas.length) * 100)
    : 0;
  const pipelineActivo = licitacionesFiltradas.filter(l => l.estado === 'activa').reduce((a, l) => a + l.monto * (l.probabilidad / 100), 0);

  const resetForm = () => {
    setFormData({ nombre: '', proyectoId: '', cliente: '', descripcion: '', monto: 0, probabilidad: 50, notas: '', fechaLimite: '' });
    setEditingId(null);
    setFormErrors({});
  };

  const openEdit = (l: Licitacion) => {
    setEditingId(l.id);
    setFormData({
      nombre: l.nombre,
      proyectoId: l.proyectoId || '',
      cliente: l.cliente,
      descripcion: l.descripcion || '',
      monto: l.monto,
      probabilidad: l.probabilidad ?? 50,
      notas: l.notas || '',
      fechaLimite: l.fechaLimite || '',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = licitacionFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setFormErrors(fieldErrors);
      
      return;
    }
    setFormErrors({});

    const data = result.data;
    if (editingId) {
      updateLicitacion(editingId, {
        proyectoId: data.proyectoId || '',
        nombre: data.nombre,
        cliente: data.cliente,
        monto: data.monto,
        probabilidad: data.probabilidad,
        notas: data.notas || undefined,
        fechaLimite: data.fechaLimite || undefined,
      });
      toast.success(t('crm.toast_actualizada'));
    } else {
      addLicitacion({
        proyectoId: data.proyectoId || '',
        nombre: data.nombre,
        cliente: data.cliente,
        monto: data.monto,
        estado: 'activa',
        probabilidad: data.probabilidad,
        notas: data.notas || undefined,
        fechaLimite: data.fechaLimite || undefined,
      });
      toast.success(t('crm.toast_creada'));
    }
    resetForm();
    setShowForm(false);
  };

  const moveLicitacion = (id: string, newEstado: Licitacion['estado']) => {
    updateLicitacion(id, { estado: newEstado });
    const lic = licitaciones.find(l => l.id === id);
    if (newEstado === 'adjudicada') {
      toast.success(t('crm.toast_ganada', { nombre: lic?.nombre || '' }));
    } else if (newEstado === 'perdida') {
      toast.info(t('crm.toast_perdida', { nombre: lic?.nombre || '' }));
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <div className="flex gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-96 flex-1 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-5 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> {t('crm.heading')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">{t('crm.subtitulo')}</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={filtroProyecto} onChange={e => setFiltroProyecto(e.target.value)} className="px-2 py-1.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-ring bg-background border border-input text-foreground">
              <option value="">{t('crm.todos_proyectos')}</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="w-4 h-4" /> {t('crm.nueva_licitacion')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className={KPI_CARD}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">{t('crm.oportunidades')}</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground">{licitacionesFiltradas.length}</div>
          <div className="text-[10px] text-muted-foreground">
            {t('crm.ganadas_perdidas', { ganadas: licitacionesFiltradas.filter(l => l.estado === 'adjudicada').length, perdidas: licitacionesFiltradas.filter(l => l.estado === 'perdida').length })}
          </div>
        </div>
        <div className={KPI_CARD}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <DollarSign className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${COLOR_SUCCESS}`} />
            <span className="text-[10px] sm:text-xs text-muted-foreground">{t('crm.total_pipeline')}</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-foreground truncate">{fmtQ(totalMonto)}</div>
        </div>
        <div className={KPI_CARD}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <TrendingUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${COLOR_INFO}`} />
            <span className="text-[10px] sm:text-xs text-muted-foreground">{t('crm.pipeline_activo')}</span>
          </div>
          <div className={`text-lg sm:text-2xl font-bold ${COLOR_INFO} truncate`}>{fmtQ(pipelineActivo)}</div>
          <div className="text-[10px] text-muted-foreground">{t('crm.oportunidades_activas')}</div>
        </div>
        <div className={KPI_CARD}>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <PieChart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${COLOR_WARNING}`} />
            <span className="text-[10px] sm:text-xs text-muted-foreground">{t('crm.conversion')}</span>
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${COLOR_WARNING}`}>{tasaConversion}%</div>
          <div className="text-[10px] text-muted-foreground">{t('crm.ganadas_vs_decididas')}</div>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3 lg:gap-4 overflow-x-auto pb-4 min-h-[400px] -mx-3 px-3 sm:mx-0 sm:px-0">
        {columns.map(col => (
          <div key={col.key} className="flex-shrink-0 w-[220px] sm:w-[240px] lg:flex-1 lg:min-w-[200px] lg:max-w-[300px]">
            <div className={`${col.color} rounded-t-2xl p-3 border-b-2`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <col.icon className={`w-4 h-4 ${col.textColor}`} />
                  <h3 className={`font-bold text-sm ${col.textColor}`}>{t(`crm.col_${col.key}`)}</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 ${col.textColor}`}>
                  {col.items.length}
                </span>
              </div>
              {col.items.length > 0 && (
                <div className="text-[10px] text-slate-500 mt-1">
                  {t('common.total')}: {fmtQ(col.items.reduce((a, l) => a + l.monto, 0))}
                </div>
              )}
            </div>

            <div className="bg-opacity-30 p-2 space-y-2 rounded-b-2xl min-h-[400px]"
              style={{ background: col.key === 'activa' ? '#eff6ff' : col.key === 'adjudicada' ? '#ecfdf5' : col.key === 'perdida' ? '#fef2f2' : '#f8fafc' }}
            >
              {col.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-300">
                  <span className="text-2xl mb-1">📋</span>
                  <span className="text-xs">{t('crm.sin_oportunidades')}</span>
                </div>
              ) : col.items.map(l => (
                <div key={l.id} className="bg-card rounded-xl p-3 shadow-sm border border-border hover:shadow-md active:shadow-sm transition-all group focus:outline-none focus:ring-2 focus:ring-ring" tabIndex={0} role="button" aria-label={t('crm.licitacion_card_aria', { nombre: l.nombre })} onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openEdit(l);
                  }
                }}>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-sm text-foreground truncate flex-1">{l.nombre}</h4>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                        <button onClick={() => openEdit(l)} className="p-1 text-slate-400 hover:text-primary hover:bg-primary/10 rounded" aria-label={t('crm.editar_aria')}>
                          <Pencil className="w-3 h-3" aria-hidden="true" />
                        </button>
                        <button onClick={() => { deleteLicitacion(l.id); toast.success(t('crm.toast_eliminada')); }} className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" aria-label={t('crm.eliminar_aria')}>
                          <Trash2 className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1">{l.cliente}</p>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-foreground">{fmtQ(l.monto)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      l.probabilidad >= 70 ? 'bg-emerald-50 text-emerald-600' :
                      l.probabilidad >= 40 ? 'bg-amber-50 ' + COLOR_WARNING :
                      'bg-slate-50 text-slate-500'
                    }`}>
                      {l.probabilidad}%
                    </span>
                  </div>
                  {l.notas && <p className="text-[9px] text-muted-foreground italic line-clamp-2">{l.notas}</p>}
                  
                  {l.estado === 'activa' && (
                    <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => moveLicitacion(l.id, 'adjudicada')}
                        className="flex-1 text-[8px] py-1 rounded font-medium text-emerald-600 hover:bg-emerald-50"
                      >
                        {t('crm.adjudicar_btn')}
                      </button>
                      <button
                        onClick={() => moveLicitacion(l.id, 'perdida')}
                        className={`flex-1 text-[8px] py-1 rounded font-medium ${COLOR_DANGER} hover:bg-red-50`}
                      >
                        {t('crm.perder_btn')}
                      </button>
                    </div>
                  )}
                  {(l.estado === 'adjudicada' || l.estado === 'perdida') && (
                    <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => moveLicitacion(l.id, 'cerrada')}
                        className="flex-1 text-[8px] py-1 rounded font-medium text-slate-500 hover:bg-slate-100"
                      >
                        {t('crm.cerrar_btn')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit} className="bg-card text-card-foreground rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-foreground">
                {editingId ? t('crm.editar_oportunidad') : t('crm.nueva_licitacion')}
              </h2>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} aria-label={t('common.cerrar')} className={`${BUTTON_ICON} min-h-[44px] min-w-[44px]`}>
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">Nombre *</label>
                <input
                  value={formData.nombre}
                  onChange={e => { setFormData(p => ({ ...p, nombre: e.target.value })); setFormErrors(prev => ({ ...prev, nombre: '' })); }}
                  placeholder="Ej. Edificio Comercial"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none bg-background text-foreground focus:border-primary ${formErrors.nombre ? 'border-destructive bg-destructive/5' : 'border-border'}`}
                />
                {formErrors.nombre && <p className={`text-xs ${COLOR_DANGER} mt-1`}>{formErrors.nombre}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">Proyecto</label>
                <select value={formData.proyectoId} onChange={e => setFormData(p => ({ ...p, proyectoId: e.target.value }))} className="w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none bg-background text-foreground focus:border-primary border-border">
                  <option value="">Sin proyecto</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">Cliente *</label>
  <input
                    value={formData.cliente}
                    onChange={e => { setFormData(p => ({ ...p, cliente: e.target.value })); setFormErrors(prev => ({ ...prev, cliente: '' })); }}
                    placeholder="Nombre del cliente"
                    className={INPUT}
                  />
                  {formErrors.cliente && <p className={`text-xs ${COLOR_DANGER} mt-1`}>{formErrors.cliente}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">Monto Q</label>
                  <input
                    type="number" inputMode="decimal"
                    value={formData.monto}
                    onChange={e => { setFormData(p => ({ ...p, monto: +e.target.value })); setFormErrors(prev => ({ ...prev, monto: '' })); }}
                    placeholder="0.00"
                    className={INPUT}
                  />
                  {formErrors.monto && <p className={`text-xs ${COLOR_DANGER} mt-1`}>{formErrors.monto}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">Probabilidad <span className="font-bold text-purple-600">{formData.probabilidad}%</span></label>
                <input
                  type="range" min="0" max="100" step="5"
                  value={formData.probabilidad}
                  onChange={e => setFormData(p => ({ ...p, probabilidad: +e.target.value }))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">Fecha Límite</label>
                <input
                  type="date"
                  value={formData.fechaLimite}
                  onChange={e => setFormData(p => ({ ...p, fechaLimite: e.target.value }))}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground uppercase tracking-wider mb-1 block">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={e => setFormData(p => ({ ...p, notas: e.target.value }))}
                  placeholder="Notas internas..."
                  rows={2}
                  className={INPUT}
                />
              </div>
            </div>
          <button type="submit" className={`${BUTTON_PRIMARY} mt-4 w-full justify-center`}>
            {editingId ? 'Guardar Cambios' : 'Crear Oportunidad'}
          </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CRM;
