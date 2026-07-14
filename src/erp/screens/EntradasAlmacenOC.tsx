import { Skeleton } from '@/components/ui/skeleton';
import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ } from '../utils';
import { Package, CheckCircle, AlertTriangle, ClipboardList, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { confirmAction } from '@/lib/confirm-action';
import { INPUT, BUTTON_PRIMARY, BUTTON_SECONDARY } from '../ui';
import PaginationBar from '../components/PaginationBar';

const PAGE_SIZE = 10;

const EntradasAlmacenOC: React.FC = () => {
  const { t } = useTranslation();
  const { ordenes, recepciones, addRecepcion, currentProjectId } = useErp();
  const [loading, setLoading] = useState(true);
  const [ocFilter, setOcFilter] = useState<'todas' | 'pendientes' | 'aprobadas'>('todas');
  const [showForm, setShowForm] = useState<string | null>(null);
  const [formCantidad, setFormCantidad] = useState(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [historialPage, setHistorialPage] = useState(1);

  useEffect(() => { setLoading(false); }, []);

  const ocFiltradas = useMemo(() => {
    return (ordenes || []).filter(o => {
      if (!currentProjectId || currentProjectId === 'none') return false;
      if (o.proyectoId !== currentProjectId) return false;
      if (ocFilter === 'pendientes') return o.estado === 'pendiente';
      if (ocFilter === 'aprobadas') return o.estado === 'aprobado';
      return true;
    });
  }, [ordenes, currentProjectId, ocFilter]);

  const recsPorOC = useMemo(() => {
    const map: Record<string, { totalRecibido: number }> = {};
    (recepciones || []).forEach(r => {
      if (!map[r.ordenId]) map[r.ordenId] = { totalRecibido: 0 };
      map[r.ordenId].totalRecibido += r.cantidadRecibida || 0;
    });
    return map;
  }, [recepciones]);

  const historialRecepciones = useMemo(() => {
    const items = (recepciones || [])
      .filter(r => ordenes.some(o => o.id === r.ordenId))
      .map(r => {
        const oc = ordenes.find(o => o.id === r.ordenId);
        return {
          id: r.id,
          fecha: r.fecha,
          proveedor: oc?.proveedor || '—',
          material: oc?.material || '—',
          cantidadRecibida: r.cantidadRecibida,
          cantidadOC: oc?.cantidad || 0,
          diferencia: r.cantidadRecibida - (oc?.cantidad || 0),
        };
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const safePage = Math.min(historialPage, totalPages);
    const paginated = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    return { items: paginated, totalPages, page: safePage };
  }, [recepciones, ordenes, historialPage]);

  const handleReception = async (ordenId: string) => {
    const errors: Record<string, string> = {};
    if (!formCantidad || formCantidad <= 0) errors.cantidad = t('entradasAlmacenOC.error_cantidad_invalida', 'Cantidad inválida');
    const oc = ordenes.find(o => o.id === ordenId);
    const saldo = oc ? oc.cantidad - (recsPorOC[ordenId]?.totalRecibido || 0) : 0;
    if (formCantidad > saldo) errors.cantidad = t('entradasAlmacenOC.error_excede_saldo', 'Excede el saldo pendiente');
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    setFormErrors({});
    try {
      await confirmAction({
        title: t('entradasAlmacenOC.confirmar_recepcion'),
        content: t('entradasAlmacenOC.confirmar_recepcion_msg', { cantidad: formCantidad, material: oc?.material }),
        okText: t('common.confirmar'),
        cancelText: t('common.cancelar'),
      });
      addRecepcion({
        id: crypto.randomUUID(),
        ordenId,
        cantidadRecibida: formCantidad,
        fecha: new Date().toISOString().split('T')[0],
      });
      toast.success(t('entradasAlmacenOC.recepcion_registrada'));
      setShowForm(null);
      setFormCantidad(0);
    } catch {}
  };

  if (loading) return <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4"><Skeleton className="h-8 w-72" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /></div><Skeleton className="h-64 rounded-2xl" /></div>;

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2"><Package className="w-5 h-5" aria-hidden="true" /> {t('entradasAlmacenOC.titulo')}</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['todas', 'pendientes', 'aprobadas'] as const).map(f => (
            <button key={f} onClick={() => setOcFilter(f)} aria-label={f === 'todas' ? t('entradasAlmacenOC.filtro_todas_aria') : f === 'pendientes' ? t('entradasAlmacenOC.filtro_pendientes_aria') : t('entradasAlmacenOC.filtro_aprobadas_aria')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                ocFilter === f ? 'bg-card shadow text-blue-700' : 'text-muted-foreground'
              }`}>
              {f === 'todas' ? t('entradasAlmacenOC.filtro_todas') : f === 'pendientes' ? t('entradasAlmacenOC.filtro_pendientes') : t('entradasAlmacenOC.filtro_aprobadas')}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground self-center">{ocFiltradas.length} {t('entradasAlmacenOC.oc_count')}</span>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm" role="table" aria-label={t('entradasAlmacenOC.titulo')}>
          <thead><tr className="bg-muted/80">
            <th className="p-3 text-left" scope="col">{t('entradasAlmacenOC.col_proveedor')}</th>
            <th className="p-3 text-left" scope="col">{t('entradasAlmacenOC.col_material')}</th>
            <th className="p-3 text-right" scope="col">{t('entradasAlmacenOC.col_cantidad_oc')}</th>
            <th className="p-3 text-right" scope="col">{t('entradasAlmacenOC.col_monto')}</th>
            <th className="p-3 text-left" scope="col">{t('entradasAlmacenOC.col_estado')}</th>
            <th className="p-3 text-right" scope="col">{t('entradasAlmacenOC.col_recibir')}</th>
            <th className="p-3 text-right" scope="col">{t('entradasAlmacenOC.col_validacion')}</th>
          </tr></thead>
          <tbody>
            {ocFiltradas.map(oc => {
              const ocRecs = recsPorOC.get(oc.id);
              const totalRecibido = ocRecs?.totalRecibido || 0;
              const saldo = oc.cantidad - totalRecibido;
              const completada = saldo <= 0;

              return (
                <tr key={oc.id} className={`border-t border-border ${completada ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'hover:bg-muted/50'}`}>
                  <td className="p-3 font-medium">{oc.proveedor}</td>
                  <td className="p-3">{oc.material}</td>
                  <td className="p-3 text-right font-mono">{oc.cantidad}</td>
                  <td className="p-3 text-right font-mono">{fmtQ(oc.monto)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      oc.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
                      oc.estado === 'pendiente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                      oc.estado === 'recibida' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    }`}>{oc.estado}</span>
                  </td>
                  <td className="p-3 text-right">
                    {saldo > 0 ? (
                      <button onClick={() => { setShowForm(oc.id); setFormCantidad(saldo); setFormErrors({}); }} aria-label={t('entradasAlmacenOC.recibir_aria', { material: oc.material, proveedor: oc.proveedor })}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
                        <Plus className="w-3 h-3 inline mr-1" aria-hidden="true" /> {t('entradasAlmacenOC.recibir')}
                      </button>
                    ) : (
                      <span className="text-emerald-600 text-xs font-bold"><CheckCircle className="w-3 h-3 inline" aria-hidden="true" /> {t('entradasAlmacenOC.completa')}</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {totalRecibido > 0 ? (
                      <div className="text-xs">
                        <span className={totalRecibido <= oc.cantidad ? 'text-emerald-600' : 'text-red-600'}>
                          {totalRecibido}/{oc.cantidad}
                        </span>
                        {totalRecibido > oc.cantidad && (
                          <span className="ml-1 text-red-600 font-bold"><AlertTriangle className="w-3 h-3 inline" aria-hidden="true" /> {t('entradasAlmacenOC.excede')}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t('entradasAlmacenOC.registrar_recepcion')}>
          <div className="bg-card rounded-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-4">{t('entradasAlmacenOC.registrar_recepcion')}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {t('entradasAlmacenOC.oc_info', { material: ordenes.find(o => o.id === showForm)?.material, proveedor: ordenes.find(o => o.id === showForm)?.proveedor })}
            </p>
            <div className="grid gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('entradasAlmacenOC.cantidad_recibir')}</label>
                <input type="number" inputMode="decimal" value={formCantidad}
                  onChange={e => { setFormCantidad(+e.target.value); setFormErrors(prev => ({ ...prev, cantidad: '' })); }}
                  max={ordenes.find(o => o.id === showForm)?.cantidad || 0}
                  className={`${INPUT} ${formErrors.cantidad ? 'border-red-400' : ''}`}
                />
                {formErrors.cantidad && <p className="text-xs text-red-500 mt-0.5">{formErrors.cantidad}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleReception(showForm)} aria-label={t('entradasAlmacenOC.confirmar_recepcion')}
                  className="flex-1 bg-emerald-600 text-white py-2 rounded text-sm hover:bg-emerald-700 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                  <CheckCircle className="w-4 h-4 inline mr-1" aria-hidden="true" /> {t('entradasAlmacenOC.confirmar_recepcion')}
                </button>
                <button onClick={() => setShowForm(null)} aria-label={t('entradasAlmacenOC.cancelar_recepcion')}
                  className="px-4 py-2 border border-border rounded text-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {t('common.cancelar')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {historialRecepciones.items.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" aria-hidden="true" /> {t('entradasAlmacenOC.historial_titulo', { count: historialRecepciones.items.length })}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label={t('entradasAlmacenOC.historial_titulo', { count: historialRecepciones.items.length })}>
              <thead className="sticky top-0 bg-muted/80">
                <tr>
                  <th className="p-2 text-left text-xs" scope="col">{t('entradasAlmacenOC.col_fecha')}</th>
                  <th className="p-2 text-left text-xs" scope="col">{t('entradasAlmacenOC.col_proveedor')}</th>
                  <th className="p-2 text-left text-xs" scope="col">{t('entradasAlmacenOC.col_material')}</th>
                  <th className="p-2 text-right text-xs" scope="col">{t('entradasAlmacenOC.col_recibido')}</th>
                  <th className="p-2 text-right text-xs" scope="col">{t('entradasAlmacenOC.col_oc')}</th>
                  <th className="p-2 text-right text-xs" scope="col">{t('entradasAlmacenOC.col_diferencia')}</th>
                </tr>
              </thead>
              <tbody>
                {historialRecepciones.items.map(r => (
                  <tr key={r.id} className={`border-t border-border ${r.diferencia < 0 ? 'bg-red-50/60 dark:bg-red-950/20' : 'hover:bg-muted/50'}`}>
                    <td className="p-2 text-xs">{new Date(r.fecha).toLocaleDateString()}</td>
                    <td className="p-2 text-xs">{r.proveedor}</td>
                    <td className="p-2 text-xs">{r.material}</td>
                    <td className="p-2 text-right font-mono text-xs">{r.cantidadRecibida}</td>
                    <td className="p-2 text-right font-mono text-xs">{r.cantidadOC}</td>
                    <td className={`p-2 text-right font-mono text-xs ${r.diferencia < 0 ? 'text-red-600 font-bold' : r.diferencia === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {r.diferencia > 0 ? `${t('entradasAlmacenOC.faltan')}: ${r.diferencia}` : r.diferencia === 0 ? '0' : r.diferencia}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar pagination={historialRecepciones} label={t('entradasAlmacenOC.recepciones')} />
        </div>
      )}

      {ocFiltradas.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
          <p className="text-sm">{t('entradasAlmacenOC.sin_datos')}</p>
        </div>
      )}
    </div>
  );
};

export default EntradasAlmacenOC;