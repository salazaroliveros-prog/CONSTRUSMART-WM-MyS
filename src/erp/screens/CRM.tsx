import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { Licitacion } from '../types';
import { fmtQ } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, X, Target, TrendingUp, DollarSign,
  Briefcase, CheckCircle, Clock, Archive,
  Pencil, Trash2, PieChart, Clipboard
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER, COLOR_INFO, COLOR_PRIMARY, SECTION_TITLE, CARD, KPI_CARD, BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_ICON, BUTTON_DANGER, INPUT, MODAL_OVERLAY, MODAL_PANEL, MODAL_HEADER, MODAL_TITLE, MODAL_CLOSE } from '../ui';

const licitacionFormSchema = (t: ReturnType<typeof useTranslation>['t']) => z.object({
  nombre: z.string().min(1, t('crm.err_nombre_requerido')).max(200, t('crm.err_nombre_max')),
  proyectoId: z.string().optional().default(''),
  cliente: z.string().min(1, t('crm.err_cliente_requerido')).max(150, t('crm.err_cliente_max')),
  descripcion: z.string().max(2000).optional().default(''),
  monto: z.coerce.number().min(0, t('crm.err_monto_min')).max(999_999_999, t('crm.err_monto_max')),
  probabilidad: z.coerce.number().min(0).max(100).default(50),
  notas: z.string().max(2000).optional().default(''),
  fechaLimite: z.string().optional().default(''),
});

const ESTADOS = [
  { key: 'activa' as const, label: 'Activa', color: 'bg-blue-50 border-blue-300', icon: Clock, textColor: 'text-blue-600' },
  { key: 'adjudicada' as const, label: 'Adjudicada', color: 'bg-emerald-50 border-emerald-300', icon: CheckCircle, textColor: 'text-emerald-600' },
  { key: 'perdida' as const, label: 'Perdida', color: 'bg-red-50 border-red-300', icon: Archive, textColor: COLOR_DANGER },
  { key: 'cerrada' as const, label: 'Cerrada', color: 'bg-muted border-slate-300', icon: Archive, textColor: 'text-muted-foreground' },
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
  const [formNombre, setFormNombre] = useState('');
  const [formCliente, setFormCliente] = useState('');
  const [formMonto, setFormMonto] = useState(0);
  const [formProbabilidad, setFormProbabilidad] = useState(50);
  const [formEstado, setFormEstado] = useState<Licitacion['estado']>('activa');
  const [formProyectoId, setFormProyectoId] = useState('');
  const [formFechaLimite, setFormFechaLimite] = useState('');
  const [formNotas, setFormNotas] = useState('');
  const licitacionesFiltradas = useMemo(() => licitaciones.filter(l => !filtroProyecto || l.proyectoId === filtroProyecto), [licitaciones, filtroProyecto]);

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (licitacionesFiltradas.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Briefcase className="w-16 h-16 text-muted-foreground/30 mb-4" aria-hidden="true" />
        <h2 className="text-xl font-bold text-foreground mb-2">{t('crm.titulo')}</h2>
        <p className="text-muted-foreground">{t('crm.sin_licitaciones')}</p>
      </div>
    );
  }

  const resetForm = () => {
    setFormNombre('');
    setFormCliente('');
    setFormMonto(0);
    setFormProbabilidad(50);
    setFormEstado('activa');
    setFormProyectoId('');
    setFormFechaLimite('');
    setFormNotas('');
    setEditingId(null);
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    if (!formNombre.trim()) errors.nombre = t('crm.err_nombre_requerido');
    if (!formCliente.trim()) errors.cliente = t('crm.err_cliente_requerido');
    if (formMonto < 0) errors.monto = t('crm.err_monto_min');
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return;
    }
    const data = {
      nombre: formNombre.trim(),
      cliente: formCliente.trim(),
      monto: formMonto,
      probabilidad: formProbabilidad,
      estado: formEstado,
      proyectoId: formProyectoId || undefined,
      fechaLimite: formFechaLimite || undefined,
      notas: formNotas || undefined,
      documentos: [],
    };
    if (editingId) {
      updateLicitacion(editingId, data);
      toast.success(t('crm.actualizada_exito', 'Licitación actualizada'));
    } else {
      addLicitacion({ ...data, createdAt: new Date().toISOString() });
      toast.success(t('crm.creada_exito', 'Licitación creada'));
    }
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (l: Licitacion) => {
    setEditingId(l.id);
    setFormNombre(l.nombre);
    setFormCliente(l.cliente);
    setFormMonto(l.monto);
    setFormProbabilidad(l.probabilidad);
    setFormEstado(l.estado);
    setFormProyectoId(l.proyectoId || '');
    setFormFechaLimite(l.fechaLimite || '');
    setFormNotas(l.notas || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await confirmAction({
      title: t('crm.confirmar_eliminar_titulo', 'Confirmar eliminación'),
      content: t('crm.confirmar_eliminar_contenido', '¿Eliminar esta licitación?'),
      okText: t('common.si'),
      cancelText: t('common.cancelar'),
      variant: 'destructive',
    });
    deleteLicitacion(id);
    toast.success(t('crm.eliminado_exito'));
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" aria-hidden="true" />
          {t('crm.titulo')}
        </h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="px-3 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t('crm.nueva_licitacion')}</button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm table-fixed" role="table" aria-label={t('crm.titulo')}>
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="text-left p-2 w-[30%]" scope="col">{t('crm.col_nombre')}</th>
            <th className="text-left p-2 w-[25%]" scope="col">{t('crm.col_cliente')}</th>
            <th className="text-right p-2 w-[15%]" scope="col">{t('crm.col_monto')}</th>
            <th className="text-center p-2 w-[10%]" scope="col">{t('crm.col_probabilidad')}</th>
            <th className="text-right p-2 w-[10%]" scope="col">{t('common.estado')}</th>
            <th className="text-right p-2 w-[10%]" scope="col">{t('common.acciones')}</th>
          </tr></thead>
          <tbody>
            {licitacionesFiltradas.map(l => {
              const estado = ESTADOS.find(e => e.key === l.estado) || ESTADOS[0];
              return (
                <tr key={l.id} className="border-b border-border hover:bg-muted/50" tabIndex={0} role="row">
                  <td className="p-2 max-w-0"><span className="block truncate font-medium" title={l.nombre}>{l.nombre}</span></td>
                  <td className="p-2 max-w-0"><span className="block truncate text-muted-foreground" title={l.cliente}>{l.cliente}</span></td>
                  <td className="p-2 text-right">{fmtQ(l.monto)}</td>
                  <td className="p-2 text-center">{l.probabilidad}%</td>
                  <td className="p-2 text-right"><span className={`px-2 py-1 rounded text-xs font-medium ${estado.color} ${estado.textColor}`}>{t(`crm.estado_${l.estado}`)}</span></td>
                  <td className="p-2 text-right">
                     <button onClick={(e) => { e.stopPropagation(); handleEdit(l); }} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t('crm.editar')} ${l.nombre}`}><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                     <button onClick={(e) => { e.stopPropagation(); handleDelete(l.id); }} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t('crm.eliminar')} ${l.nombre}`}><Trash2 className="w-4 h-4 text-red-500" aria-hidden="true" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className={MODAL_OVERLAY} role="dialog" aria-modal="true" aria-label={editingId ? t('crm.editar') : t('crm.nueva_licitacion')} onClick={() => { setShowForm(false); resetForm(); }}>
          <div className={MODAL_PANEL} onClick={e => e.stopPropagation()}>
            <div className={MODAL_HEADER}>
              <h2 className={MODAL_TITLE + " truncate"} title={editingId ? t('crm.editar') : t('crm.nueva_licitacion')}>{editingId ? t('crm.editar') : t('crm.nueva_licitacion')}</h2>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className={MODAL_CLOSE} aria-label={t('common.cerrar')}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('crm.col_nombre')}</label>
                <input value={formNombre} onChange={e => setFormNombre(e.target.value)} className={INPUT} placeholder={t('crm.nombre_placeholder')} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('crm.col_cliente')}</label>
                <input value={formCliente} onChange={e => setFormCliente(e.target.value)} className={INPUT} placeholder={t('crm.cliente_placeholder')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('crm.col_monto')}</label>
                  <input type="number" inputMode="decimal" value={formMonto || ''} onChange={e => setFormMonto(+e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('crm.col_probabilidad')}</label>
                  <input type="number" value={formProbabilidad} onChange={e => setFormProbabilidad(Math.min(100, Math.max(0, +e.target.value)))} className={INPUT} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('crm.estado')}</label>
                  <select value={formEstado} onChange={e => setFormEstado(e.target.value as Licitacion['estado'])} className={INPUT}>
                    {ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('crm.fecha_limite', 'Fecha límite')}</label>
                  <input type="date" value={formFechaLimite} onChange={e => setFormFechaLimite(e.target.value)} className={INPUT} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('crm.notas', 'Notas')}</label>
                <textarea value={formNotas} onChange={e => setFormNotas(e.target.value)} className={`${INPUT} min-h-[60px]`} placeholder={t('crm.notas_placeholder')} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSubmit} className={`${BUTTON_PRIMARY}`}>{editingId ? t('common.guardar') : t('crm.nueva_licitacion')}</button>
                <button onClick={() => { setShowForm(false); resetForm(); }} className={`${BUTTON_SECONDARY}`}>{t('common.cancelar')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;