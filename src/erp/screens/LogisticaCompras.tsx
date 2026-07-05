import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp, uid } from '../store';
import { Wrench, BarChart3, DollarSign, CheckCircle, Trash2 } from 'lucide-react';
import type { ActivoHerramienta, PagoProveedor } from '../types';
import { z } from 'zod';
import { toast } from 'sonner';
const activoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  codigoInventario: z.string().min(1, 'Código requerido').max(50, 'Máximo 50 caracteres'),
  tipo: z.enum(['herramienta', 'equipo', 'vehiculo', 'accesorio']),
  valorAdquisicion: z.coerce.number().min(0, 'Debe ser ≥ 0').max(9_999_999, 'Monto muy alto'),
});

const cuadroSchema = z.object({
  solicitud: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
});

const pagoSchema = z.object({
  proveedorNombre: z.string().min(1, 'Proveedor requerido').max(100, 'Máximo 100 caracteres'),
  concepto: z.string().min(1, 'Concepto requerido').max(200, 'Máximo 200 caracteres'),
  monto: z.coerce.number().min(1, 'Debe ser ≥ Q1').max(99_999_999, 'Monto muy alto'),
  fechaVencimiento: z.string().min(1, 'Fecha requerida'),
});

export const LogisticaCompras: React.FC = () => {
  const { t } = useTranslation();
  const { activos, addActivo, updateActivo, deleteActivo, cuadros, addCuadro, updateCuadro, pagosProveedor, addPagoProveedor, updatePagoProveedor } = useErp();
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
              <span className="text-xs text-muted-foreground">{new Date(c.fechaSolicitud).toLocaleDateString()}</span>
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
                  <input placeholder={t('logistica.nombre_activo_placeholder', 'Nombre del activo *')} className={fc('nombre')}
                    value={form.nombre || ''} onChange={e => updateForm('nombre', e.target.value)} />
                  {formErrors.nombre && <p className="text-xs text-destructive mt-1">{formErrors.nombre}</p>}
                </div>
                <div>
                  <input placeholder={t('logistica.codigo_inventario_placeholder', 'Código de inventario *')} className={fc('codigoInventario')}
                    value={form.codigoInventario || ''} onChange={e => updateForm('codigoInventario', e.target.value)} />
                  {formErrors.codigoInventario && <p className="text-xs text-destructive mt-1">{formErrors.codigoInventario}</p>}
                </div>
                <select className="w-full px-3 py-2 border rounded text-sm border-input outline-none focus:border-ring"
                  value={form.tipo || 'herramienta'} onChange={e => updateForm('tipo', e.target.value)}>
                  <option value="herramienta">Herramienta</option>
                  <option value="equipo">Equipo</option>
                  <option value="vehiculo">Vehículo</option>
                  <option value="accesorio">Accesorio</option>
                </select>
                <div>
                  <input placeholder={t('logistica.valor_adquisicion_placeholder', 'Valor de adquisición Q *')} type="number" inputMode="decimal" className={fc('valorAdquisicion')}
                    value={form.valorAdquisicion || ''} onChange={e => updateForm('valorAdquisicion', e.target.value)} />
                  {formErrors.valorAdquisicion && <p className="text-xs text-destructive mt-1">{formErrors.valorAdquisicion}</p>}
                </div>
                <button onClick={() => { setShowForm(null); setFormErrors({}); }} className="mt-2 w-full px-4 py-2 border border-input rounded-lg text-xs text-muted-foreground hover:bg-muted">{t('common.cancelar')}</button>
              </div>
            )}
            {showForm === 'cuadro' && (
              <div className="grid gap-3">
                <div>
                  <input placeholder={t('logistica.solicitud_placeholder', 'Descripción de lo que se cotiza *')} className={fc('solicitud')}
                    value={form.solicitud || ''} onChange={e => updateForm('solicitud', e.target.value)} />
                  {formErrors.solicitud && <p className="text-xs text-destructive mt-1">{formErrors.solicitud}</p>}
                </div>
                <button onClick={() => { setShowForm(null); setFormErrors({}); }} className="mt-2 w-full px-4 py-2 border border-input rounded-lg text-xs text-muted-foreground hover:bg-muted">{t('common.cancelar')}</button>
              </div>
            )}
            {showForm === 'pago' && (
              <div className="grid gap-3">
                <div>
                  <input placeholder={t('logistica.proveedor_nombre_placeholder', 'Nombre del proveedor *')} className={fc('proveedorNombre')}
                    value={form.proveedorNombre || ''} onChange={e => updateForm('proveedorNombre', e.target.value)} />
                  {formErrors.proveedorNombre && <p className="text-xs text-destructive mt-1">{formErrors.proveedorNombre}</p>}
                </div>
                <div>
                  <input placeholder={t('logistica.concepto_placeholder', 'Concepto *')} className={fc('concepto')}
                    value={form.concepto || ''} onChange={e => updateForm('concepto', e.target.value)} />
                  {formErrors.concepto && <p className="text-xs text-destructive mt-1">{formErrors.concepto}</p>}
                </div>
                <div>
                  <input placeholder={t('logistica.monto_placeholder', 'Monto Q *')} type="number" inputMode="decimal" className={fc('monto')}
                    value={form.monto || ''} onChange={e => updateForm('monto', e.target.value)} />
                  {formErrors.monto && <p className="text-xs text-destructive mt-1">{formErrors.monto}</p>}
                </div>
                <div>
                  <input placeholder={t('logistica.fecha_vencimiento_placeholder', 'Fecha de vencimiento *')} type="date" className={fc('fechaVencimiento')}
                    value={form.fechaVencimiento || ''} onChange={e => updateForm('fechaVencimiento', e.target.value)} />
                  {formErrors.fechaVencimiento && <p className="text-xs text-destructive mt-1">{formErrors.fechaVencimiento}</p>}
                </div>
                <button onClick={() => { setShowForm(null); setFormErrors({}); }} className="mt-2 w-full px-4 py-2 border border-input rounded-lg text-xs text-muted-foreground hover:bg-muted">{t('common.cancelar')}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticaCompras;
