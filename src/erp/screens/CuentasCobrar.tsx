import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import { useErp } from '../store';
import { CuentaCobrar } from '../types';
import ProyectoFilter from '../components/ProyectoFilter';
import { DollarSign, Plus, X, TrendingUp, CalendarDays, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { INPUT, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER, COLOR_INFO } from '../ui';
import { toast } from 'sonner';
import { Modal } from 'antd';
import { todayISO, fmtQ } from '../utils';

const CuentasCobrarScreen: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, cuentasCobrar, addCuentaCobrar, updateCuentaCobrar, deleteCuentaCobrar } = useErp();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);
  const [filtroProyecto, setFiltroProyecto] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const clearFieldError = (field: string) => setFormErrors(prev => ({ ...prev, [field]: '' }));
  const set = (patch: Record<string, any>) => { setForm(prev => ({ ...prev, ...patch })); Object.keys(patch).forEach(clearFieldError); };
  const [form, setForm] = useState({ proyectoId: '', cliente: '', concepto: '', monto: 0, fechaEmision: todayISO(), fechaVencimiento: '', notas: '' });

  const agregar = () => {
    const errs: Record<string, string> = {};
    if (!form.cliente) errs.cliente = 'Cliente requerido';
    if (!form.concepto) errs.concepto = 'Concepto requerido';
    if (!form.monto || form.monto <= 0) errs.monto = 'Monto debe ser mayor a 0';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    addCuentaCobrar({
      proyectoId: form.proyectoId, cliente: form.cliente, concepto: form.concepto,
      monto: form.monto, saldoPendiente: form.monto, fechaEmision: form.fechaEmision,
      fechaVencimiento: form.fechaVencimiento, estado: 'pendiente', notas: form.notas || undefined,
    });
    toast.success('Cuenta por cobrar registrada');
    setShowForm(false);
    setForm({ proyectoId: '', cliente: '', concepto: '', monto: 0, fechaEmision: todayISO(), fechaVencimiento: '', notas: '' });
    setFormErrors({});
  };

  const cobrar = (id: string) => {
    updateCuentaCobrar(id, { estado: 'cobrado', fechaCobro: todayISO(), saldoPendiente: 0 });
    toast.success('Cobro registrado');
  };

  const eliminar = async (id: string) => {
    try {
      await Modal.confirm({ title: t('cuentas_cobrar.confirmar_eliminar_titulo', 'Confirmar eliminación'), content: t('cuentas_cobrar.confirmar_eliminar_contenido', '¿Eliminar esta cuenta por cobrar?'), centered: true, okText: t('common.si'), cancelText: t('common.cancelar') });
      deleteCuentaCobrar(id);
      toast.success('Cuenta por cobrar eliminada');
    } catch {}
  };

  const filtradas = filtroProyecto ? cuentasCobrar.filter(c => c.proyectoId === filtroProyecto) : cuentasCobrar;
  const pendientes = filtradas.filter(c => c.estado === 'pendiente' || c.estado === 'parcial' || c.estado === 'vencido');
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <DollarSign className={`w-6 h-6 ${COLOR_SUCCESS}`} />
            Cuentas por Cobrar
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Seguimiento de cobros, vencimientos y saldos por cliente</p>
        </div>
        <div className="flex items-center gap-2">
          <ProyectoFilter value={filtroProyecto} onChange={setFiltroProyecto} proyectos={proyectos} />
          <button onClick={() => setShowForm(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Cuenta</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><DollarSign className={`w-4 h-4 ${COLOR_SUCCESS}`} /><span className="text-xs text-muted-foreground">Total por cobrar</span></div>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className={`text-xl font-bold ${COLOR_SUCCESS} mt-1`}>{fmtQ(totalPendiente)}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{pendientes.length} cuentas pendientes</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><CalendarDays className={`w-4 h-4 ${COLOR_INFO}`} /><span className="text-xs text-muted-foreground">Cobradas</span></div>
          </div>
          <div className={`text-xl font-bold ${COLOR_INFO} mt-1`}>{filtradas.filter(c => c.estado === 'cobrado').length}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{filtradas.length > 0 ? `${Math.round((filtradas.filter(c => c.estado === 'cobrado').length / filtradas.length) * 100)}% del total` : '—'}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><DollarSign className={`w-4 h-4 ${COLOR_WARNING}`} /><span className="text-xs text-muted-foreground">Vencidas</span></div>
            {vencidos.length > 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </div>
          <div className={`text-xl font-bold ${vencidos.length > 0 ? COLOR_DANGER : 'text-foreground'} mt-1`}>{vencidos.length}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{vencidos.length > 0 ? 'Requiere atención' : 'Sin vencidas'}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><TrendingUp className={`w-4 h-4 ${COLOR_INFO}`} /><span className="text-xs text-muted-foreground">Promedio por cuenta</span></div>
          </div>
          <div className={`text-xl font-bold text-foreground mt-1`}>{pendientes.length > 0 ? fmtQ(totalPendiente / pendientes.length) : 'Q0'}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Saldo pendiente promedio</div>
        </div>
      </div>
      {showForm && (
        <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <input value={form.cliente} onChange={e => set({ cliente: e.target.value })} placeholder="Nombre del cliente *" className={INPUT} />
              {formErrors.cliente && <p className="text-xs text-red-500 mt-0.5">{formErrors.cliente}</p>}
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
          <input value={form.notas} onChange={e => set({ notas: e.target.value })} placeholder="Notas" className={INPUT} />
          <div className="flex gap-2"><button onClick={agregar} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold">Registrar</button><button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-xs text-muted-foreground">Cancelar</button></div>
        </div>
      )}
      <div className="space-y-2">
        {filtradas.length === 0 ? <div className="text-center py-10 text-muted-foreground"><DollarSign className="w-10 h-10 mx-auto mb-2 text-slate-300" /><p className="text-sm">Sin cuentas por cobrar</p></div>
        : [...filtradas].sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento)).map(c => {
          const vencida = c.estado === 'pendiente' && c.fechaVencimiento < todayISO();
          return (
            <div key={c.id} className={`bg-card rounded-xl border p-4 ${c.estado === 'cobrado' ? 'border-emerald-200 bg-emerald-50/30' : vencida ? 'border-red-200 bg-red-50/30' : 'border-border'}`}>
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.estado === 'cobrado' ? 'bg-emerald-100 text-emerald-700' : vencida ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{c.estado.toUpperCase()}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">{proyectos.find(p => p.id === c.proyectoId)?.nombre || 'Sin proyecto'}</span>
                    {c.saldoPendiente > 0 && c.estado !== 'cobrado' && <span className="text-[10px] text-red-500 font-bold ml-auto">• VENCIDA</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground mb-0.5">Cliente</div>
                      <div className="text-sm font-semibold text-foreground truncate">{c.cliente}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground mb-0.5">Concepto</div>
                      <div className="text-xs text-foreground line-clamp-2">{c.concepto}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground mb-0.5">Monto Original</div>
                      <div className="text-sm font-bold text-foreground">{fmtQ(c.monto)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground mb-0.5">Saldo Pendiente</div>
                      <div className={`text-sm font-bold ${c.saldoPendiente > 0 ? COLOR_DANGER : COLOR_SUCCESS}`}>{fmtQ(c.saldoPendiente)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground mb-0.5">Emisión / Vencimiento</div>
                      <div className="text-xs text-foreground">{c.fechaEmision} → {c.fechaVencimiento}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground mb-0.5">Cobro / Pago</div>
                      <div className="text-xs text-foreground">{c.fechaCobro ? <><CheckCircle className="w-3 h-3 inline text-emerald-500" aria-hidden="true" /> {c.fechaCobro}</> : <><Clock className="w-3 h-3 inline text-amber-500" aria-hidden="true" /> Pendiente</>}</div>
                    </div>
                  </div>
                  {c.notas && <div className="mt-2 text-xs text-muted-foreground border-t border-border pt-2"><FileText className="w-3.5 h-3.5 inline-block align-text-bottom" aria-hidden="true" /> {c.notas}</div>}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {c.estado !== 'cobrado' && <button onClick={() => cobrar(c.id)} className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 active:bg-emerald-700 active:scale-95 min-h-[44px] transition-all">Cobrar</button>}
                  <button onClick={() => eliminar(c.id)} className="p-2 text-slate-300 hover:text-red-500 active:text-red-600 active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all rounded-lg border border-transparent hover:border-red-200" aria-label={t('cuentas_cobrar.eliminar')}><X className="w-4 h-4" aria-hidden="true" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default CuentasCobrarScreen;

