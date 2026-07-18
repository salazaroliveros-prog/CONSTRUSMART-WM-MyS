import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import ProyectoFilter from '../components/ProyectoFilter';
import { CheckCircle2, Circle, AlertTriangle, Calendar, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, INPUT } from '../ui';

type TipoHito = 'entrega' | 'pago' | 'inspeccion' | 'licencia' | 'otro';

interface HitoItem {
  id: string;
  proyectoId: string;
  nombre: string;
  fecha: string;
  tipo: TipoHito;
  completado?: boolean;
}

interface HitoUpdate {
  nombre?: string;
  fecha?: string;
  tipo?: TipoHito;
  proyectoId?: string;
  completado?: boolean;
}

const Hitos: React.FC = () => {
  const { t } = useTranslation();
  const TIPOS: Record<TipoHito, { label: string; color: string; icon: React.ReactNode }> = {
    entrega: { label: t('hitos.tipo_entrega', 'Entrega'), color: 'text-purple-600', icon: <Circle className="w-3 h-3" aria-hidden="true" /> },
    pago: { label: t('hitos.tipo_pago', 'Pago'), color: 'text-emerald-600', icon: <Circle className="w-3 h-3" aria-hidden="true" /> },
    inspeccion: { label: t('hitos.tipo_inspeccion', 'Inspección'), color: 'text-amber-600', icon: <Circle className="w-3 h-3" aria-hidden="true" /> },
    licencia: { label: t('hitos.tipo_licencia', 'Licencia'), color: 'text-blue-600', icon: <Circle className="w-3 h-3" aria-hidden="true" /> },
    otro: { label: t('hitos.tipo_otro', 'Otro'), color: 'text-slate-500', icon: <Circle className="w-3 h-3" aria-hidden="true" /> },
  };
  const { hitos, proyectos, addHito, updateHito, currentProjectId, setCurrentProjectId } = useErp();
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fecha, setFecha] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoHito>('entrega');
  const [proyectoId, setProyectoId] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const list = filtroProyecto
      ? hitos.filter(h => h.proyectoId === filtroProyecto)
      : hitos;
    return [...list].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  }, [hitos, filtroProyecto]);

  const reset = () => {
    setFecha(''); setNombre(''); setTipo('entrega'); setProyectoId(filtroProyecto || currentProjectId || '');
    setFormErrors({}); setEditingId(null); setFormOpen(false);
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!nombre.trim()) errs.nombre = t('hitos.error_nombre', 'Nombre requerido');
    if (!fecha) errs.fecha = t('hitos.error_fecha', 'Fecha requerida');
    if (!proyectoId) errs.proyecto = t('hitos.error_proyecto', 'Proyecto requerido');
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});

    if (editingId) {
      const updateData: HitoUpdate = { nombre: nombre.trim(), fecha, tipo, proyectoId };
      updateHito(editingId, updateData);
      toast.success(t('hitos.actualizado', 'Hito actualizado'));
    } else {
      const newHito: HitoItem = { id: '', proyectoId, nombre: nombre.trim(), fecha, tipo };
      addHito(newHito);
      toast.success(t('hitos.creado', 'Hito creado'));
    }
    reset();
  };

  const toggleCompletado = (id: string, actual: boolean) => {
    const updateData: HitoUpdate = { completado: !actual };
    updateHito(id, updateData);
    toast.success(!actual ? t('hitos.completado', 'Completado') : t('hitos.pendiente', 'Pendiente'));
  };

  const startEdit = (hito: HitoItem) => {
    setEditingId(hito.id);
    setFecha(hito.fecha || '');
    setNombre(hito.nombre || '');
    setTipo(hito.tipo || 'entrega');
    setProyectoId(hito.proyectoId || '');
    setFormErrors({});
    setFormOpen(true);
  };

  if (loading) return <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-64 rounded-2xl" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" aria-hidden="true" /> {t('hitos.titulo', 'Hitos')}</h1>
        <div className="flex flex-wrap gap-2">
          <ProyectoFilter value={filtroProyecto} onChange={setFiltroProyecto} proyectos={proyectos} />
          <button onClick={() => { reset(); setFormErrors({}); setFormOpen(!formOpen); }} className={`${BUTTON_PRIMARY} flex items-center gap-1`}><Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t('hitos.nuevo', 'Nuevo')}</button>
        </div>
      </div>

      {formOpen && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-semibold mb-2 truncate" title={editingId ? t('hitos.editar', 'Editar hito') : t('hitos.crear', 'Crear hito')}>{editingId ? t('hitos.editar', 'Editar hito') : t('hitos.crear', 'Crear hito')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-0.5 block">{t('hitos.nombre', 'Nombre')}</label>
              <input value={nombre} onChange={e => { setNombre(e.target.value); setFormErrors(prev => ({ ...prev, nombre: '' })); }} className={`${INPUT} ${formErrors.nombre ? 'border-red-400' : ''}`} />
              {formErrors.nombre && <p className="text-xs text-red-500 mt-0.5">{formErrors.nombre}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-0.5 block">{t('hitos.fecha', 'Fecha')}</label>
              <input type="date" value={fecha} onChange={e => { setFecha(e.target.value); setFormErrors(prev => ({ ...prev, fecha: '' })); }} className={INPUT} />
              {formErrors.fecha && <p className="text-xs text-red-500 mt-0.5">{formErrors.fecha}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-0.5 block">{t('hitos.tipo', 'Tipo')}</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoHito)} className={INPUT}>{('entrega,pago,inspeccion,licencia,otro' as TipoHito[]).map(tp => <option key={tp} value={tp}>{TIPOS[tp]?.label || tp}</option>)}</select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-0.5 block">{t('hitos.proyecto', 'Proyecto')}</label>
              <select value={proyectoId} onChange={e => setProyectoId(e.target.value)} className={INPUT}>
                <option value="">{t('hitos.selecciona_proyecto', 'Selecciona')}</option>
                {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              {formErrors.proyecto && <p className="text-xs text-red-500 mt-0.5">{formErrors.proyecto}</p>}
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSave} className={`${BUTTON_PRIMARY} text-xs`}>{t('common.guardar', 'Guardar')}</button>
            <button onClick={reset} className={`${BUTTON_SECONDARY} text-xs`}>{t('common.cancelar', 'Cancelar')}</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground"><p className="text-sm">{t('hitos.sin_datos', 'Sin hitos')}</p></div>
        )}
        {filtered.map(h => {
          const cfg = TIPOS[h.tipo] || TIPOS.otro;
          const esVencido = h.fecha && h.fecha < new Date().toISOString().slice(0, 10) && !h.completado;
          return (
            <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl border ${h.completado ? 'bg-emerald-50/60 border-emerald-200' : esVencido ? 'bg-red-50/60 border-red-200' : 'bg-card border-border'}`}>
              <button onClick={() => toggleCompletado(h.id, !!h.completado)} aria-label={h.completado ? t('hitos.marcar_pendiente', 'Marcar pendiente') : t('hitos.marcar_completado', 'Marcar completado')} className="p-1.5 rounded-full hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {h.completado ? <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : <Circle className="w-4 h-4 text-slate-400" aria-hidden="true" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-sm font-medium text-foreground truncate">{h.nombre}</span>
                </div>
                <span className="text-xs text-muted-foreground">{h.fecha ? new Date(h.fecha).toLocaleDateString('es-GT') : '—'}</span>
                {esVencido && <span className="ml-2 text-[10px] text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" aria-hidden="true" /> {t('hitos.vencido', 'Vencido')}</span>}
              </div>
              <button onClick={() => startEdit(h)} aria-label={t('common.editar', 'Editar')} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Plus className="w-3 h-3" aria-hidden="true" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Hitos;