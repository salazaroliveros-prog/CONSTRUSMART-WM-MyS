import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ, fmtPct } from '../utils';
import type { Presupuesto } from '../types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { confirmAction } from '@/lib/confirm-action';
import { Download, Copy, Trash2, Eye, Edit2, Plus, Save, X, RefreshCw, AlertTriangle, Wallet } from 'lucide-react';

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
    await confirmAction({
      title: t('presupuestos.confirmar_eliminar_titulo'),
      content: t('presupuestos.confirmar_eliminar_contenido'),
      okText: t('common.si'),
      cancelText: t('common.cancelar'),
      variant: 'destructive',
    });
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

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
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
          <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" aria-hidden="true" />
          {t('presupuestos.titulo')}
        </h1>
        <button onClick={handleCreatePresupuesto} className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t('presupuestos.nuevo_presupuesto')}</button>
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
                <td className="p-2 text-right"><span className={`px-2 py-1 rounded text-xs font-medium ${p.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700' : p.estado === 'rechazado' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{p.estado}</span></td>
                <td className="p-2 text-right">
                  <button onClick={(e) => { e.stopPropagation(); handleEditPresupuesto(p.id); }} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t('presupuestos.editar')} ${p.nombre}`}><Edit2 className="w-4 h-4" aria-hidden="true" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeletePresupuesto(p.id); }} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t('presupuestos.eliminar')} ${p.nombre}`}><Trash2 className="w-4 h-4 text-red-500" aria-hidden="true" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={editPresupuestoId ? t('presupuestos.editar') : t('presupuestos.nuevo_presupuesto')}>
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
                <button onClick={handleSubmitPresupuesto} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">{editPresupuestoId ? t('common.guardar') : t('presupuestos.crear')}</button>
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