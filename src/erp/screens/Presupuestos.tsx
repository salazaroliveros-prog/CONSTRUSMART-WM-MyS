import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ, fmtPct } from '../utils';
import type { Presupuesto } from '../types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { confirmAction } from '@/lib/confirm-action';
import { Download, Copy, Trash2, Eye, Edit2, Plus, Save, X, RefreshCw, AlertTriangle, Wallet } from 'lucide-react';
import { BarChart, Donut } from '../components/Charts';

const Presupuestos: React.FC = () => {
  const { t } = useTranslation();
  const { presupuestos, proyectos, addPresupuesto, updatePresupuesto, deletePresupuesto } = useErp();
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editPresupuestoId, setEditPresupuestoId] = useState<string | null>(null);
  const [filtroProyecto, setFiltroProyecto] = useState<string>('todos');
  const [formNombre, setFormNombre] = useState('');
  const [formProyectoId, setFormProyectoId] = useState('');
  const [formTipologia, setFormTipologia] = useState<Presupuesto['tipologia']>('residencial');
  const [formEstado, setFormEstado] = useState<Presupuesto['estado']>('borrador');
  const [formMoneda, setFormMoneda] = useState<string>('GTQ');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const presupuestosFiltrados = useMemo(() => {
    if (filtroProyecto === 'todos') return presupuestos;
    return presupuestos.filter(p => p.proyectoId === filtroProyecto);
  }, [presupuestos, filtroProyecto]);

  const selectedPresupuesto = presupuestos.find(p => p.id === selectedId) || null;
  const renglonesDelPresupuesto = useMemo(() => {
    if (!selectedPresupuesto) return [];
    return (selectedPresupuesto.renglones || []).filter(r => r.presupuestoId === selectedPresupuesto.id);
  }, [selectedPresupuesto]);

  const handleCreatePresupuesto = () => {
    setEditPresupuestoId(null);
    setShowForm(true);
  };

  const handleEditPresupuesto = (id: string) => {
    const p = presupuestos.find(pr => pr.id === id);
    if (!p) return;
    setEditPresupuestoId(id);
    setFormNombre(p.nombre || '');
    setFormProyectoId(p.proyectoId);
    setFormTipologia((p as any).tipologia || 'residencial');
    setFormEstado(p.estado);
    setFormMoneda((p as any).moneda || 'GTQ');
    setShowForm(true);
  };

  const handleDeletePresupuesto = async (id: string) => {
    try {
      await confirmAction({
        title: t('presupuestos.confirmar_eliminar_titulo'),
        content: t('presupuestos.confirmar_eliminar_contenido'),
        okText: t('common.si'),
        cancelText: t('common.cancelar'),
        variant: 'destructive',
      });
    } catch { return; }
    deletePresupuesto(id);
    if (selectedId === id) setSelectedId(null);
    toast.success(t('presupuestos.eliminado_exito'));
  };

  const resetForm = () => {
    setFormNombre('');
    setFormProyectoId('');
    setFormTipologia('residencial');
    setFormEstado('borrador');
    setFormMoneda('GTQ');
    setEditPresupuestoId(null);
  };

  const handleSubmitPresupuesto = () => {
    if (!formNombre.trim()) {
      toast.error(t('presupuestos.nombre_requerido', 'Nombre requerido'));
      return;
    }
    if (!formProyectoId) {
      toast.error(t('presupuestos.proyecto_requerido', 'Proyecto requerido'));
      return;
    }
    if (editPresupuestoId) {
      updatePresupuesto(editPresupuestoId, {
        nombre: formNombre.trim(),
        proyectoId: formProyectoId,
        tipologia: formTipologia,
        estado: formEstado,
        moneda: formMoneda,
      });
      toast.success(t('presupuestos.actualizado_exito', 'Presupuesto actualizado'));
    } else {
      addPresupuesto({
        nombre: formNombre.trim(),
        proyectoId: formProyectoId,
        tipologia: formTipologia,
        estado: formEstado,
        version: 1,
        totalCalculado: 0,
        renglones: [],
        fechaCreacion: new Date().toISOString(),
        moneda: formMoneda,
      });
      toast.success(t('presupuestos.creado_exito', 'Presupuesto creado'));
    }
    resetForm();
    setShowForm(false);
  };

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64 rounded-lg" /><div className="grid grid-cols-3 gap-4"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div><div className="grid grid-cols-2 gap-4"><Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" /></div><Skeleton className="h-64 w-full rounded-xl" /></div>;
  if (presupuestosFiltrados.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Wallet className="w-16 h-16 text-muted-foreground/30 mb-4" aria-hidden="true" />
        <h2 className="text-xl font-bold text-foreground mb-2">{t('presupuestos.titulo')}</h2>
        <p className="text-muted-foreground">{t('presupuestos.sin_presupuestos')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
          <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 dark:text-blue-400" aria-hidden="true" />
          {t('presupuestos.titulo')}
        </h1>
        <button onClick={handleCreatePresupuesto} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t('presupuestos.nuevo_presupuesto')}</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900/50">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t('presupuestos.total', 'Total Presupuestos')}</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{presupuestos.length}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl p-4 text-center border border-emerald-100 dark:border-emerald-900/50">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('presupuestos.monto_total', 'Monto Total')}</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">Q{presupuestos.reduce((a: number, p: Presupuesto) => a + (p.totalCalculado || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-950/40 rounded-xl p-4 text-center border border-violet-100 dark:border-violet-900/50">
          <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">{t('presupuestos.tipologias', 'Tipologías')}</p>
          <p className="text-xl font-bold text-violet-700 dark:text-violet-300">{new Set(presupuestos.map(p => (p as any).tipologia || '')).size}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('presupuestos.grafico_montos', 'Montos por Proyecto')}</h3>
          <BarChart
            data={presupuestosFiltrados.map(p => ({
              label: proyectos.find(pr => pr.id === p.proyectoId)?.nombre || p.nombre,
              value: p.totalCalculado || 0,
              color: 'hsl(var(--primary))'
            }))}
            height={200}
            palette="default"
          />
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('presupuestos.grafico_tipologias', 'Distribución por Tipología')}</h3>
          <Donut
            data={Array.from(new Set(presupuestosFiltrados.map(p => (p as any).tipologia || 'otro'))).map(tipologia => ({
              label: tipologia,
              value: presupuestosFiltrados.filter(p => (p as any).tipologia === tipologia).length,
              color: tipologia === 'residencial' ? 'hsl(var(--primary))' :
                     tipologia === 'comercial' ? 'hsl(var(--success))' :
                     tipologia === 'industrial' ? 'hsl(var(--warning))' :
                     'hsl(var(--info))'
            }))}
            height={200}
            palette="cool"
          />
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm" role="table" aria-label={t('presupuestos.titulo')}>
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="text-left p-2" scope="col">{t('presupuestos.col_nombre')}</th>
            <th className="text-left p-2" scope="col">{t('presupuestos.col_proyecto')}</th>
            <th className="text-right p-2" scope="col">{t('presupuestos.col_total')}</th>
            <th className="text-right p-2" scope="col">{t('presupuestos.col_estado')}</th>
            <th className="text-right p-2" scope="col">{t('common.acciones')}</th>
          </tr></thead>
          <tbody>
            {presupuestosFiltrados.map(p => (
              <tr key={p.id} className={`border-b border-border hover:bg-muted/50 cursor-pointer ${selectedId === p.id ? 'bg-muted' : ''}`} onClick={() => setSelectedId(p.id)} tabIndex={0} role="row" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(p.id); } }}>
                <td className="p-2 font-medium">{p.nombre}</td>
                <td className="p-2 text-muted-foreground">{proyectos.find(pr => pr.id === p.proyectoId)?.nombre || '-'}</td>
                <td className="p-2 text-right">{fmtQ(p.totalCalculado || 0)}</td>
                <td className="p-2 text-right"><span className={`px-2 py-1 rounded text-xs font-medium ${p.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : p.estado === 'rechazado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>{p.estado}</span></td>
                <td className="p-2 text-right">
                  <button onClick={(e) => { e.stopPropagation(); handleEditPresupuesto(p.id); }} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t('presupuestos.editar')} ${p.nombre}`}><Edit2 className="w-4 h-4" aria-hidden="true" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeletePresupuesto(p.id); }} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t('presupuestos.eliminar')} ${p.nombre}`}><Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" aria-hidden="true" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label={editPresupuestoId ? t('presupuestos.editar') : t('presupuestos.nuevo_presupuesto')}>
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4 text-foreground truncate" title={editPresupuestoId ? t('presupuestos.editar') : t('presupuestos.nuevo_presupuesto')}>{editPresupuestoId ? t('presupuestos.editar') : t('presupuestos.nuevo_presupuesto')}</h3>
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('presupuestos.nombre')}</label>
                <input value={formNombre} onChange={e => setFormNombre(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:border-ring" placeholder={t('presupuestos.nombre_placeholder')} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('presupuestos.proyecto')}</label>
                <select value={formProyectoId} onChange={e => setFormProyectoId(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:border-ring">
                  <option value="">{t('presupuestos.seleccionar_proyecto')}</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('presupuestos.tipologia')}</label>
                  <select value={formTipologia} onChange={e => setFormTipologia(e.target.value as Presupuesto['tipologia'])} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:border-ring">
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="civil">Civil</option>
                    <option value="publica">Pública</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('presupuestos.moneda')}</label>
                  <select value={formMoneda} onChange={e => setFormMoneda(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:border-ring">
                    <option value="GTQ">GTQ</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('presupuestos.estado')}</label>
                <select value={formEstado} onChange={e => setFormEstado(e.target.value as Presupuesto['estado'])} className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground outline-none focus:border-ring">
                  <option value="borrador">Borrador</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="revisado">Revisado</option>
                  <option value="rechazado">Rechazado</option>
                  <option value="anulado">Anulado</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSubmitPresupuesto} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{editPresupuestoId ? t('common.guardar') : t('presupuestos.crear')}</button>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t('common.cancelar')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Presupuestos;
