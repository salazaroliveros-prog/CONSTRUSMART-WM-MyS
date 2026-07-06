import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp, uid } from '../store';
import { Wrench, BarChart3, DollarSign, CheckCircle, Trash2 } from 'lucide-react';
import type { ActivoHerramienta } from '../types';
import { todayISO } from '../utils';

const formControlClass = (hasError = false) =>
  `w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${hasError ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : 'border-input focus:border-ring focus:ring-ring/20'}`;

export const LogisticaCompras: React.FC = () => {
  const { t } = useTranslation();
  const { activos, addActivo, deleteActivo, cuadros, addCuadro, updateCuadro, deleteCuadro, pagosProveedor, addPagoProveedor, deletePagoProveedor } = useErp();
  const [tab, setTab] = useState<'activos' | 'cuadros' | 'pagos'>('activos');
  const [showForm, setShowForm] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(false); }, []);

  const clearError = (field: string) => setFormErrors(prev => ({ ...prev, [field]: '' }));
  const updateForm = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const validateActivo = () => {
    const errors: Record<string, string> = {};
    if (!String(form.nombre || '').trim()) errors.nombre = t('logistica.error_nombre', 'Nombre requerido');
    if (!String(form.codigoInventario || '').trim()) errors.codigoInventario = t('logistica.error_codigo_inventario', 'Código de inventario requerido');
    const valor = Number(form.valorAdquisicion);
    if (!form.valorAdquisicion || Number.isNaN(valor) || valor < 0) errors.valorAdquisicion = t('logistica.error_valor_adquisicion', 'Valor válido requerido');
    return errors;
  };

  const validateCuadro = () => {
    const errors: Record<string, string> = {};
    if (!String(form.solicitud || '').trim() || String(form.solicitud || '').trim().length < 3) {
      errors.solicitud = t('logistica.error_solicitud', 'Descripción de la solicitud requerida (mínimo 3 caracteres)');
    }
    return errors;
  };

  const validatePago = () => {
    const errors: Record<string, string> = {};
    if (!String(form.proveedorNombre || '').trim()) errors.proveedorNombre = t('logistica.error_proveedor', 'Nombre del proveedor requerido');
    if (!String(form.concepto || '').trim()) errors.concepto = t('logistica.error_concepto', 'Concepto requerido');
    const monto = Number(form.monto);
    if (!form.monto || Number.isNaN(monto) || monto <= 0) errors.monto = t('logistica.error_monto', 'Monto válido requerido');
    if (!String(form.fechaVencimiento || '').trim()) errors.fechaVencimiento = t('logistica.error_fecha_vencimiento', 'Fecha de vencimiento requerida');
    return errors;
  };

  const saveActivo = () => {
    const errors = validateActivo();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    addActivo({
      nombre: String(form.nombre).trim(),
      codigoInventario: String(form.codigoInventario).trim(),
      tipo: (form.tipo || 'herramienta') as ActivoHerramienta['tipo'],
      valorAdquisicion: Number(form.valorAdquisicion),
      estado: 'disponible',
      fechaAdquisicion: todayISO(),
    });
    setShowForm(null);
    setForm({});
    setFormErrors({});
  };

  const saveCuadro = () => {
    const errors = validateCuadro();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    addCuadro({
      solicitud: String(form.solicitud).trim(),
      fechaSolicitud: todayISO(),
      estado: 'abierto',
      cotizaciones: [],
    });
    setShowForm(null);
    setForm({});
    setFormErrors({});
  };

  const savePago = () => {
    const errors = validatePago();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    addPagoProveedor({
      proveedorId: uid(),
      proveedorNombre: String(form.proveedorNombre).trim(),
      concepto: String(form.concepto).trim(),
      monto: Number(form.monto),
      fechaEmision: todayISO(),
      fechaVencimiento: String(form.fechaVencimiento),
      estado: 'pendiente',
    });
    setShowForm(null);
    setForm({});
    setFormErrors({});
  };

  const addCotizacion = (cuadroId: string, data: any) => {
    const cuadro = cuadros.find(c => c.id === cuadroId);
    if (!cuadro) return;
    updateCuadro(cuadroId, {
      cotizaciones: [...(cuadro.cotizaciones || []), { ...data, id: uid() }],
    });
  };

  const selectCotizacion = (cuadroId: string, cotizacionId: string) => {
    const cuadro = cuadros.find(c => c.id === cuadroId);
    if (!cuadro) return;
    updateCuadro(cuadroId, {
      estado: 'adjudicado',
      cotizaciones: cuadro.cotizaciones.map(ct => ({ ...ct, seleccionada: ct.id === cotizacionId })),
    });
  };

  const pagosVencidos = pagosProveedor.filter(p => p.estado === 'vencido');

  const renderActivos = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-1.5"><Wrench className="w-4 h-4" /> {t('logistica.activos')}</h2>
        <button onClick={() => { setShowForm('activo'); setForm({}); setFormErrors({}); }}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs hover:bg-primary/90">{t('logistica.nuevo_activo', 'Nuevo Activo')}</button>
      </div>
      {activos.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{t('logistica.sin_activos', 'No hay activos registrados')}</p>}
      {activos.length > 0 && (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">{t('logistica.codigo', 'Código')}</th>
              <th className="p-2 text-left">{t('common.nombre')}</th>
              <th className="p-2 text-left">{t('logistica.tipo', 'Tipo')}</th>
              <th className="p-2 text-right">{t('logistica.valor', 'Valor')}</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {activos.map(a => (
              <tr key={a.id} className="border-t hover:bg-muted/50">
                <td className="p-2 font-mono text-xs">{a.codigoInventario}</td>
                <td className="p-2">{a.nombre}</td>
                <td className="p-2 text-xs">{a.tipo}</td>
                <td className="p-2 text-right font-mono">Q{a.valorAdquisicion.toFixed(2)}</td>
                <td className="p-2">
                  <button onClick={() => deleteActivo(a.id)} className="text-destructive hover:text-destructive/80 text-xs" aria-label={t('logistica.eliminar_activo', 'Eliminar activo')}><Trash2 className="w-3 h-3" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );

  const renderCuadros = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-1.5"><BarChart3 className="w-4 h-4" /> {t('logistica.cuadros', 'Cuadros Comparativos')}</h2>
        <button onClick={() => { setShowForm('cuadro'); setForm({}); setFormErrors({}); }}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs hover:bg-primary/90">{t('logistica.nueva_solicitud', 'Nueva Solicitud')}</button>
      </div>
      {cuadros.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{t('logistica.sin_cuadros', 'Sin solicitudes de cotización')}</p>}
      {cuadros.length > 0 && (
      <div className="grid gap-3">
        {cuadros.map(c => (
          <div key={c.id} className="border rounded-lg p-3 bg-card">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-semibold">{c.solicitud}</span>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                  c.estado === 'abierto' ? 'bg-warning/10 text-warning' :
                  c.estado === 'cerrado' ? 'bg-muted text-muted-foreground' : 'bg-success/10 text-success'
                }`}>{c.estado}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{new Date(c.fechaSolicitud).toLocaleDateString()}</span>
                <button onClick={() => deleteCuadro(c.id)} className="text-destructive hover:text-destructive/80 text-xs" aria-label={t('logistica.eliminar_cuadro', 'Eliminar cuadro')}><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
            {c.estado === 'abierto' && (
              <div className="mt-2">
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">{t('cotizaciones.titulo', 'Cotizaciones')}:</h4>
                {(c.cotizaciones || []).map(ct => (
                  <div key={ct.id} className={`flex items-center justify-between text-xs p-2 rounded mb-1 ${
                    ct.seleccionada ? 'bg-success/10 border border-success/30' : 'bg-muted'
                  }`}>
                    <span>{ct.proveedorNombre}</span>
                    <span className="font-mono font-bold">Q{ct.montoTotal.toFixed(2)}</span>
                    {!ct.seleccionada && c.estado === 'abierto' && (
                      <button onClick={() => selectCotizacion(c.id, ct.id)}
                        className="bg-success text-success-foreground px-2 py-0.5 rounded text-xs hover:bg-success/90">
                        {t('logistica.adjudicar', 'Adjudicar')}
                      </button>
                    )}
                    {ct.seleccionada && <span className="text-success font-bold"><CheckCircle className="w-3 h-3 inline" aria-hidden="true" /> Adjudicada</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );

  const renderPagos = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> {t('logistica.pagos', 'Pagos Proveedores')}</h2>
        <button onClick={() => { setShowForm('pago'); setForm({}); setFormErrors({}); }}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs hover:bg-primary/90">+ {t('logistica.nuevo_pago', 'Nuevo Pago')}</button>
      </div>
      {(pagosProveedor || []).length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{t('logistica.sin_pagos', 'Sin pagos registrados')}</p>}
      {(pagosProveedor || []).length > 0 && (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-left">{t('cuentas.proveedor', 'Proveedor')}</th>
              <th className="p-2 text-left">{t('logistica.concepto', 'Concepto')}</th>
              <th className="p-2 text-right">{t('cuentas.monto', 'Monto')}</th>
              <th className="p-2 text-left">{t('cuentas.fecha_vencimiento', 'Vencimiento')}</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {(pagosProveedor || []).map(p => (
              <tr key={p.id} className="border-t hover:bg-muted/50">
                <td className="p-2 font-medium">{p.proveedorNombre}</td>
                <td className="p-2 text-xs">{p.concepto}</td>
                <td className="p-2 text-right font-mono">Q{p.monto.toFixed(2)}</td>
                <td className="p-2 text-xs">{new Date(p.fechaVencimiento).toLocaleDateString()}</td>
                <td className="p-2">
                  {p.estado === 'pendiente' && 'Pendiente'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );

  if (loading) {
    return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="flex gap-1 mb-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg overflow-x-auto">
        {([
          { key: 'activos', label: t('logistica.tab_activos', 'Activos'), icon: Wrench },
          { key: 'cuadros', label: t('logistica.tab_cuadros', 'Cotizaciones'), icon: BarChart3 },
          { key: 'pagos', label: t('logistica.tab_pagos', 'Pagos'), icon: DollarSign },
        ] as const).map(tabDef => {
          const TabIcon = tabDef.icon;
          return (
            <button key={tabDef.key} onClick={() => setTab(tabDef.key as 'activos' | 'cuadros' | 'pagos')}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                tab === tabDef.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}><TabIcon className="w-4 h-4" aria-hidden="true" /> {tabDef.label}</button>
          );
        })}
      </div>

      {tab === 'activos' && renderActivos()}
      {tab === 'cuadros' && renderCuadros()}
      {tab === 'pagos' && renderPagos()}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t('logistica.formulario', 'Formulario')}>
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">
              {showForm === 'activo' && t('logistica.nuevo_activo', 'Nuevo Activo / Herramienta')}
              {showForm === 'cuadro' && t('logistica.nueva_solicitud_cotizacion', 'Nueva Solicitud de Cotización')}
              {showForm === 'pago' && t('logistica.nuevo_pago_proveedor', 'Nuevo Pago a Proveedor')}
            </h3>
            {showForm === 'activo' && (
              <div className="grid gap-3">
                <div>
                  <input placeholder={t('logistica.nombre_activo_placeholder', 'Nombre del activo *')} className={formControlClass(Boolean(formErrors.nombre))}
                    value={form.nombre || ''} onChange={e => updateForm('nombre', e.target.value)} />
                  {formErrors.nombre && <p className="text-xs text-destructive mt-1">{formErrors.nombre}</p>}
                </div>
                <div>
                  <input placeholder={t('logistica.codigo_inventario_placeholder', 'Código de inventario *')} className={formControlClass(Boolean(formErrors.codigoInventario))}
                    value={form.codigoInventario || ''} onChange={e => updateForm('codigoInventario', e.target.value)} />
                  {formErrors.codigoInventario && <p className="text-xs text-destructive mt-1">{formErrors.codigoInventario}</p>}
                </div>
                <select className={formControlClass(false)}
                  value={form.tipo || 'herramienta'} onChange={e => updateForm('tipo', e.target.value)}>
                  <option value="herramienta">Herramienta</option>
                  <option value="equipo">Equipo</option>
                  <option value="vehiculo">Vehículo</option>
                  <option value="accesorio">Accesorio</option>
                </select>
                <div>
                  <input placeholder={t('logistica.valor_adquisicion_placeholder', 'Valor de adquisición Q *')} type="number" inputMode="decimal" className={formControlClass(Boolean(formErrors.valorAdquisicion))}
                    value={form.valorAdquisicion || ''} onChange={e => updateForm('valorAdquisicion', e.target.value)} />
                  {formErrors.valorAdquisicion && <p className="text-xs text-destructive mt-1">{formErrors.valorAdquisicion}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={saveActivo} className="mt-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90">{t('common.guardar', 'Guardar')}</button>
                  <button onClick={() => { setShowForm(null); setFormErrors({}); }} className="mt-2 w-full px-4 py-2 border border-input rounded-lg text-xs text-muted-foreground hover:bg-muted">{t('common.cancelar')}</button>
                </div>
              </div>
            )}
            {showForm === 'cuadro' && (
              <div className="grid gap-3">
                <div>
                  <input placeholder={t('logistica.solicitud_placeholder', 'Descripción de lo que se cotiza *')} className={formControlClass(Boolean(formErrors.solicitud))}
                    value={form.solicitud || ''} onChange={e => updateForm('solicitud', e.target.value)} />
                  {formErrors.solicitud && <p className="text-xs text-destructive mt-1">{formErrors.solicitud}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={saveCuadro} className="mt-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90">{t('common.guardar', 'Guardar')}</button>
                  <button onClick={() => { setShowForm(null); setFormErrors({}); }} className="mt-2 w-full px-4 py-2 border border-input rounded-lg text-xs text-muted-foreground hover:bg-muted">{t('common.cancelar')}</button>
                </div>
              </div>
            )}
            {showForm === 'pago' && (
              <div className="grid gap-3">
                <div>
                  <input placeholder={t('logistica.proveedor_nombre_placeholder', 'Nombre del proveedor *')} className={formControlClass(Boolean(formErrors.proveedorNombre))}
                    value={form.proveedorNombre || ''} onChange={e => updateForm('proveedorNombre', e.target.value)} />
                  {formErrors.proveedorNombre && <p className="text-xs text-destructive mt-1">{formErrors.proveedorNombre}</p>}
                </div>
                <div>
                  <input placeholder={t('logistica.concepto_placeholder', 'Concepto *')} className={formControlClass(Boolean(formErrors.concepto))}
                    value={form.concepto || ''} onChange={e => updateForm('concepto', e.target.value)} />
                  {formErrors.concepto && <p className="text-xs text-destructive mt-1">{formErrors.concepto}</p>}
                </div>
                <div>
                  <input placeholder={t('logistica.monto_placeholder', 'Monto Q *')} type="number" inputMode="decimal" className={formControlClass(Boolean(formErrors.monto))}
                    value={form.monto || ''} onChange={e => updateForm('monto', e.target.value)} />
                  {formErrors.monto && <p className="text-xs text-destructive mt-1">{formErrors.monto}</p>}
                </div>
                <div>
                  <input placeholder={t('logistica.fecha_vencimiento_placeholder', 'Fecha de vencimiento *')} type="date" className={formControlClass(Boolean(formErrors.fechaVencimiento))}
                    value={form.fechaVencimiento || ''} onChange={e => updateForm('fechaVencimiento', e.target.value)} />
                  {formErrors.fechaVencimiento && <p className="text-xs text-destructive mt-1">{formErrors.fechaVencimiento}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={savePago} className="mt-2 w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90">{t('common.guardar', 'Guardar')}</button>
                  <button onClick={() => { setShowForm(null); setFormErrors({}); }} className="mt-2 w-full px-4 py-2 border border-input rounded-lg text-xs text-muted-foreground hover:bg-muted">{t('common.cancelar')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticaCompras;
