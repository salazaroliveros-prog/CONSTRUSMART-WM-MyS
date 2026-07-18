import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ } from '../utils';
import type { CuentaCobrar } from '../types';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, DollarSign, Clock, AlertCircle, CheckCircle2, XCircle, TrendingUp, Filter, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { confirmAction } from '@/lib/confirm-action';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui';

const CuentasCobrar: React.FC = () => {
  const { t } = useTranslation();
  const { cuentasCobrar, proyectos, addCuentaCobrar, updateCuentaCobrar, deleteCuentaCobrar } = useErp();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [formProyectoId, setFormProyectoId] = useState('');
  const [formCliente, setFormCliente] = useState('');
  const [formConcepto, setFormConcepto] = useState('');
  const [formMonto, setFormMonto] = useState(0);
  const [formFechaVencimiento, setFormFechaVencimiento] = useState('');
  const [formEstado, setFormEstado] = useState('pendiente');
  const [formNotas, setFormNotas] = useState('');

  useEffect(() => { setTimeout(() => setLoading(false), 300); }, []);

  const filtered = useMemo(() => {
    return (cuentasCobrar || []).filter(c => {
      const matchesSearch = !searchTerm || 
        c.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.numeroFactura?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = filterEstado === 'todos' || c.estado === filterEstado;
      return matchesSearch && matchesEstado;
    });
  }, [cuentasCobrar, searchTerm, filterEstado]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const pendientes = filtered.filter(c => c.estado === 'pendiente').length;
    const cobradas = filtered.filter(c => c.estado === 'cobrada').length;
    const vencidas = filtered.filter(c => c.estado === 'vencida' || (c.estado === 'pendiente' && c.fechaVencimiento && new Date(c.fechaVencimiento) < new Date())).length;
    const montoTotal = filtered.reduce((s, c) => s + (c.monto || 0), 0);
    const montoCobrado = filtered.filter(c => c.estado === 'cobrada').reduce((s, c) => s + (c.monto || 0), 0);
    return { total, pendientes, cobradas, vencidas, montoTotal, montoCobrado };
  }, [filtered]);

  const handleSave = () => {
    if (!formProyectoId) {
      toast.error(t('cuentas_cobrar.proyecto_requerido', 'Proyecto requerido'));
      return;
    }
    if (!formCliente.trim()) {
      toast.error(t('cuentas_cobrar.cliente_requerido', 'Cliente requerido'));
      return;
    }
    if (!formConcepto.trim()) {
      toast.error(t('cuentas_cobrar.concepto_requerido', 'Concepto requerido'));
      return;
    }
    const data = {
      proyectoId: formProyectoId,
      cliente: formCliente.trim(),
      clienteNombre: formCliente.trim(),
      concepto: formConcepto.trim(),
      monto: formMonto || 0,
      saldoPendiente: formMonto || 0,
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaVencimiento: formFechaVencimiento || new Date().toISOString().split('T')[0],
      estado: formEstado as CuentaCobrar['estado'],
      notas: formNotas || undefined,
    };
    if (editingId) {
      updateCuentaCobrar(editingId, data);
      toast.success(t('cuentas_cobrar.actualizada'));
    } else {
      addCuentaCobrar(data);
      toast.success(t('cuentas_cobrar.creada'));
    }
    setShowForm(false);
    setEditingId(null);
    setFormProyectoId('');
    setFormCliente('');
    setFormConcepto('');
    setFormMonto(0);
    setFormFechaVencimiento('');
    setFormEstado('pendiente');
    setFormNotas('');
  };

  const handleDelete = async (id: string) => {
    await confirmAction({
      title: t('cuentas_cobrar.confirmar_eliminar'),
      content: t('cuentas_cobrar.confirmar_eliminar_msg'),
      okText: t('common.si'),
      cancelText: t('common.cancelar'),
      variant: 'destructive',
    });
    deleteCuentaCobrar(id);
    toast.success(t('cuentas_cobrar.eliminada'));
  };

  const handleMarkAsPaid = (id: string) => {
    updateCuentaCobrar(id, { estado: 'cobrada', fechaCobro: new Date().toISOString().split('T')[0] });
    toast.success(t('cuentas_cobrar.marcada_cobrada'));
  };

  if (loading) return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-4 gap-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div><Skeleton className="h-64" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
          <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" aria-hidden="true" />
          {t('cuentas_cobrar.titulo')}
        </h1>
        <button onClick={() => { setEditingId(null); setShowForm(true); }} className={`${BUTTON_PRIMARY} flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> {t('cuentas_cobrar.nueva_cuenta')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="text-xs text-muted-foreground">{t('cuentas_cobrar.total_por_cobrar')}</div>
          <div className="text-2xl font-bold text-foreground">{fmtQ(stats.montoTotal)}</div>
          <div className="text-xs text-muted-foreground">{stats.total} {t('cuentas_cobrar.cuentas_pendientes')}</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50 p-4">
          <div className="text-xs text-emerald-600">{t('cuentas_cobrar.cobradas')}</div>
          <div className="text-2xl font-bold text-emerald-700">{stats.cobradas}</div>
          <div className="text-xs text-emerald-600">{fmtQ(stats.montoCobrado)}</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/50 p-4">
          <div className="text-xs text-amber-600">{t('cuentas_cobrar.pendientes')}</div>
          <div className="text-2xl font-bold text-amber-700">{stats.pendientes}</div>
          <div className="text-xs text-amber-600">{stats.total > 0 ? Math.round((stats.pendientes / stats.total) * 100) : 0}% {t('cuentas_cobrar.del_total')}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-100 dark:border-red-900/50 p-4">
          <div className="text-xs text-red-600">{t('cuentas_cobrar.vencidas')}</div>
          <div className="text-2xl font-bold text-red-700">{stats.vencidas}</div>
          <div className="text-xs text-red-600">{stats.vencidas > 0 ? t('cuentas_cobrar.requieren_atencion') : t('cuentas_cobrar.sin_vencidas')}</div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">{t('cuentas_cobrar.lista')}</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="text" placeholder={t('cuentas_cobrar.buscar')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${INPUT} pl-9 text-sm`} aria-label={t('cuentas_cobrar.buscar')} />
            </div>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className={`${INPUT} text-sm`}>
              <option value="todos">{t('cuentas_cobrar.todos_estados')}</option>
              <option value="pendiente">{t('cuentas_cobrar.pendiente')}</option>
              <option value="cobrada">{t('cuentas_cobrar.cobrada')}</option>
              <option value="vencida">{t('cuentas_cobrar.vencida')}</option>
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
            <p className="text-sm">{t('cuentas_cobrar.sin_cuentas')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label={t('cuentas_cobrar.titulo')}>
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left p-2" scope="col">{t('cuentas_cobrar.col_cliente')}</th>
                <th className="text-left p-2" scope="col">{t('cuentas_cobrar.col_factura')}</th>
                <th className="text-right p-2" scope="col">{t('cuentas_cobrar.col_monto')}</th>
                <th className="text-center p-2" scope="col">{t('cuentas_cobrar.col_estado')}</th>
                <th className="text-center p-2" scope="col">{t('cuentas_cobrar.col_vencimiento')}</th>
                <th className="text-right p-2" scope="col">{t('common.acciones')}</th>
              </tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/50">
                     <td className="p-2 font-medium truncate" title={c.clienteNombre}>{c.clienteNombre}</td>
                     <td className="p-2 text-muted-foreground truncate" title={c.numeroFactura || '-'}>{c.numeroFactura || '-'}</td>
                    <td className="p-2 text-right font-medium">{fmtQ(c.monto)}</td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        c.estado === 'cobrada' ? 'bg-emerald-100 text-emerald-700' : c.estado === 'vencida' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>{t(`cuentas_cobrar.estado_${c.estado}`)}</span>
                    </td>
                     <td className="p-2 text-center text-muted-foreground truncate" title={c.fechaVencimiento || '-'}>{c.fechaVencimiento || '-'}</td>
                    <td className="p-2 text-right">
                      {c.estado !== 'cobrada' && (
                        <button onClick={() => handleMarkAsPaid(c.id)} className="text-xs bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" aria-label={t('cuentas_cobrar.marcar_cobrada')}>
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        </button>
                      )}
                      <button onClick={() => { setEditingId(c.id); setFormProyectoId(c.proyectoId); setFormCliente(c.cliente || c.clienteNombre); setFormConcepto(c.concepto); setFormMonto(c.monto); setFormFechaVencimiento(c.fechaVencimiento); setFormEstado(c.estado); setFormNotas(c.notas || ''); setShowForm(true); }} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('common.editar')}><Plus className="w-3 h-3" aria-hidden="true" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-accent text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400" aria-label={t('common.eliminar')}><Trash2 className="w-3 h-3" aria-hidden="true" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={editingId ? t('cuentas_cobrar.editar') : t('cuentas_cobrar.nueva_cuenta')}>
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4 text-foreground truncate" title={editingId ? t('cuentas_cobrar.editar') : t('cuentas_cobrar.nueva_cuenta')}>{editingId ? t('cuentas_cobrar.editar') : t('cuentas_cobrar.nueva_cuenta')}</h3>
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cuentas_cobrar.col_cliente')}</label>
                <select value={formProyectoId} onChange={e => setFormProyectoId(e.target.value)} className={INPUT}>
                  <option value="">{t('cuentas_cobrar.seleccionar_proyecto')}</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cuentas_cobrar.col_cliente')}</label>
                <input value={formCliente} onChange={e => setFormCliente(e.target.value)} className={INPUT} placeholder={t('cuentas_cobrar.cliente_placeholder')} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cuentas_cobrar.col_concepto')}</label>
                <input value={formConcepto} onChange={e => setFormConcepto(e.target.value)} className={INPUT} placeholder={t('cuentas_cobrar.concepto_placeholder')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('cuentas_cobrar.col_monto')}</label>
                  <input type="number" inputMode="decimal" value={formMonto || ''} onChange={e => setFormMonto(+e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t('cuentas_cobrar.col_vencimiento')}</label>
                  <input type="date" value={formFechaVencimiento} onChange={e => setFormFechaVencimiento(e.target.value)} className={INPUT} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cuentas_cobrar.col_estado')}</label>
                <select value={formEstado} onChange={e => setFormEstado(e.target.value)} className={INPUT}>
                  <option value="pendiente">{t('cuentas_cobrar.pendiente')}</option>
                  <option value="cobrada">{t('cuentas_cobrar.cobrada')}</option>
                  <option value="vencida">{t('cuentas_cobrar.vencida')}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cuentas_cobrar.notas', 'Notas')}</label>
                <textarea value={formNotas} onChange={e => setFormNotas(e.target.value)} className={`${INPUT} min-h-[60px]`} placeholder={t('cuentas_cobrar.notas_placeholder', 'Notas adicionales')} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className={`${BUTTON_PRIMARY}`}>{editingId ? t('common.guardar') : t('cuentas_cobrar.nueva_cuenta')}</button>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className={`${BUTTON_SECONDARY}`}>{t('common.cancelar')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuentasCobrar;