import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp, uid } from '../store';
import { Truck, ClipboardList, CreditCard, Plus, Trash2, FolderKanban, Package, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { fmtQ } from '../utils';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivoLogistica {
  id: string; nombre: string; tipo: string; costo: number; estado: string; proyectoId?: string;
}
interface CuadroComparativo {
  id: string; proveedorId: string; descripcion: string; montoTotal: number; estado: string; proyectoId?: string;
}
interface PagoProveedor {
  id: string; proveedorId: string; monto: number; estado: string; fecha: string; proyectoId?: string;
}

const FOCUS_VISIBLE = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export const LogisticaCompras: React.FC = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  const { t } = useTranslation();
  const store = useErp();
  const { proyectos, currentProjectId, setCurrentProjectId, proveedores } = store;
  const activos = store.activos as ActivoLogistica[];
  const cuadros = store.cuadros as CuadroComparativo[];
  const pagosProveedor = store.pagosProveedor as PagoProveedor[];

  const [tab, setTab] = useState<'activos' | 'cuadros' | 'pagos'>('activos');
  const [showForm, setShowForm] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filteredActivos = currentProjectId ? activos.filter((a: ActivoLogistica) => a.proyectoId === currentProjectId) : activos;
  const filteredCuadros = currentProjectId ? cuadros.filter((c: CuadroComparativo) => c.proyectoId === currentProjectId) : cuadros;
  const filteredPagos = currentProjectId ? pagosProveedor.filter((p: PagoProveedor) => p.proyectoId === currentProjectId) : pagosProveedor;

  const addActivo = (data: Omit<ActivoLogistica, 'id'>) => {
    const item = { ...data, id: uid(), proyectoId: currentProjectId || undefined };
    store.setActivos((prev: any) => [item, ...prev]);
  };
  const deleteActivo = (id: string) => store.setActivos((prev: any) => prev.filter((a: any) => a.id !== id));
  const addCuadro = (data: Omit<CuadroComparativo, 'id'>) => {
    const item = { ...data, id: uid(), proyectoId: currentProjectId || undefined };
    store.setCuadros((prev: any) => [item, ...prev]);
  };
  const deleteCuadro = (id: string) => store.setCuadros((prev: any) => prev.filter((c: any) => c.id !== id));
  const addPago = (data: Omit<PagoProveedor, 'id'>) => {
    const item = { ...data, id: uid(), proyectoId: currentProjectId || undefined };
    store.setPagosProveedor((prev: any) => [item, ...prev]);
  };

  const kpiActivos = filteredActivos.length;
  const kpiCuadros = filteredCuadros.length;
  const kpiPagos = filteredPagos.length;
  const totalPagos = filteredPagos.reduce((s, p) => s + (p.monto || 0), 0);

  const renderActivos = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5"><Truck className="w-4 h-4" aria-hidden="true" /> {t('logistica.activos')}</h2>
        <button onClick={() => { setShowForm('activo'); setForm({ tipo: 'herramienta', estado: 'disponible' }); }}
          className={`${BUTTON_PRIMARY} text-xs flex items-center gap-1 ${FOCUS_VISIBLE}`}><Plus className="w-3 h-3" aria-hidden="true" /> {t('logistica.nuevo_activo')}</button>
      </div>
      {filteredActivos.length === 0 ? (
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
              {filteredActivos.map(a => (
                <tr key={a.id} className="border-t hover:bg-muted/50">
                  <td className="p-2 font-medium truncate" title={a.nombre}>{a.nombre}</td>
                  <td className="p-2 text-xs truncate">{t('logistica.tipo_' + a.tipo, a.tipo)}</td>
                  <td className="p-2 text-right font-mono">{fmtQ(a.costo)}</td>
                  <td className="p-2">{a.estado}</td>
                  <td className="p-2 text-right">
                    <button onClick={() => { deleteActivo(a.id); toast.success(t('logistica.activo_eliminado', 'Activo eliminado')); }} aria-label={t('logistica.eliminar_activo', { nombre: a.nombre })}
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
      {filteredCuadros.length === 0 ? (
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
              {filteredCuadros.map(c => {
                const prov = proveedores.find(p => p.id === c.proveedorId);
                return (
                  <tr key={c.id} className="border-t hover:bg-muted/50">
                    <td className="p-2 font-medium">{prov?.nombre || c.proveedorId}</td>
                    <td className="p-2 text-xs">{c.descripcion}</td>
                    <td className="p-2 text-right font-mono">{fmtQ(c.montoTotal)}</td>
                    <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.estado === 'adjudicado' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>{t('logistica.estado_' + c.estado, c.estado)}</span></td>
                    <td className="p-2 text-right">
                      <button onClick={() => { deleteCuadro(c.id); toast.success(t('logistica.cuadro_eliminado', 'Cuadro eliminado')); }} aria-label={t('logistica.eliminar_cuadro', { proveedor: c.proveedorId })}
                        className={`p-1.5 rounded hover:bg-accent text-red-500 ${FOCUS_VISIBLE}`}><Trash2 className="w-3 h-3" aria-hidden="true" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderPagos = () => (
    <div>
      <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5 mb-4"><CreditCard className="w-4 h-4" aria-hidden="true" /> {t('logistica.pagos')}</h2>
      {filteredPagos.length === 0 ? (
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
              {filteredPagos.map(p => {
                const prov = proveedores.find(pv => pv.id === p.proveedorId);
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/50">
                    <td className="p-2 font-medium">{prov?.nombre || p.proveedorId}</td>
                    <td className="p-2 text-right font-mono">{fmtQ(p.monto)}</td>
                    <td className="p-2">{p.estado === 'pendiente' ? t('logistica.estado_pendiente', 'Pendiente') : p.estado}</td>
                    <td className="p-2 text-xs">{new Date(p.fecha).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-foreground">{t('logistica.titulo')}</h1>
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <select
            className={`${INPUT} text-sm max-w-[220px]`}
            value={currentProjectId || ''}
            onChange={e => setCurrentProjectId(e.target.value || null)}
            aria-label={t('common.seleccionar_proyecto', 'Seleccionar proyecto')}
          >
            <option value="">{t('common.todos_los_proyectos', 'Todos los proyectos')}</option>
            {proyectos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-lg p-4 border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-primary" aria-hidden="true" /></div>
          <div><p className="text-xs text-muted-foreground">{t('logistica.total_activos', 'Activos')}</p><p className="text-lg font-bold text-foreground">{kpiActivos}</p></div>
        </div>
        <div className="bg-card rounded-lg p-4 border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center shrink-0"><FileText className="w-5 h-5 text-info" aria-hidden="true" /></div>
          <div><p className="text-xs text-muted-foreground">{t('logistica.total_cuadros', 'Cuadros')}</p><p className="text-lg font-bold text-foreground">{kpiCuadros}</p></div>
        </div>
        <div className="bg-card rounded-lg p-4 border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0"><CreditCard className="w-5 h-5 text-success" aria-hidden="true" /></div>
          <div><p className="text-xs text-muted-foreground">{t('logistica.total_pagos', 'Pagos')}</p><p className="text-lg font-bold text-foreground">{kpiPagos}</p></div>
        </div>
        <div className="bg-card rounded-lg p-4 border shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0"><DollarSign className="w-5 h-5 text-warning" aria-hidden="true" /></div>
          <div><p className="text-xs text-muted-foreground">{t('logistica.monto_total_pagos', 'Total Pagado')}</p><p className="text-lg font-bold text-foreground">{fmtQ(totalPagos)}</p></div>
        </div>
      </div>

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
      {tab === 'pagos' && renderPagos()}

      {showForm === 'activo' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label={t('logistica.nuevo_activo')}>
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4 text-foreground">{t('logistica.nuevo_activo')}</h3>
            <div className="grid gap-3">
              <input placeholder={t('logistica.placeholder_nombre', 'Nombre del activo')} className={INPUT} value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} />
              {formErrors.nombre && <p className="text-xs text-red-500">{formErrors.nombre}</p>}
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
                setFormErrors({});
                toast.success(t('logistica.activo_creado', 'Activo registrado'));
              }} className={`${BUTTON_PRIMARY} ${FOCUS_VISIBLE}`}>{t('common.guardar')}</button>
              <button onClick={() => { setShowForm(null); setFormErrors({}); }} className={`${BUTTON_SECONDARY} ${FOCUS_VISIBLE}`}>{t('common.cancelar')}</button>
            </div>
          </div>
        </div>
      )}

      {showForm === 'cuadro' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label={t('logistica.nuevo_cuadro')}>
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4 text-foreground">{t('logistica.nuevo_cuadro')}</h3>
            <div className="grid gap-3">
              <select className={INPUT} value={form.proveedorId || ''} onChange={e => setForm({ ...form, proveedorId: e.target.value })} aria-label={t('common.proveedor')}>
                <option value="">{t('common.seleccionar_proveedor', 'Seleccionar proveedor')}</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <input placeholder={t('logistica.placeholder_descripcion', 'Descripción')} className={INPUT} value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
              <input type="number" inputMode="decimal" placeholder={t('logistica.placeholder_monto', 'Monto Q')} className={INPUT} value={form.montoTotal || ''} onChange={e => setForm({ ...form, montoTotal: +e.target.value })} />
              <select className={INPUT} value={form.estado || 'pendiente'} onChange={e => setForm({ ...form, estado: e.target.value })}>
                <option value="pendiente">{t('logistica.estado_pendiente', 'Pendiente')}</option>
                <option value="adjudicado">{t('logistica.estado_adjudicado', 'Adjudicado')}</option>
              </select>
              <button onClick={() => {
                if (!form.proveedorId || !form.descripcion) return;
                addCuadro({ proveedorId: form.proveedorId, descripcion: form.descripcion, montoTotal: form.montoTotal || 0, estado: form.estado || 'pendiente' });
                setShowForm(null);
                toast.success(t('logistica.cuadro_creado', 'Cuadro registrado'));
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
