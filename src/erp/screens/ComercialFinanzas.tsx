import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useErp, uid } from '../store';
import type { VentaPaquete, Anticipo, AmortizacionItem, CajaChica } from '../types';
import { Building2, DollarSign, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { fmtQ } from '../utils';
import { Skeleton } from '@/components/ui/skeleton';

export const ComercialFinanzas: React.FC = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const { t } = useTranslation();
  const { proyectos, user, ventasPaquetes, addVentaPaquete, updateVentaPaquete, anticipos, cajasChicas, addAnticipo, updateAnticipo, deleteAnticipo, addCajaChica, updateCajaChica, deleteCajaChica } = useErp();
  const safeVentas = Array.isArray(ventasPaquetes) ? ventasPaquetes : [];
  const safeAnticipos = Array.isArray(anticipos) ? anticipos : [];
  const safeCajas = Array.isArray(cajasChicas) ? cajasChicas : [];

  const [tab, setTab] = useState<'ventas' | 'anticipos' | 'cajas'>('ventas');
  const [showForm, setShowForm] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [amortInputs, setAmortInputs] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const addVenta = (data: Omit<VentaPaquete, 'id'>) => {
    addVentaPaquete({ ...data, id: uid() });
  };
  const updateVenta = (id: string, patch: Partial<VentaPaquete>) => {
    updateVentaPaquete(id, patch);
  };
  const addAnticipoLocal = (data: Omit<Anticipo, 'id' | 'amortizaciones'>) => {
    addAnticipo({ ...data, amortizaciones: [] });
  };
  const addAmortizacion = (anticipoId: string, data: Omit<AmortizacionItem, 'id'>) => {
    const anticipo = anticipos.find(a => a.id === anticipoId);
    if (!anticipo) return;
    const newAmort: AmortizacionItem = { ...data, id: uid() };
    const nuevoSaldo = Math.max(0, anticipo.saldoPendiente - data.monto);
    updateAnticipo(anticipoId, { amortizaciones: [...anticipo.amortizaciones, newAmort], saldoPendiente: nuevoSaldo, estado: nuevoSaldo === 0 ? 'amortizado' as const : anticipo.estado });
  };
  const addCajaChicaLocal = (data: Omit<CajaChica, 'id'>) => {
    addCajaChica(data);
  };
  const updateCajaChicaLocal = (id: string, patch: Partial<CajaChica>) => {
    updateCajaChica(id, patch);
  };

  const INPUT = 'w-full px-3 py-2 border border-input rounded-lg text-sm outline-none focus:border-ring bg-background text-foreground';
  const SELECT = 'w-full px-3 py-2 border border-input rounded-lg text-sm outline-none focus:border-ring bg-background text-foreground';
  const FOCUS_VISIBLE = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  const ventasKpis = useMemo(() => ({
    disponibles: (ventasPaquetes ?? []).filter(v => v.estado === 'disponible').length,
    reservados: (ventasPaquetes ?? []).filter(v => v.estado === 'reservado').length,
    vendidos: (ventasPaquetes ?? []).filter(v => v.estado === 'vendido').length,
    entregados: (ventasPaquetes ?? []).filter(v => v.estado === 'entregado').length,
  }), [ventasPaquetes]);

  const cajasKpis = useMemo(() => ({
    pendientes: safeCajas.filter(c => c.estado === 'pendiente').length,
    aprobadas: safeCajas.filter(c => c.estado === 'aprobada').length,
    totalAprobado: safeCajas.filter(c => c.estado === 'aprobada').reduce((a, c) => a + c.monto, 0),
  }), [safeCajas]);

  const renderVentas = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5"><Building2 className="w-4 h-4" aria-hidden="true" /> {t('comercial.ventas')}</h2>
        <button onClick={() => { setShowForm('venta'); setForm({}); }}
          className={`bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 font-medium ${FOCUS_VISIBLE}`}>{t('comercial.nueva_venta')}</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
         {[
           { label: t('comercial.disponibles'), estado: 'disponible', color: 'text-success bg-success/10' },
           { label: t('comercial.reservados'),  estado: 'reservado',  color: 'text-warning bg-warning/10' },
           { label: t('comercial.vendidos'),    estado: 'vendido',    color: 'text-info bg-info/10' },
           { label: t('comercial.entregados'),  estado: 'entregado',  color: 'text-muted-foreground bg-muted' },
         ].map(({ label, estado, color }) => (
           <div key={estado} className={`p-3 rounded-lg text-center ${color}`}>
             <p className="text-xs font-medium">{label}</p>
             <p className="text-xl font-bold">{ventasKpis[estado as keyof typeof ventasKpis]}</p>
           </div>
         ))}
      </div>

      {(ventasPaquetes ?? []).length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
          <p className="text-sm">{t('comercial.no_hay_ventas')}</p>
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label={t('comercial.ventas')}>
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left" scope="col">{t('comercial.identificador', 'Identificador')}</th>
              <th className="p-2 text-left" scope="col">{t('common.tipo')}</th>
              <th className="p-2 text-right" scope="col">{t('common.precio')}</th>
              <th className="p-2 text-left" scope="col">{t('common.cliente', 'Cliente')}</th>
              <th className="p-2 text-left" scope="col">{t('common.estado')}</th>
            </tr>
          </thead>
          <tbody>
            {(ventasPaquetes ?? []).map(v => (
              <tr key={v.id} className="border-t hover:bg-muted/50">
                <td className="p-2 font-medium truncate" title={v.identificador}>{v.identificador}</td>
                <td className="p-2 text-xs truncate">{v.tipo}</td>
                <td className="p-2 text-right font-mono">{fmtQ(v.precioVenta)}</td>
                <td className="p-2 text-xs truncate" title={v.cliente || '—'}>{v.cliente || '—'}</td>
                <td className="p-2">
                  <select value={v.estado} onChange={e => updateVenta(v.id, { estado: e.target.value as VentaPaquete['estado'] })}
                    className={`text-xs px-3 py-2 rounded border outline-none ${FOCUS_VISIBLE} ${v.estado === 'disponible' ? 'text-success bg-success/10' : v.estado === 'reservado' ? 'text-warning bg-warning/10' : v.estado === 'vendido' ? 'text-info bg-info/10' : 'text-muted-foreground bg-muted'}`}>
                    <option value="disponible">{t('comercial.disponible', 'Disponible')}</option>
                    <option value="reservado">{t('comercial.reservado', 'Reservado')}</option>
                    <option value="vendido">{t('comercial.vendido', 'Vendido')}</option>
                    <option value="entregado">{t('comercial.entregado', 'Entregado')}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );

  const renderAnticipos = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5"><DollarSign className="w-4 h-4" aria-hidden="true" /> {t('comercial.anticipos')}</h2>
        <button onClick={() => { setShowForm('anticipo'); setForm({}); }}
          className={`bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 font-medium ${FOCUS_VISIBLE}`}>{t('comercial.nuevo_anticipo', '+ Nuevo Anticipo')}</button>
      </div>
      <div className="grid gap-3">
        {anticipos.map(a => {
          const pctAmortizado = a.montoTotal > 0 ? ((a.montoTotal - a.saldoPendiente) / a.montoTotal) * 100 : 0;
          return (
            <div key={a.id} className="border border-border rounded-lg p-3 bg-card">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold text-foreground">{a.concepto}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${a.estado === 'activo' ? 'bg-warning/10 text-warning' : a.estado === 'amortizado' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{t('comercial.estado_' + a.estado, a.estado)}</span>
                </div>
                <span className="text-xs text-muted-foreground">{a.beneficiario}</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-mono text-foreground">{t('comercial.total_label', 'Total')}: {fmtQ(a.montoTotal)}</span>
                <span className="font-mono text-foreground">{t('comercial.saldo_label', 'Saldo')}: {fmtQ(a.saldoPendiente)}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-success rounded-full h-2 transition-all" style={{ width: `${pctAmortizado}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{pctAmortizado.toFixed(0)}%</span>
              </div>
              {a.estado === 'activo' && (
                <div className="mt-2 flex gap-2">
                  <input type="number" inputMode="decimal" placeholder={t('comercial.placeholder_amortizacion')}
                    className="text-xs px-3 py-2 border border-input rounded-lg outline-none focus:border-ring bg-background w-full sm:w-36"
                    value={amortInputs[a.id] || ''}
                    onChange={e => setAmortInputs(prev => ({ ...prev, [a.id]: e.target.value }))} />
                  <button onClick={() => {
                    const monto = parseFloat(amortInputs[a.id] || '0');
                    if (monto > 0) {
                      addAmortizacion(a.id, { anticipoId: a.id, monto: Math.min(monto, a.saldoPendiente), fecha: new Date().toISOString().split('T')[0], referencia: t('comercial.amortizacion_manual') });
                      setAmortInputs(prev => ({ ...prev, [a.id]: '' }));
                      toast.success(t('comercial.amortizacion_registrada'));
                    }
                  }} className={`bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg text-xs hover:bg-success/90 active:bg-success/80 active:scale-95 min-h-[44px] transition-all ${FOCUS_VISIBLE}`}>{t('comercial.amortizar')}</button>
                </div>
              )}
              {a.amortizaciones.length > 0 && (
                <div className="mt-2 border-t border-border pt-2">
                  <p className="text-xs text-muted-foreground mb-1">{t('comercial.historial', 'Historial:')}</p>
                  {a.amortizaciones.map(am => (
                    <div key={am.id} className="flex justify-between text-xs text-muted-foreground">
                      <span>{new Date(am.fecha).toLocaleDateString('es-GT')}</span>
                      <span className="font-mono">-{fmtQ(am.monto)}</span>
                      {am.referencia && <span className="text-muted-foreground/70">{am.referencia}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {anticipos.length === 0 && <div className="text-center py-10 text-muted-foreground"><DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" /><p className="text-sm">{t('comercial.no_hay_anticipos')}</p></div>}
    </div>
  );

  const renderCajas = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5"><Wallet className="w-4 h-4" aria-hidden="true" /> {t('comercial.cajas')}</h2>
        <button onClick={() => { setShowForm('caja'); setForm({}); }}
          className={`bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 font-medium ${FOCUS_VISIBLE}`}>{t('comercial.nuevo_gasto')}</button>
      </div>

       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
         {(safeCajas.length === 0 || safeCajas.length === 0) && (
           <div className="text-center py-6 text-muted-foreground col-span-full"><Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" aria-hidden="true" /><p className="text-sm">{t('comercial.no_hay_gastos')}</p></div>
         )}
        <div className="p-3 bg-warning/10 rounded-lg text-center">
          <p className="text-xs text-warning font-medium">{t('comercial.pendientes')}</p>
          <p className="text-xl font-bold text-warning">{cajasKpis.pendientes}</p>
        </div>
        <div className="p-3 bg-success/10 rounded-lg text-center">
          <p className="text-xs text-success font-medium">{t('comercial.aprobados')}</p>
          <p className="text-xl font-bold text-success">{cajasKpis.aprobadas}</p>
        </div>
        <div className="p-3 bg-info/10 rounded-lg text-center">
          <p className="text-xs text-info font-medium">{t('comercial.total_aprobado')}</p>
          <p className="text-xl font-bold text-info">{fmtQ(cajasKpis.totalAprobado)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label={t('comercial.cajas')}>
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left" scope="col">{t('common.descripcion')}</th>
              <th className="p-2 text-left" scope="col">{t('financiero.categoria')}</th>
              <th className="p-2 text-right" scope="col">{t('common.monto', 'Monto')}</th>
              <th className="p-2 text-left" scope="col">{t('common.fecha')}</th>
              <th className="p-2 text-left" scope="col">{t('comercial.solicitante', 'Solicitante')}</th>
              <th className="p-2 text-left" scope="col">{t('common.estado')}</th>
            </tr>
          </thead>
          <tbody>
             {safeCajas.map(c => (
              <tr key={c.id} className="border-t hover:bg-muted/50">
                <td className="p-2 text-xs truncate" title={c.descripcion}>{c.descripcion}</td>
                <td className="p-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.categoria === 'materiales' ? 'bg-info/10 text-info' : c.categoria === 'herramientas' ? 'bg-accent/10 text-accent-foreground' : c.categoria === 'transporte' ? 'bg-primary/10 text-primary' : c.categoria === 'comidas' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{t('comercial.categoria_' + c.categoria, c.categoria)}</span>
                </td>
                <td className="p-2 text-right font-mono">{fmtQ(c.monto)}</td>
                <td className="p-2 text-xs">{new Date(c.fechaGasto).toLocaleDateString('es-GT')}</td>
                <td className="p-2 text-xs truncate" title={c.solicitante}>{c.solicitante}</td>
                <td className="p-2">
                  <select value={c.estado} onChange={e => updateCajaChica(c.id, {
                    estado: e.target.value as CajaChica['estado'],
                    aprobadoPor: e.target.value === 'aprobada' ? (user?.nombre || 'Admin') : undefined,
                    fechaAprobacion: e.target.value === 'aprobada' ? new Date().toISOString() : undefined
                  })}
                    className={`text-xs px-3 py-2 rounded border outline-none ${FOCUS_VISIBLE} ${c.estado === 'aprobada' ? 'text-success bg-success/10' : c.estado === 'rechazada' ? 'text-destructive bg-destructive/10' : 'text-warning bg-warning/10'}`}>
                    <option value="pendiente">{t('comercial.pendiente', 'Pendiente')}</option>
                    <option value="aprobada">{t('comercial.aprobada', 'Aprobada')}</option>
                    <option value="rechazada">{t('comercial.rechazada', 'Rechazada')}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       {safeCajas.length === 0 && <div className="text-center py-10 text-muted-foreground"><Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" /><p className="text-sm">{t('comercial.no_hay_gastos')}</p></div>}
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-black text-foreground mb-4">{t('comercial.titulo')}</h1>

      <div className="flex gap-1 mb-4 bg-muted p-1 rounded-lg overflow-x-auto" role="tablist">
        {[
          { key: 'ventas',    label: t('comercial.ventas'), icon: Building2 },
          { key: 'anticipos', label: t('comercial.anticipos'), icon: DollarSign },
          { key: 'cajas',     label: t('comercial.cajas'), icon: Wallet },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button key={item.key} onClick={() => setTab(item.key as typeof tab)} role="tab" aria-selected={tab === item.key}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1.5 ${FOCUS_VISIBLE} ${tab === item.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'}`}><Icon className="w-4 h-4" aria-hidden="true" /> {item.label}</button>
          );
        })}
      </div>

      {tab === 'ventas'    && renderVentas()}
      {tab === 'anticipos' && renderAnticipos()}
      {tab === 'cajas'     && renderCajas()}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label={showForm === 'venta' ? 'Nueva Venta' : showForm === 'anticipo' ? 'Nuevo Anticipo' : 'Nuevo Gasto'}>
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4 text-foreground truncate">
              {showForm === 'venta'    && t('comercial.modal_nueva_venta', 'Nueva Venta / Paquete')}
              {showForm === 'anticipo' && t('comercial.modal_nuevo_anticipo', 'Nuevo Anticipo')}
              {showForm === 'caja'     && t('comercial.modal_nuevo_gasto', 'Nuevo Gasto de Caja Chica')}
            </h3>
            {showForm === 'venta' && (
              <div className="grid gap-3">
                <div>
                  <select className={SELECT} value={form.proyectoId || ''} onChange={e => { setForm({ ...form, proyectoId: e.target.value }); if (formErrors.proyectoId) setFormErrors(f => ({ ...f, proyectoId: '' })); }}>
                    <option value="">{t('comercial.seleccionar_proyecto', 'Seleccionar proyecto')}</option>
                    {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  {formErrors.proyectoId && <p className="text-xs text-red-500 mt-0.5">{formErrors.proyectoId}</p>}
                </div>
                <select className={SELECT} value={form.tipo || 'unidad'} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="unidad">{t('comercial.unidad')}</option><option value="lote">{t('comercial.lote')}</option><option value="paquete">{t('comercial.paquete')}</option>
                </select>
                <input placeholder={t('comercial.placeholder_identificador')} className={INPUT} value={form.identificador || ''} onChange={e => setForm({ ...form, identificador: e.target.value })} />
                <input placeholder={t('comercial.placeholder_precio')} type="number" inputMode="decimal" className={INPUT} value={form.precioVenta || ''} onChange={e => setForm({ ...form, precioVenta: +e.target.value })} />
                <input placeholder={t('comercial.placeholder_cliente')} className={INPUT} value={form.cliente || ''} onChange={e => setForm({ ...form, cliente: e.target.value })} />
                <button onClick={() => {
                  const errors: Record<string, string> = {};
                  if (!form.proyectoId) errors.proyectoId = t('comercial.error_proyecto');
                  setFormErrors(errors);
                  if (Object.keys(errors).length > 0) return;
                  addVenta({ proyectoId: form.proyectoId, tipo: form.tipo || 'unidad', identificador: form.identificador || 'Nueva unidad', precioVenta: form.precioVenta || 0, precioContrato: form.precioVenta || 0, estado: 'disponible', cliente: form.cliente || undefined });
                  setShowForm(null);
                  toast.success(t('comercial.venta_registrada'));
                }} className={`bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 font-medium ${FOCUS_VISIBLE}`}>{t('common.guardar')}</button>
              </div>
            )}
            {showForm === 'anticipo' && (
              <div className="grid gap-3">
                <select className={`${SELECT} ${formErrors.proyectoId ? 'border-red-500' : ''}`} value={form.proyectoId || ''} onChange={e => { setForm({ ...form, proyectoId: e.target.value }); setFormErrors(prev => ({ ...prev, proyectoId: '' })); }}>
                  <option value="">{t('comercial.seleccionar_proyecto')}</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                {formErrors.proyectoId && <p className="text-xs text-red-500">{formErrors.proyectoId}</p>}
                <select className={SELECT} value={form.tipo || 'proveedor'} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="cliente">{t('common.cliente')}</option><option value="proveedor">{t('common.proveedor')}</option><option value="empleado">{t('common.empleado')}</option>
                </select>
                <input placeholder={t('comercial.placeholder_beneficiario')} className={INPUT} value={form.beneficiario || ''} onChange={e => setForm({ ...form, beneficiario: e.target.value })} />
                <input placeholder={t('comercial.placeholder_concepto')} className={INPUT} value={form.concepto || ''} onChange={e => setForm({ ...form, concepto: e.target.value })} />
                <input placeholder={t('comercial.placeholder_monto_total')} type="number" inputMode="decimal" className={INPUT} value={form.montoTotal || ''} onChange={e => setForm({ ...form, montoTotal: +e.target.value })} />
                <button onClick={() => {
                  if (!form.proyectoId) { setFormErrors({ proyectoId: t('comercial.error_proyecto') }); return; }
                  const monto = form.montoTotal || 0;
                  addAnticipoLocal({ proyectoId: form.proyectoId, montoTotal: monto, saldoPendiente: monto, tipo: form.tipo || 'proveedor', beneficiario: form.beneficiario || 'Beneficiario', concepto: form.concepto || 'Anticipo', fechaEntrega: new Date().toISOString().split('T')[0], estado: 'activo' });
                  setShowForm(null);
                  toast.success(t('comercial.anticipo_registrado'));
                }} className={`bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 font-medium ${FOCUS_VISIBLE}`}>{t('common.guardar')}</button>
              </div>
            )}
            {showForm === 'caja' && (
              <div className="grid gap-3">
                <select className={`${SELECT} ${formErrors.proyectoId ? 'border-red-500' : ''}`} value={form.proyectoId || ''} onChange={e => { setForm({ ...form, proyectoId: e.target.value }); setFormErrors(prev => ({ ...prev, proyectoId: '' })); }}>
                  <option value="">{t('comercial.seleccionar_proyecto')}</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                {formErrors.proyectoId && <p className="text-xs text-red-500">{formErrors.proyectoId}</p>}
                <input placeholder={t('comercial.placeholder_descripcion')} className={INPUT} value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                <select className={SELECT} value={form.categoria || 'materiales'} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                  <option value="materiales">{t('bodega.materiales')}</option><option value="herramientas">{t('comercial.herramientas')}</option>
                  <option value="transporte">{t('comercial.transporte')}</option><option value="comidas">{t('comercial.comidas')}</option><option value="otros">{t('comercial.otros')}</option>
                </select>
                <input placeholder={t('comercial.placeholder_monto')} type="number" inputMode="decimal" className={INPUT} value={form.monto || ''} onChange={e => setForm({ ...form, monto: +e.target.value })} />
                <input placeholder={t('comercial.placeholder_solicitante')} className={INPUT} value={form.solicitante || ''} onChange={e => setForm({ ...form, solicitante: e.target.value })} />
                <button onClick={() => {
                  if (!form.proyectoId) { setFormErrors({ proyectoId: t('comercial.error_proyecto') }); return; }
                  addCajaChicaLocal({ proyectoId: form.proyectoId, monto: form.monto || 0, descripcion: form.descripcion || 'Gasto', categoria: form.categoria || 'materiales', fechaGasto: new Date().toISOString().split('T')[0], solicitante: form.solicitante || 'Usuario', estado: 'pendiente' });
                  setShowForm(null);
                  toast.success(t('comercial.gasto_registrado'));
                }} className={`bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 font-medium ${FOCUS_VISIBLE}`}>{t('common.guardar')}</button>
              </div>
            )}
            <button onClick={() => setShowForm(null)} className={`mt-2 w-full px-4 py-2 border border-input rounded-lg text-xs text-muted-foreground hover:bg-muted ${FOCUS_VISIBLE}`}>{t('common.cancelar')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComercialFinanzas;
