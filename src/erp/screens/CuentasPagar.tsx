import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ } from '../utils';
import { Plus, Search, DollarSign, Clock, AlertCircle, CheckCircle2, XCircle, TrendingUp, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { confirmAction } from '@/lib/confirm-action';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui';

const CuentasPagar: React.FC = () => {
  const { t } = useTranslation();
  const { cuentasPagar, proveedores, addCuentaPagar, updateCuentaPagar, deleteCuentaPagar } = useErp();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  useEffect(() => { setTimeout(() => setLoading(false), 300); }, []);

  const filtered = useMemo(() => {
    return (cuentasPagar || []).filter(c => {
      const matchesSearch = !searchTerm || 
        c.proveedorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.concepto.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = filterEstado === 'todos' || c.estado === filterEstado;
      return matchesSearch && matchesEstado;
    });
  }, [cuentasPagar, searchTerm, filterEstado]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pendientes = filtered.filter(c => c.estado === 'pendiente').length;
    const pagadas = filtered.filter(c => c.estado === 'pagada').length;
    const vencidas = filtered.filter(c => c.estado === 'vencida' || (c.estado === 'pendiente' && c.fechaVencimiento && new Date(c.fechaVencimiento) < new Date())).length;
    const montoTotal = filtered.reduce((s, c) => s + (c.monto || 0), 0);
    const montoPagado = filtered.filter(c => c.estado === 'pagada').reduce((s, c) => s + (c.monto || 0), 0);
    const promedio = total > 0 ? montoTotal / total : 0;
    return { total, pendientes, pagadas, vencidas, montoTotal, montoPagado, promedio };
  }, [filtered]);

  const handleSave = (data: any) => {
    if (editingId) {
      updateCuentaPagar(editingId, data);
      toast.success(t('cuentas_pagar.actualizada'));
    } else {
      addCuentaPagar(data);
      toast.success(t('cuentas_pagar.creada'));
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await confirmAction({
      title: t('cuentas_pagar.confirmar_eliminar'),
      content: t('cuentas_pagar.confirmar_eliminar_msg'),
      okText: t('common.si'),
      cancelText: t('common.cancelar'),
      variant: 'destructive',
    });
    deleteCuentaPagar(id);
    toast.success(t('cuentas_pagar.eliminada'));
  };

  const handleMarkAsPaid = (id: string) => {
    updateCuentaPagar(id, { estado: 'pagada', fechaPago: new Date().toISOString().split('T')[0] });
    toast.success(t('cuentas_pagar.marcada_pagada'));
  };

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-4 gap-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><Skeleton className="h-64" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
          <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500" aria-hidden="true" />
          {t('cuentas_pagar.titulo')}
        </h1>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className={`${BUTTON_PRIMARY} flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> {t('cuentas_pagar.nueva_cuenta')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="text-xs text-muted-foreground">{t('cuentas_pagar.total_por_pagar')}</div>
          <div className="text-2xl font-bold text-foreground">{fmtQ(stats.montoTotal)}</div>
          <div className="text-xs text-muted-foreground">{stats.total} {t('cuentas_pagar.cuentas_pendientes')}</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50 p-4">
          <div className="text-xs text-emerald-600">{t('cuentas_pagar.pagadas')}</div>
          <div className="text-2xl font-bold text-emerald-700">{stats.pagadas}</div>
          <div className="text-xs text-emerald-600">{fmtQ(stats.montoPagado)}</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/50 p-4">
          <div className="text-xs text-amber-600">{t('cuentas_pagar.pendientes')}</div>
          <div className="text-2xl font-bold text-amber-700">{stats.pendientes}</div>
          <div className="text-xs text-amber-600">{stats.total > 0 ? Math.round((stats.pendientes / stats.total) * 100) : 0}% {t('cuentas_pagar.del_total')}</div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/50 p-4">
          <div className="text-xs text-rose-600">{t('cuentas_pagar.vencidas')}</div>
          <div className="text-2xl font-bold text-rose-700">{stats.vencidas}</div>
          <div className="text-xs text-rose-600">{stats.vencidas > 0 ? t('cuentas_pagar.requiere_pago_inmediato') : t('cuentas_pagar.sin_vencidas')}</div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">{t('cuentas_pagar.lista')}</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="text" placeholder={t('cuentas_pagar.buscar')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${INPUT} pl-9 text-sm`} aria-label={t('cuentas_pagar.buscar')} />
            </div>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className={`${INPUT} text-sm`}>
              <option value="todos">{t('cuentas_pagar.todos_estados')}</option>
              <option value="pendiente">{t('cuentas_pagar.pendiente')}</option>
              <option value="pagada">{t('cuentas_pagar.pagada')}</option>
              <option value="vencida">{t('cuentas_pagar.vencida')}</option>
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
            <p className="text-sm">{t('cuentas_pagar.sin_cuentas')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label={t('cuentas_pagar.titulo')}>
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left p-2" scope="col">{t('cuentas_pagar.col_proveedor')}</th>
                <th className="text-left p-2" scope="col">{t('cuentas_pagar.col_concepto')}</th>
                <th className="text-right p-2" scope="col">{t('cuentas_pagar.col_monto')}</th>
                <th className="text-center p-2" scope="col">{t('cuentas_pagar.col_estado')}</th>
                <th className="text-center p-2" scope="col">{t('cuentas_pagar.col_vencimiento')}</th>
                <th className="text-right p-2" scope="col">{t('common.acciones')}</th>
              </tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-2 font-medium">{c.proveedorNombre}</td>
                    <td className="p-2 text-muted-foreground">{c.concepto}</td>
                    <td className="p-2 text-right font-medium">{fmtQ(c.monto)}</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        c.estado === 'pagada' ? 'bg-emerald-100 text-emerald-700' : c.estado === 'vencida' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{t(`cuentas_pagar.estado_${c.estado}`)}</span>
                    </td>
                    <td className="p-2 text-center text-muted-foreground">{c.fechaVencimiento || '-'}</td>
                    <td className="p-2 text-right">
                      {c.estado !== 'pagada' && (
                        <button onClick={() => handleMarkAsPaid(c.id)} className="text-xs bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" aria-label={t('cuentas_pagar.marcar_pagada')}>
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        </button>
                      )}
                      <button onClick={() => { setEditingId(c.id); setShowForm(true); }} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('common.editar')}><Plus className="w-3 h-3" aria-hidden="true" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-accent text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400" aria-label={t('common.eliminar')}><Trash2 className="w-3 h-3" aria-hidden="true" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CuentasPagar;