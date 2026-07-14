import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ, fmtPct } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { confirmAction } from '@/lib/confirm-action';
import { Download, Copy, Trash2, Eye, Edit2, Plus, Save, X, RefreshCw, AlertTriangle, Wallet } from 'lucide-react';

const Presupuestos: React.FC = () => {
  const { t } = useTranslation();
  const { presupuestos, proyectos, addPresupuesto, updatePresupuesto, deletePresupuesto, renglones, addRenglon, updateRenglon, deleteRenglon } = useErp();
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editPresupuestoId, setEditPresupuestoId] = useState<string | null>(null);
  const [filtroProyecto, setFiltroProyecto] = useState<string>('todos');

  useEffect(() => { setTimeout(() => setLoading(false), 300); }, []);

  const presupuestosFiltrados = useMemo(() => {
    if (filtroProyecto === 'todos') return presupuestos;
    return presupuestos.filter(p => p.proyectoId === filtroProyecto);
  }, [presupuestos, filtroProyecto]);

  const selectedPresupuesto = presupuestos.find(p => p.id === selectedId) || null;
  const renglonesDelPresupuesto = useMemo(() => {
    if (!selectedPresupuesto) return [];
    return renglones.filter(r => r.presupuestoId === selectedPresupuesto.id);
  }, [renglones, selectedPresupuesto]);

  const handleCreatePresupuesto = () => {
    setEditPresupuestoId(null);
    setShowForm(true);
  };

  const handleEditPresupuesto = (id: string) => {
    setEditPresupuestoId(id);
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

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;

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
    </div>
  );
};

export default Presupuestos;