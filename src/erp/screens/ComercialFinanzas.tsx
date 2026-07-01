import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import type { VentaPaquete, Anticipo, AmortizacionItem, CajaChica } from '../types';
import { toast } from 'sonner';

const uid = () => Date.now().toString(36).substr(2, 9);

export const ComercialFinanzas: React.FC = () => {
  const { t } = useTranslation();
  const { proyectos, user, ventasPaquetes } = useErp();

  const [tab, setTab] = useState<'ventas' | 'anticipos' | 'cajas'>('ventas');
  const [showForm, setShowForm] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [amortInputs, setAmortInputs] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState<VentaPaquete[]>((ventasPaquetes ?? []) as VentaPaquete[]);
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [cajasChicas, setCajasChicas] = useState<CajaChica[]>([]);

  useEffect(() => {
    setLoading(false);
    setVentas((ventasPaquetes ?? []) as VentaPaquete[]);
  }, [ventasPaquetes]);

  const addVenta = (data: Omit<VentaPaquete, 'id'>) => {
    const updated = [{ ...data, id: uid() }, ...ventas];
    setVentas(updated);
  };
  const updateVenta = (id: string, patch: Partial<VentaPaquete>) => {
    const updated = ventas.map(v => v.id === id ? { ...v, ...patch } : v);
    setVentas(updated);
  };
  const addAnticipo = (data: Omit<Anticipo, 'id' | 'amortizaciones'>) => {
    const updated = [{ ...data, id: uid(), amortizaciones: [] }, ...anticipos];
    setAnticipos(updated);
  };
  const addAmortizacion = (anticipoId: string, data: Omit<AmortizacionItem, 'id'>) => {
    const updated = anticipos.map(a => {
      if (a.id !== anticipoId) return a;
      const newAmort: AmortizacionItem = { ...data, id: uid() };
      const nuevoSaldo = Math.max(0, a.saldoPendiente - data.monto);
      return { ...a, saldoPendiente: nuevoSaldo, estado: nuevoSaldo === 0 ? 'amortizado' as const : a.estado, amortizaciones: [...a.amortizaciones, newAmort] };
    });
    setAnticipos(updated);
  };
  const addCajaChica = (data: Omit<CajaChica, 'id'>) => {
    const updated = [{ ...data, id: uid() }, ...cajasChicas];
    setCajasChicas(updated);
  };
  const updateCajaChica = (id: string, patch: Partial<CajaChica>) => {
    const updated = cajasChicas.map(c => c.id === id ? { ...c, ...patch } : c);
    setCajasChicas(updated);
  };

  const INPUT = 'w-full px-3 py-2 border border-input rounded-lg text-sm outline-none focus:border-ring bg-background text-foreground';
  const SELECT = 'w-full px-3 py-2 border border-input rounded-lg text-sm outline-none focus:border-ring bg-background text-foreground';

  const renderVentas = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground">🏠 {t('comercial.ventas')}</h2>
        <button onClick={() => { setShowForm('venta'); setForm({}); }}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 font-medium">+ Nueva Venta</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Disponibles', estado: 'disponible', color: 'text-success bg-success/10' },
          { label: 'Reservados',  estado: 'reservado',  color: 'text-warning bg-warning/10' },
          { label: 'Vendidos',    estado: 'vendido',    color: 'text-info bg-info/10' },
          { label: 'Entregados',  estado: 'entregado',  color: 'text-muted-foreground bg-muted' },
        ].map(({ label, estado, color }) => (
          <div key={estado} className={`p-3 rounded-lg text-center ${color}`}>
            <p className="text-xs font-medium">{label}</p>
            <p className="text-xl font-bold">{ventas.filter(v => v.estado === estado).length}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">Identificador</th>
              <th className="p-2 text-left">Tipo</th>
              <th className="p-2 text-right">Precio</th>
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map(v => (
              <tr key={v.id} className="border-t hover:bg-muted/50">
                <td className="p-2 font-medium">{v.identificador}</td>
                <td className="p-2 text-xs">{v.tipo}</td>
                <td className="p-2 text-right font-mono">Q{v.precioVenta.toLocaleString()}</td>
                <td className="p-2 text-xs">{v.cliente || '—'}</td>
                <td className="p-2">
                  <select value={v.estado} onChange={e => updateVenta(v.id, { estado: e.target.value as VentaPaquete['estado'] })}
                    className={`text-xs px-3 py-2 rounded border outline-none ${
                      v.estado === 'disponible' ? 'text-success bg-success/10' :
                      v.estado === 'reservado'  ? 'text-warning bg-warning/10' :
                      v.estado === 'vendido'    ? 'text-info bg-info/10' :
                      'text-muted-foreground bg-muted'
                    }`}>
                    <option value="disponible">Disponible</option>
                    <option value="reservado">Reservado</option>
                    <option value="vendido">Vendido</option>
                    <option value="entregado">Entregado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ventas.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No hay ventas registradas</p>}
    </div>
  );

  const renderAnticipos = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground">💰 {t('comercial.anticipos')}</h2>
        <button onClick={() => { setShowForm('anticipo'); setForm({}); }}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 font-medium">+ Nuevo Anticipo</button>
      </div>
      <div className="grid gap-3">
        {anticipos.map(a => {
          const pctAmortizado = a.montoTotal > 0 ? ((a.montoTotal - a.saldoPendiente) / a.montoTotal) * 100 : 0;
          return (
            <div key={a.id} className="border border-border rounded-lg p-3 bg-card">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold text-foreground">{a.concepto}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                    a.estado === 'activo' ? 'bg-warning/10 text-warning' :
                    a.estado === 'amortizado' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>{a.estado}</span>
                </div>
                <span className="text-xs text-muted-foreground">{a.beneficiario}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-mono text-foreground">Total: Q{a.montoTotal.toFixed(2)}</span>
                <span className="font-mono text-foreground">Saldo: Q{a.saldoPendiente.toFixed(2)}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-success rounded-full h-2 transition-all" style={{ width: `${pctAmortizado}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{pctAmortizado.toFixed(0)}%</span>
              </div>
              {a.estado === 'activo' && (
                <div className="mt-2 flex gap-2">
                  <input type="number" inputMode="decimal" placeholder="Monto a amortizar"
                    className="text-xs px-3 py-2 border border-input rounded-lg outline-none focus:border-ring bg-background w-36"
                    value={amortInputs[a.id] || ''}
                    onChange={e => setAmortInputs(prev => ({ ...prev, [a.id]: e.target.value }))} />
                  <button onClick={() => {
                    const monto = parseFloat(amortInputs[a.id] || '0');
                    if (monto > 0) {
                      addAmortizacion(a.id, { anticipoId: a.id, monto: Math.min(monto, a.saldoPendiente), fecha: new Date().toISOString().split('T')[0], referencia: 'Amortización manual' });
                      setAmortInputs(prev => ({ ...prev, [a.id]: '' }));
                      toast.success('Amortización registrada');
                    }
                  }} className="bg-success text-success-foreground px-4 py-2.5 rounded-lg text-xs hover:bg-success/90 active:bg-success/80 active:scale-95 min-h-[44px] transition-all">Amortizar</button>
                </div>
              )}
              {a.amortizaciones.length > 0 && (
                <div className="mt-2 border-t border-border pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Historial:</p>
                  {a.amortizaciones.map(am => (
                    <div key={am.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>{new Date(am.fecha).toLocaleDateString()}</span>
                      <span className="font-mono">-Q{am.monto.toFixed(2)}</span>
                      {am.referencia && <span className="text-muted-foreground/70">{am.referencia}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {anticipos.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No hay anticipos registrados</p>}
    </div>
  );

  const renderCajas = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground">💵 {t('comercial.cajas')}</h2>
        <button onClick={() => { setShowForm('caja'); setForm({}); }}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 font-medium">+ Nuevo Gasto</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-warning/10 rounded-lg text-center">
          <p className="text-xs text-warning font-medium">Pendientes</p>
          <p className="text-xl font-bold text-warning">{cajasChicas.filter(c => c.estado === 'pendiente').length}</p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg text-center">
          <p className="text-xs text-success font-medium">Aprobados</p>
          <p className="text-xl font-bold text-success">{cajasChicas.filter(c => c.estado === 'aprobada').length}</p>
        </div>
        <div className="p-3 bg-info/10 rounded-lg text-center">
          <p className="text-xs text-info font-medium">Total Aprobado</p>
          <p className="text-xl font-bold text-info">Q{cajasChicas.filter(c => c.estado === 'aprobada').reduce((a, c) => a + c.monto, 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">Descripción</th>
              <th className="p-2 text-left">Categoría</th>
              <th className="p-2 text-right">Monto</th>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Solicitante</th>
              <th className="p-2 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {cajasChicas.map(c => (
              <tr key={c.id} className="border-t hover:bg-muted/50">
                <td className="p-2 text-xs">{c.descripcion}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    c.categoria === 'materiales'   ? 'bg-info/10 text-info' :
                    c.categoria === 'herramientas' ? 'bg-accent/10 text-accent-foreground' :
                    c.categoria === 'transporte'   ? 'bg-primary/10 text-primary' :
                    c.categoria === 'comidas'      ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>{c.categoria}</span>
                </td>
                <td className="p-2 text-right font-mono">Q{c.monto.toFixed(2)}</td>
                <td className="p-2 text-xs">{new Date(c.fechaGasto).toLocaleDateString()}</td>
                <td className="p-2 text-xs">{c.solicitante}</td>
                <td className="p-2">
                  <select value={c.estado} onChange={e => updateCajaChica(c.id, {
                    estado: e.target.value as CajaChica['estado'],
                    aprobadoPor: e.target.value === 'aprobada' ? (user?.nombre || 'Admin') : undefined,
                    fechaAprobacion: e.target.value === 'aprobada' ? new Date().toISOString() : undefined
                  })}
                    className={`text-xs px-3 py-2 rounded border outline-none ${
                      c.estado === 'aprobada'  ? 'text-success bg-success/10' :
                      c.estado === 'rechazada' ? 'text-destructive bg-destructive/10' :
                      'text-warning bg-warning/10'
                    }`}>
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobada">Aprobada</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cajasChicas.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No hay gastos de caja chica</p>}
    </div>
  );


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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-black text-foreground mb-4">{t('comercial.titulo')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'ventas',    label: `🏠 ${t('comercial.ventas')}` },
          { key: 'anticipos', label: `💰 ${t('comercial.anticipos')}` },
          { key: 'cajas',     label: `💵 ${t('comercial.cajas')}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'ventas'    && renderVentas()}
      {tab === 'anticipos' && renderAnticipos()}
      {tab === 'cajas'     && renderCajas()}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4 text-foreground">
              {showForm === 'venta'    && 'Nueva Venta / Paquete'}
              {showForm === 'anticipo' && 'Nuevo Anticipo'}
              {showForm === 'caja'     && 'Nuevo Gasto de Caja Chica'}
            </h3>

            {showForm === 'venta' && (
              <div className="grid gap-3">
                <select className={SELECT} value={form.proyectoId || ''} onChange={e => setForm({ ...form, proyectoId: e.target.value })}>
                  <option value="">Seleccionar proyecto</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <select className={SELECT} value={form.tipo || 'unidad'} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="unidad">Unidad</option><option value="lote">Lote</option><option value="paquete">Paquete</option>
                </select>
                <input placeholder="Identificador (ej: Torre A - Apt 301)" className={INPUT} value={form.identificador || ''} onChange={e => setForm({ ...form, identificador: e.target.value })} />
                <input placeholder="Precio de venta Q" type="number" inputMode="decimal" className={INPUT} value={form.precioVenta || ''} onChange={e => setForm({ ...form, precioVenta: +e.target.value })} />
                <input placeholder="Cliente (opcional)" className={INPUT} value={form.cliente || ''} onChange={e => setForm({ ...form, cliente: e.target.value })} />
                <button onClick={() => {
                  if (!form.proyectoId) { toast.error('Selecciona un proyecto'); return; }
                  addVenta({ proyectoId: form.proyectoId, tipo: form.tipo || 'unidad', identificador: form.identificador || 'Nueva unidad', precioVenta: form.precioVenta || 0, precioContrato: form.precioVenta || 0, estado: 'disponible', cliente: form.cliente || undefined });
                  setShowForm(null);
                  toast.success('Venta registrada');
                }} className="bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 font-medium">Guardar</button>
              </div>
            )}

            {showForm === 'anticipo' && (
              <div className="grid gap-3">
                <select className={SELECT} value={form.proyectoId || ''} onChange={e => setForm({ ...form, proyectoId: e.target.value })}>
                  <option value="">Seleccionar proyecto</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <select className={SELECT} value={form.tipo || 'proveedor'} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="cliente">Cliente</option><option value="proveedor">Proveedor</option><option value="empleado">Empleado</option>
                </select>
                <input placeholder="Beneficiario" className={INPUT} value={form.beneficiario || ''} onChange={e => setForm({ ...form, beneficiario: e.target.value })} />
                <input placeholder="Concepto" className={INPUT} value={form.concepto || ''} onChange={e => setForm({ ...form, concepto: e.target.value })} />
                <input placeholder="Monto total Q" type="number" inputMode="decimal" className={INPUT} value={form.montoTotal || ''} onChange={e => setForm({ ...form, montoTotal: +e.target.value })} />
                <button onClick={() => {
                  if (!form.proyectoId) { toast.error('Selecciona un proyecto'); return; }
                  const monto = form.montoTotal || 0;
                  addAnticipo({ proyectoId: form.proyectoId, montoTotal: monto, saldoPendiente: monto, tipo: form.tipo || 'proveedor', beneficiario: form.beneficiario || 'Beneficiario', concepto: form.concepto || 'Anticipo', fechaEntrega: new Date().toISOString().split('T')[0], estado: 'activo' });
                  setShowForm(null);
                  toast.success('Anticipo registrado');
                }} className="bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 font-medium">Guardar</button>
              </div>
            )}

            {showForm === 'caja' && (
              <div className="grid gap-3">
                <select className={SELECT} value={form.proyectoId || ''} onChange={e => setForm({ ...form, proyectoId: e.target.value })}>
                  <option value="">Seleccionar proyecto</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <input placeholder="Descripción del gasto" className={INPUT} value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                <select className={SELECT} value={form.categoria || 'materiales'} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                  <option value="materiales">Materiales</option><option value="herramientas">Herramientas</option>
                  <option value="transporte">Transporte</option><option value="comidas">Comidas</option><option value="otros">Otros</option>
                </select>
                <input placeholder="Monto Q" type="number" inputMode="decimal" className={INPUT} value={form.monto || ''} onChange={e => setForm({ ...form, monto: +e.target.value })} />
                <input placeholder="Solicitante" className={INPUT} value={form.solicitante || ''} onChange={e => setForm({ ...form, solicitante: e.target.value })} />
                <button onClick={() => {
                  if (!form.proyectoId) { toast.error('Selecciona un proyecto'); return; }
                  addCajaChica({ proyectoId: form.proyectoId, monto: form.monto || 0, descripcion: form.descripcion || 'Gasto', categoria: form.categoria || 'materiales', fechaGasto: new Date().toISOString().split('T')[0], solicitante: form.solicitante || 'Usuario', estado: 'pendiente' });
                  setShowForm(null);
                  toast.success('Gasto registrado');
                }} className="bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 font-medium">Guardar</button>
              </div>
            )}

            <button onClick={() => setShowForm(null)} className="mt-2 w-full px-4 py-2 border border-input rounded-lg text-xs text-muted-foreground hover:bg-muted">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComercialFinanzas;
