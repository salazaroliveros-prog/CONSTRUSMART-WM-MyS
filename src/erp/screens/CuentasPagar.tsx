import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import { useErp } from '../store';
import { CuentaPagar } from '../types';
import ProyectoFilter from '../components/ProyectoFilter';
import { DollarSign, Plus, X, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { INPUT, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER, COLOR_INFO } from '../ui';
import { toast } from 'sonner';
import { Modal } from 'antd';
import { todayISO, fmtQ } from '../utils';

const CuentasPagarScreen: React.FC = () => {
  const { proyectos, cuentasPagar, addCuentaPagar, updateCuentaPagar, deleteCuentaPagar } = useErp();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const clearFieldError = (field: string) => setFormErrors(prev => ({ ...prev, [field]: '' }));
  const set = (patch: Record<string, any>) => { setForm(prev => ({ ...prev, ...patch })); Object.keys(patch).forEach(clearFieldError); };
  const [form, setForm] = useState({ proyectoId: '', proveedor: '', concepto: '', monto: 0, fechaEmision: todayISO(), fechaVencimiento: '', facturaUrl: '' });

  const agregar = () => {
    const errs: Record<string, string> = {};
    if (!form.proveedor) errs.proveedor = 'Proveedor requerido';
    if (!form.concepto) errs.concepto = 'Concepto requerido';
    if (!form.monto || form.monto <= 0) errs.monto = 'Monto debe ser mayor a 0';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    addCuentaPagar({
      proyectoId: form.proyectoId, proveedor: form.proveedor, concepto: form.concepto,
      monto: form.monto, saldoPendiente: form.monto, fechaEmision: form.fechaEmision,
      fechaVencimiento: form.fechaVencimiento, estado: 'pendiente', facturaUrl: form.facturaUrl || undefined,
    });
    toast.success('Cuenta por pagar registrada');
    setShowForm(false);
    setForm({ proyectoId: '', proveedor: '', concepto: '', monto: 0, fechaEmision: todayISO(), fechaVencimiento: '', facturaUrl: '' });
    setFormErrors({});
  };

  const pagar = (id: string) => {
    updateCuentaPagar(id, { estado: 'pagado', fechaPago: todayISO(), saldoPendiente: 0 });
    toast.success('Pago registrado');
  };

  const eliminar = async (id: string) => {
    try {
      await Modal.confirm({ title: 'Confirmar eliminación', content: '¿Eliminar esta cuenta por pagar?', centered: true, okText: 'Sí, eliminar', cancelText: 'Cancelar' });
      deleteCuentaPagar(id);
      toast.success('Cuenta por pagar eliminada');
    } catch {}
  };

  const filtradas = filtroProyecto ? cuentasPagar.filter(c => c.proyectoId === filtroProyecto) : cuentasPagar;
  const pendientes = filtradas.filter(c => c.estado === 'pendiente' || c.estado === 'parcial');
  const vencidos = filtradas.filter(c => c.estado === 'vencido' || (c.estado === 'pendiente' && c.fechaVencimiento < todayISO()));
  const totalPendiente = pendientes.reduce((a, c) => a + c.saldoPendiente, 0);

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
    <div className="p-3 sm:p-4 lg:p-5 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-2xl font-black text-foreground flex items-center gap-2"><TrendingDown className={`w-6 h-6 ${COLOR_DANGER}`} /> Cuentas por Pagar</h1><p className="text-sm text-muted-foreground">Gestión de cuentas por pagar a proveedores</p></div>
        <div className="flex items-center gap-2">
          <ProyectoFilter value={filtroProyecto} onChange={setFiltroProyecto} proyectos={proyectos} />
          <button onClick={() => setShowForm(true)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Cuenta</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-card rounded-xl p-3 border border-border"><div className="flex items-center gap-2"><DollarSign className={`w-4 h-4 ${COLOR_DANGER}`} /><span className="text-xs text-muted-foreground">Total por pagar</span></div><div className={`text-xl font-bold ${COLOR_DANGER}`}>{fmtQ(totalPendiente)}</div></div>
        <div className="bg-card rounded-xl p-3 border border-border"><div className="flex items-center gap-2"><TrendingDown className={`w-4 h-4 ${COLOR_INFO}`} /><span className="text-xs text-muted-foreground">Pendientes</span></div><div className="text-xl font-bold text-foreground">{pendientes.length}</div></div>
        <div className="bg-card rounded-xl p-3 border border-border"><div className="flex items-center gap-2"><CheckCircle className={`w-4 h-4 ${COLOR_SUCCESS}`} /><span className="text-xs text-muted-foreground">Pagadas</span></div><div className={`text-xl font-bold ${COLOR_SUCCESS}`}>{filtradas.filter(c => c.estado === 'pagado').length}</div></div>
        <div className={`rounded-xl p-3 border ${vencidos.length > 0 ? 'bg-red-50 border-red-200' : 'bg-card border-border'}`}><div className="flex items-center gap-2"><AlertTriangle className={`w-4 h-4 ${COLOR_DANGER}`} /><span className="text-xs text-muted-foreground">Vencidas</span></div><div className={`text-xl font-bold ${COLOR_DANGER}`}>{vencidos.length}</div></div>
      </div>
      {showForm && (
        <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <input value={form.proveedor} onChange={e => set({ proveedor: e.target.value })} placeholder="Nombre del proveedor *" className={INPUT} />
              {formErrors.proveedor && <p className="text-xs text-red-500 mt-0.5">{formErrors.proveedor}</p>}
            </div>
            <div>
              <input value={form.concepto} onChange={e => set({ concepto: e.target.value })} placeholder="Concepto *" className={INPUT} />
              {formErrors.concepto && <p className="text-xs text-red-500 mt-0.5">{formErrors.concepto}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <input type="number" inputMode="decimal" value={form.monto ?? ''} onChange={e => set({ monto: +e.target.value })} placeholder="Monto Q *" className={INPUT} />
              {formErrors.monto && <p className="text-xs text-red-500 mt-0.5">{formErrors.monto}</p>}
            </div>
            <input type="date" value={form.fechaEmision} onChange={e => set({ fechaEmision: e.target.value })} className={INPUT} />
            <input type="date" value={form.fechaVencimiento} onChange={e => set({ fechaVencimiento: e.target.value })} placeholder="Fecha vencimiento" className={INPUT} />
          </div>
          <select value={form.proyectoId} onChange={e => set({ proyectoId: e.target.value })} className={INPUT}><option value="">Sin proyecto</option>{proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
          <input value={form.facturaUrl} onChange={e => set({ facturaUrl: e.target.value })} placeholder="URL de factura (opcional)" className={INPUT} />
          <div className="flex gap-2"><button onClick={agregar} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-xs font-semibold">Registrar</button><button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground">Cancelar</button></div>
        </div>
      )}
      <div className="space-y-2">
        {filtradas.length === 0 ? <div className="text-center py-10 text-muted-foreground"><TrendingDown className="w-10 h-10 mx-auto mb-2 text-slate-300" /><p className="text-sm">Sin cuentas por pagar</p></div>
        : [...filtradas].sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento)).map(c => {
          const vencida = c.estado === 'pendiente' && c.fechaVencimiento < todayISO();
          return (
            <div key={c.id} className={`bg-card rounded-xl border p-4 ${c.estado === 'pagado' ? 'border-emerald-200 bg-emerald-50/30' : vencida ? 'border-red-200 bg-red-50/30' : 'border-border'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.estado === 'pagado' ? 'bg-emerald-100 text-emerald-600' : vencida ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{c.estado}</span>
                    <span className="text-xs text-muted-foreground">{proyectos.find(p => p.id === c.proyectoId)?.nombre || '—'}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{c.proveedor}</p>
                  <p className="text-xs text-muted-foreground">{c.concepto}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    <span>💰 {fmtQ(c.monto)}</span>
                    <span>📅 Vence: {c.fechaVencimiento}</span>
                    {c.saldoPendiente > 0 && <span className="font-bold text-red-600">Saldo: {fmtQ(c.saldoPendiente)}</span>}
                    {c.fechaPago && <span>✅ Pagado: {c.fechaPago}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 ml-2">
                  {c.estado !== 'pagado' && <button onClick={() => pagar(c.id)} className="px-4 py-2.5 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600 active:bg-emerald-700 active:scale-95 min-h-[44px] transition-all">Pagar</button>}
                  <button onClick={() => eliminar(c.id)} className="p-2 text-slate-300 hover:text-red-500 active:text-red-600 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all"><X className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default CuentasPagarScreen;

