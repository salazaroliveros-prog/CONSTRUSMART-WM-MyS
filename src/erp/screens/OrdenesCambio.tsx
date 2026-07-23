import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { OrdenCambio } from '../types';
import { fmtQ, todayISO } from '../utils';
import { GitBranch, Plus, Check, X, Clock, ChevronRight, ChevronDown, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirmAction } from '@/lib/confirm-action';
import { canUserEdit } from '@/lib/security';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui';
import { Skeleton } from '@/components/ui/skeleton';

type EstadoOC = OrdenCambio['estado'];

const OrdenesCambio: React.FC = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const { t } = useTranslation();
  const { proyectos, user, ordenesCambio, addOrdenCambio, updateOrdenCambio, deleteOrdenCambio } = useErp();
  const [showForm, setShowForm] = useState(false);
  const [proyectoFilter, setProyectoFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fTitulo, setFTitulo] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fCosto, setFCosto] = useState(0);
  const [fPlazo, setFPlazo] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    if (!proyectoFilter) return ordenesCambio;
    return ordenesCambio.filter(o => o.proyectoId === proyectoFilter);
  }, [ordenesCambio, proyectoFilter]);

  const handleCrear = () => {
    const errs: Record<string, string> = {};
    if (!fTitulo.trim()) errs.titulo = t('ordenes_cambio.error_titulo', 'Título requerido');
    if (!proyectoFilter) errs.proyecto = t('ordenes_cambio.error_proyecto', 'Selecciona un proyecto');
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
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
    toast.success(t('ordenes_cambio.solicitud_creada'));
    setFTitulo(''); setFDesc(''); setFCosto(0); setFPlazo(0);
    setShowForm(false);
  };

  const handleAprobar = (id: string) => {
    if (!canUserEdit(user?.rol)) {
      toast.error(t('common.sin_permisos', 'Sin permisos'));
      return;
    }
    updateOrdenCambio(id, { estado: 'aprobado', aprobador: user?.nombre || 'Gerente', fechaAprobacion: todayISO() });
    toast.success(t('ordenes_cambio.cambio_aprobado'));
  };

  const handleRechazar = (id: string) => {
    if (!canUserEdit(user?.rol)) {
      toast.error(t('common.sin_permisos', 'Sin permisos'));
      return;
    }
    updateOrdenCambio(id, { estado: 'rechazado', aprobador: user?.nombre || 'Gerente', fechaAprobacion: todayISO() });
    toast.info(t('ordenes_cambio.cambio_rechazado', 'Cambio rechazado'));
  };

  const handleDelete = async (id: string) => {
    try {
      await confirmAction({ title: t('ordenes_cambio.confirmar_eliminar', '¿Eliminar orden de cambio?') });
      deleteOrdenCambio(id);
      toast.success(t('ordenes_cambio.eliminado', 'Orden de cambio eliminada'));
    } catch {}
  };

  const estadoConfig: Record<EstadoOC, { color: string; bg: string; label: string }> = {
    solicitud: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', label: t('ordenes_cambio.estado_solicitud', 'Solicitud') },
    revision: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', label: t('ordenes_cambio.estado_revision', 'En Revisión') },
    aprobado: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', label: t('ordenes_cambio.estado_aprobado', 'Aprobado') },
    rechazado: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', label: t('ordenes_cambio.estado_rechazado', 'Rechazado') },
  };

  const pendientes = useMemo(() => ordenesCambio.filter(o => o.estado === 'solicitud' || o.estado === 'revision').length, [ordenesCambio]);
  const costoTotal = useMemo(() => ordenesCambio.filter(o => o.estado === 'aprobado').reduce((a, o) => a + o.impactoCosto, 0), [ordenesCambio]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
          <GitBranch className="w-6 h-6 text-amber-500 dark:text-amber-400" aria-hidden="true" /> {t('ordenes_cambio.titulo', 'Órdenes de Cambio')}
        </h1>
        <div className="flex flex-wrap gap-2">
          <div>
            <ProyectoFilter value={proyectoFilter} onChange={(v) => { setProyectoFilter(v); setFormErrors(prev => ({ ...prev, proyecto: '' })); }} proyectos={proyectos} />
            {formErrors.proyecto && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{formErrors.proyecto}</p>}
          </div>
          <button onClick={() => setShowForm(!showForm)} className={`${BUTTON_PRIMARY} flex items-center gap-1`}>
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t('ordenes_cambio.nueva', 'Nueva')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border">
          <div className="text-xs text-muted-foreground">{t('ordenes_cambio.total_ordenes', 'Total Órdenes')}</div>
          <div className="text-lg font-bold text-foreground">{ordenesCambio.length}</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl p-3 sm:p-4 border border-amber-200 dark:border-amber-800">
          <div className="text-xs text-amber-600 dark:text-amber-400">{t('ordenes_cambio.pendientes', 'Pendientes')}</div>
          <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{pendientes}</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-3 sm:p-4 border border-emerald-200 dark:border-emerald-800">
          <div className="text-xs text-emerald-600 dark:text-emerald-400">{t('ordenes_cambio.costo_aprobado', 'Costo Aprobado')}</div>
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmtQ(costoTotal)}</div>
        </div>
      </div>

      {showForm && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-4">
          <h3 className="font-bold text-sm text-muted-foreground mb-3"><FileText className="w-4 h-4 inline-block align-text-bottom" aria-hidden="true" /> {t('ordenes_cambio.nueva_solicitud', 'Nueva Solicitud de Cambio')}</h3>
          <div className="space-y-2">
            <div>
              <input value={fTitulo} onChange={e => { setFTitulo(e.target.value); setFormErrors(prev => ({ ...prev, titulo: '' })); }} placeholder={t('ordenes_cambio.placeholder_titulo', 'Título del cambio *')} className={`${INPUT} ${formErrors.titulo ? 'border-red-500' : ''}`} />
              {formErrors.titulo && <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{formErrors.titulo}</p>}
            </div>
            <textarea value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder={t('ordenes_cambio.placeholder_descripcion', 'Descripción detallada del cambio...')} rows={2} className={`${INPUT} resize-none`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-0.5 block">{t('ordenes_cambio.impacto_costo', 'Impacto Costo (Q)')}</label>
                <input type="number" inputMode="decimal" value={fCosto || ''} onChange={e => setFCosto(+e.target.value)} min={0} className={INPUT} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-0.5 block">{t('ordenes_cambio.impacto_plazo', 'Impacto Plazo (días)')}</label>
                <input type="number" inputMode="decimal" value={fPlazo || ''} onChange={e => setFPlazo(+e.target.value)} min={0} className={INPUT} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCrear} className={`${BUTTON_PRIMARY} text-xs`}>{t('ordenes_cambio.enviar_solicitud', 'Enviar Solicitud')}</button>
              <button onClick={() => setShowForm(false)} className={`${BUTTON_SECONDARY} text-xs`}>{t('common.cancelar', 'Cancelar')}</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <GitBranch className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-500" aria-hidden="true" />
            <p className="text-sm">{t('ordenes_cambio.sin_datos', 'Sin órdenes de cambio')}</p>
          </div>
        )}
        {filtered.map(oc => {
          const cfg = estadoConfig[oc.estado];
          const isOpen = expanded === oc.id;
          return (
            <div key={oc.id} className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : oc.id)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className={`w-2 h-2 rounded-full shrink-0 ${oc.estado === 'aprobado' ? 'bg-emerald-400' : oc.estado === 'rechazado' ? 'bg-red-400' : oc.estado === 'revision' ? 'bg-blue-400' : 'bg-amber-400'}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-muted-foreground truncate">{oc.titulo}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" /> {oc.createdAt?.slice(0, 10)} · {oc.solicitante}
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-muted-foreground">{fmtQ(oc.impactoCosto)}</div>
                  <div className="text-[10px] text-muted-foreground">+{oc.impactoPlazo} días</div>
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground mb-3">{oc.descripcion}</p>
                  {oc.aprobador && (
                    <div className="text-xs text-muted-foreground mb-2">
                      {t('ordenes_cambio.aprobado_por', 'Aprobado por:')} <span className="font-medium text-muted-foreground">{oc.aprobador}</span> — {oc.fechaAprobacion}
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    {(oc.estado === 'solicitud' || oc.estado === 'revision') && (user?.rol === 'Administrador' || user?.rol === 'Gerente') && (
                      <>
                        <button onClick={() => handleAprobar(oc.id)} className={`${BUTTON_PRIMARY} flex items-center gap-1 text-xs`}>
                          <Check className="w-3 h-3" aria-hidden="true" /> {t('ordenes_cambio.aprobar', 'Aprobar')}
                        </button>
                        <button onClick={() => handleRechazar(oc.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <X className="w-3 h-3" aria-hidden="true" /> {t('ordenes_cambio.rechazar', 'Rechazar')}
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(oc.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('common.eliminar')}>
                      <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.eliminar')}
                    </button>
                  </div>
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
