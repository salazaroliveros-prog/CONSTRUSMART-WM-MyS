import { Skeleton } from '@/components/ui/skeleton';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import type { ActivoLogistica, CuadroComparativo, PagoProveedor } from '../types';
import { Truck, ClipboardList, CreditCard, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { fmtQ } from '../utils';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui';

const uid = () => Date.now().toString(36).substr(2, 9);
const FOCUS_VISIBLE = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export const LogisticaCompras: React.FC = () => {
  const { t } = useTranslation();
  const { proveedores, user } = useErp();

  const [tab, setTab] = useState<'activos' | 'cuadros' | 'pagos'>('activos');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [activos, setActivos] = useState<ActivoLogistica[]>([]);
  const [cuadros, setCuadros] = useState<CuadroComparativo[]>([]);
  const [pagos, setPagos] = useState<PagoProveedor[]>([]);

  useEffect(() => { setLoading(false); }, []);

  const addActivo = (data: Omit<ActivoLogistica, 'id'>) => setActivos(prev => [{ ...data, id: uid() }, ...prev]);
  const deleteActivo = (id: string) => setActivos(prev => prev.filter(a => a.id !== id));
  const addCuadro = (data: Omit<CuadroComparativo, 'id'>) => setCuadros(prev => [{ ...data, id: uid() }, ...prev]);
  const deleteCuadro = (id: string) => setCuadros(prev => prev.filter(c => c.id !== id));
  const addPago = (data: Omit<PagoProveedor, 'id'>) => setPagos(prev => [{ ...data, id: uid() }, ...prev]);

  const renderActivos = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5"><Truck className="w-4 h-4" aria-hidden="true" /> {t('logistica.activos')}</h2>
        <button onClick={() => { setShowForm('activo'); setForm({ tipo: 'herramienta', estado: 'disponible' }); }}
          className={`${BUTTON_PRIMARY} text-xs flex items-center gap-1 ${FOCUS_VISIBLE}`}><Plus className="w-3 h-3" aria-hidden="true" /> {t('logistica.nuevo_activo')}</button>
      </div>
      {activos.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground"><Truck className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" /><p className="text-sm">{t('logistica.sin_activos')}</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label={t('logistica.activos')}>
            <thead><tr className="bg-muted">
              <th className="p-2 text-left" scope="col">{t('common.nombre')}</th>
              <th className="p-2 text-left" scope="col">{t('common.tipo')}</th>
              <th className="p-2 text-right" scope="col">{t('common.costo')}</th>
              <th className="p-2 text-left" scope="col">{t('common.estado')}</th>
              <th className="p-2 text-right" scope="col">{t('common.acciones')}</th>
            </tr></thead>
            <tbody>
              {activos.map(a => (
                <tr key={a.id} className="border-t hover:bg-muted/50">
                  <td className="p-2 font-medium truncate" title={a.nombre}>{a.nombre}</td>
                  <td className="p-2 text-xs truncate">{t('logistica.tipo_' + a.tipo, a.tipo)}</td>
                  <td className="p-2 text-right font-mono">{fmtQ(a.costo)}</td>
                  <td className="p-2">{a.estado}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => deleteActivo(a.id)} aria-label={t('logistica.eliminar_activo', { nombre: a.nombre })}
                      className={`p-1.5 rounded hover:bg-accent text-red-500 ${FOCUS_VISIBLE}`}><Trash2 className="w-3 h-3" aria-hidden="true" /></button>
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
        <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5"><ClipboardList className="w-4 h-4" aria-hidden="true" /> {t('logistica.cuadros')}</h2>
        <button onClick={() => { setShowForm('cuadro'); setForm({}); }}
          className={`${BUTTON_PRIMARY} text-xs flex items-center gap-1 ${FOCUS_VISIBLE}`}><Plus className="w-3 h-3" aria-hidden="true" /> {t('logistica.nuevo_cuadro')}</button>
      </div>
      {cuadros.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground"><ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" /><p className="text-sm">{t('logistica.sin_cuadros')}</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label={t('logistica.cuadros')}>
            <thead><tr className="bg-muted">
              <th className="p-2 text-left" scope="col">{t('common.proveedor')}</th>
              <th className="p-2 text-left" scope="col">{t('common.descripcion')}</th>
              <th className="p-2 text-right" scope="col">{t('common.monto')}</th>
              <th className="p-2 text-left" scope="col">{t('common.estado')}</th>
              <th className="p-2 text-right" scope="col">{t('common.acciones')}</th>
            </tr></thead>
            <tbody>
              {cuadros.map(c => (
                <tr key={c.id} className="border-t hover:bg-muted/50">
                  <td className="p-2 font-medium">{c.proveedorId}</td>
                  <td className="p-2 text-xs">{c.descripcion}</td>
                  <td className="p-2 text-right font-mono">{fmtQ(c.montoTotal)}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    c.estado === 'adjudicado' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>{t('logistica.estado_' + c.estado, c.estado)}</span></td>
                  <td className="p-2 text-right">
                    <button onClick={() => deleteCuadro(c.id)} aria-label={t('logistica.eliminar_cuadro', { proveedor: c.proveedorId })}
                      className={`p-1.5 rounded hover:bg-accent text-red-500 ${FOCUS_VISIBLE}`}><Trash2 className="w-3 h-3" aria-hidden="true" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderPagos = () => (
    <div>
      <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 mb-4"><CreditCard className="w-4 h-4" aria-hidden="true" /> {t('logistica.pagos')}</h2>
      {pagos.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground"><CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" /><p className="text-sm">{t('logistica.sin_pagos')}</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table" aria-label={t('logistica.pagos')}>
            <thead><tr className="bg-muted">
              <th className="p-2 text-left" scope="col">{t('common.proveedor')}</th>
              <th className="p-2 text-right" scope="col">{t('common.monto')}</th>
              <th className="p-2 text-left" scope="col">{t('common.estado')}</th>
              <th className="p-2 text-left" scope="col">{t('common.fecha')}</th>
            </tr></thead>
            <tbody>
              {pagos.map(p => (
                <tr key={p.id} className="border-t hover:bg-muted/50">
                  <td className="p-2 font-medium">{p.proveedorId}</td>
                  <td className="p-2 text-right font-mono">{fmtQ(p.monto)}</td>
                  <td className="p-2">{p.estado === 'pendiente' ? t('logistica.estado_pendiente', 'Pendiente') : p.estado}</td>
                  <td className="p-2 text-xs">{new Date(p.fecha).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (loading) return <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-2xl" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <h1 className="text-2xl font-black text-foreground mb-4">{t('logistica.titulo')}</h1>
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg overflow-x-auto" role="tablist">
        {[
          { key: 'activos' as const, label: t('logistica.activos'), icon: Truck },
          { key: 'cuadros' as const, label: t('logistica.cuadros'), icon: ClipboardList },
          { key: 'pagos' as const,   label: t('logistica.pagos'), icon: CreditCard },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button key={item.key} onClick={() => setTab(item.key)} role="tab" aria-selected={tab === item.key}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1.5 ${FOCUS_VISIBLE} ${
                tab === item.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
              }`}><Icon className="w-4 h-4" aria-hidden="true" /> {item.label}</button>
          );
        })}
      </div>

      {tab === 'activos' && renderActivos()}
      {tab === 'cuadros' && renderCuadros()}
      {tab === 'pagos'   && renderPagos()}

      {showForm === 'activo' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t('logistica.nuevo_activo')}>
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4 text-foreground">{t('logistica.nuevo_activo')}</h3>
            <div className="grid gap-3">
              <input placeholder={t('logistica.placeholder_nombre', 'Nombre del activo')} className={INPUT} value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} />
              <select className={INPUT} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <option value="herramienta">{t('logistica.tipo_herramienta', 'Herramienta')}</option>
                <option value="equipo">{t('logistica.tipo_equipo', 'Equipo')}</option>
                <option value="vehiculo">{t('logistica.tipo_vehiculo', 'Vehículo')}</option>
                <option value="accesorio">{t('logistica.tipo_accesorio', 'Accesorio')}</option>
              </select>
              <input type="number" inputMode="decimal" placeholder={t('logistica.placeholder_costo', 'Costo Q')} className={INPUT} value={form.costo || ''} onChange={e => setForm({ ...form, costo: +e.target.value })} />
              <button onClick={() => {
                if (!form.nombre) { setFormErrors({ nombre: t('logistica.error_nombre_requerido', 'Nombre requerido') }); return; }
                addActivo({ nombre: form.nombre, tipo: form.tipo || 'herramienta', costo: form.costo || 0, estado: 'disponible' });
                setShowForm(null);
                toast.success(t('logistica.activo_creado', 'Activo registrado'));
              }} className={`${BUTTON_PRIMARY} ${FOCUS_VISIBLE}`}>{t('common.guardar')}</button>
              <button onClick={() => setShowForm(null)} className={`${BUTTON_SECONDARY} ${FOCUS_VISIBLE}`}>{t('common.cancelar')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticaCompras;