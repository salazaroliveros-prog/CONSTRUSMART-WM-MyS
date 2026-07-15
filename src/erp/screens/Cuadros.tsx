import React, { useState, useMemo, useEffect } from 'react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { CARD, INPUT, BUTTON_PRIMARY, BUTTON_DANGER } from '../ui';
import { toast } from 'sonner';
import { confirmAction } from '@/lib/confirm-action';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Filter, ClipboardCheck, DollarSign, Calendar, User, Edit, Trash2, CheckCircle, AlertCircle, Building2, FileText } from 'lucide-react';
import type { CuadroComparativo } from '../store/schemas/gestion';
import { Skeleton } from '@/components/ui/skeleton';

const Cuadros: React.FC = () => {
  const { t } = useTranslation();
  const { cuadros, proyectos, proveedores, addCuadro, updateCuadro, deleteCuadro, currentProjectId, cotizacionesNegocio } = useErp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCuadro, setEditingCuadro] = useState<CuadroComparativo | null>(null);
  const [formData, setFormData] = useState<Partial<CuadroComparativo>>({});
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const cuadroSchema = z.object({
    solicitud: z.string().min(1, t('cuadros.solicitud_requerida', 'Solicitud requerida')),
    proyectoId: z.string().min(1, t('cuadros.proyecto_requerido', 'Proyecto requerido')),
    estado: z.enum(['abierto', 'cerrado', 'adjudicado']),
    fechaSolicitud: z.string().min(1, t('cuadros.fecha_requerida', 'Fecha requerida')),
    adjudicadoA: z.string().optional().default(''),
    observaciones: z.string().optional().default(''),
  });

  useEffect(() => { setLoading(false); }, []);

  const filteredCuadros = useMemo(() => {
    return (cuadros || []).filter(cuadro => {
      const matchesSearch = !searchTerm || 
        cuadro.solicitud.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEstado = filterEstado === 'all' || cuadro.estado === filterEstado;
      const matchesProyecto = !currentProjectId || currentProjectId === 'none' || cuadro.proyectoId === currentProjectId;
      
      return matchesSearch && matchesEstado && matchesProyecto;
    });
  }, [cuadros, searchTerm, filterEstado, currentProjectId]);

  const stats = useMemo(() => {
    const total = filteredCuadros.length;
    const abiertos = filteredCuadros.filter(c => c.estado === 'abierto').length;
    const cerrados = filteredCuadros.filter(c => c.estado === 'cerrado').length;
    const adjudicados = filteredCuadros.filter(c => c.estado === 'adjudicado').length;
    const montoTotal = filteredCuadros.reduce((sum, c) => {
      const mejorCotizacion = c.cotizaciones?.filter((cot: any) => cot.seleccionada)[0];
      return sum + (mejorCotizacion?.montoTotal || 0);
    }, 0);
    
    return { total, abiertos, cerrados, adjudicados, montoTotal };
  }, [filteredCuadros]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const handleOpenModal = (cuadro?: CuadroComparativo) => {
    setFormErrors({});
    if (cuadro) {
      setEditingCuadro(cuadro);
      setFormData(cuadro);
    } else {
      setEditingCuadro(null);
      setFormData({
        solicitud: '',
        fechaSolicitud: new Date().toISOString().split('T')[0],
        estado: 'abierto',
        proyectoId: currentProjectId || '',
        cotizaciones: [],
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    const validation = cuadroSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      toast.error(t('cuadros.error_formulario', 'Corrige los errores en el formulario'));
      return;
    }
    setFormErrors({});
    try {
      if (editingCuadro) {
        await updateCuadro(editingCuadro.id, formData);
        toast.success(t('cuadros.actualizado_exito'));
      } else {
        await addCuadro({
          ...formData,
          id: crypto.randomUUID(),
          solicitud: formData.solicitud || '',
          fechaSolicitud: formData.fechaSolicitud || new Date().toISOString().split('T')[0],
          estado: formData.estado || 'abierto',
          proyectoId: formData.proyectoId || '',
          cotizaciones: formData.cotizaciones || [],
        } as CuadroComparativo);
        toast.success(t('cuadros.creado_exito'));
      }
      setShowModal(false);
      setFormData({});
      setEditingCuadro(null);
    } catch (error) {
      toast.error(t('common.error', 'Error'));
    }
  };

  const handleDelete = async (id: string) => {
    await confirmAction({
      title: t('cuadros.confirmar_eliminar'),
      content: t('cuadros.confirmar_eliminar_msg'),
      okText: t('common.si'),
      cancelText: t('common.cancelar'),
      variant: 'destructive',
    });
    deleteCuadro(id);
    toast.success(t('cuadros.eliminado_exito'));
  };

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      abierto: 'bg-blue-50 text-blue-600',
      cerrado: 'bg-gray-50 text-gray-600',
      adjudicado: 'bg-emerald-50 text-emerald-600',
    };
    return map[estado] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> {t('cuadros.titulo')}
          </h1>
          <p className="text-xs text-muted-foreground">{t('cuadros.descripcion')}</p>
        </div>
        <button onClick={() => handleOpenModal()} className={`${BUTTON_PRIMARY} flex items-center gap-2`}>
          <Plus className="w-4 h-4" /> {t('cuadros.nuevo')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="text-xs text-muted-foreground">{t('cuadros.total')}</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50 p-4">
          <div className="text-xs text-blue-600">{t('cuadros.abiertos')}</div>
          <div className="text-2xl font-bold text-blue-700">{stats.abiertos}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-950/40 rounded-xl border border-gray-100 dark:border-gray-900/50 p-4">
          <div className="text-xs text-gray-600">{t('cuadros.cerrados')}</div>
          <div className="text-2xl font-bold text-gray-700">{stats.cerrados}</div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50 p-4">
          <div className="text-xs text-emerald-600">{t('cuadros.adjudicados')}</div>
          <div className="text-2xl font-bold text-emerald-700">{stats.adjudicados}</div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-sm">{t('cuadros.lista')}</h3>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                placeholder={t('cuadros.buscar')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${INPUT} pl-9 text-sm`}
                aria-label={t('cuadros.buscar')}
              />
            </div>
            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className={`${INPUT} text-sm`}>
              <option value="all">{t('cuadros.todos_estados')}</option>
              <option value="abierto">{t('cuadros.abierto')}</option>
              <option value="cerrado">{t('cuadros.cerrado')}</option>
              <option value="adjudicado">{t('cuadros.adjudicado')}</option>
            </select>
          </div>
        </div>

        {filteredCuadros.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
            <p className="text-sm">{t('cuadros.sin_cuadros')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label={t('cuadros.titulo')}>
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left p-2" scope="col">{t('cuadros.col_solicitud')}</th>
                <th className="text-left p-2" scope="col">{t('cuadros.col_proyecto')}</th>
                <th className="text-left p-2" scope="col">{t('cuadros.col_fecha')}</th>
                <th className="text-center p-2" scope="col">{t('cuadros.col_estado')}</th>
                <th className="text-right p-2" scope="col">{t('cuadros.col_monto')}</th>
                <th className="text-right p-2" scope="col">{t('common.acciones')}</th>
              </tr></thead>
              <tbody>
                {filteredCuadros.map(c => {
                  const proyecto = proyectos.find(p => p.id === c.proyectoId);
                  const mejorCot = c.cotizaciones?.filter((cot: any) => cot.seleccionada)[0];
                  return (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-2 font-medium truncate" title={c.solicitud}>{c.solicitud}</td>
                      <td className="p-2 text-muted-foreground truncate" title={proyecto?.nombre || '-'}>{proyecto?.nombre || '-'}</td>
                      <td className="p-2 text-muted-foreground truncate">{c.fechaSolicitud}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${estadoBadge(c.estado)}`}>
                          {t(`cuadros.estado_${c.estado}`)}
                        </span>
                      </td>
                      <td className="p-2 text-right font-medium">{mejorCot ? fmtQ(mejorCot.montoTotal) : '-'}</td>
                      <td className="p-2 text-right">
                        <button onClick={() => handleOpenModal(c)} className="p-1.5 rounded hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${t('common.editar')} ${c.solicitud}`}><Edit className="w-4 h-4" aria-hidden="true" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-accent text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400" aria-label={`${t('common.eliminar')} ${c.solicitud}`}><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Dialog open={showModal} onOpenChange={(open) => { if (!open) { setShowModal(false); setFormData({}); setEditingCuadro(null); } }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCuadro ? t('cuadros.editar') : t('cuadros.nuevo')}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cuadros.solicitud')}</label>
                <input value={formData.solicitud || ''} onChange={e => setFormData(p => ({ ...p, solicitud: e.target.value }))} className={`${INPUT} ${formErrors.solicitud ? 'border-red-400' : ''}`} />
                {formErrors.solicitud && <p className="text-xs text-red-500 mt-0.5">{formErrors.solicitud}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cuadros.proyecto')}</label>
                <select value={formData.proyectoId || ''} onChange={e => setFormData(p => ({ ...p, proyectoId: e.target.value }))} className={`${INPUT} ${formErrors.proyectoId ? 'border-red-400' : ''}`}>
                  <option value="">{t('cuadros.seleccionar_proyecto')}</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                {formErrors.proyectoId && <p className="text-xs text-red-500 mt-0.5">{formErrors.proyectoId}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cuadros.fecha_solicitud')}</label>
                <input type="date" value={formData.fechaSolicitud || ''} onChange={e => setFormData(p => ({ ...p, fechaSolicitud: e.target.value }))} className={`${INPUT} ${formErrors.fechaSolicitud ? 'border-red-400' : ''}`} />
                {formErrors.fechaSolicitud && <p className="text-xs text-red-500 mt-0.5">{formErrors.fechaSolicitud}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cuadros.estado')}</label>
                <select value={formData.estado || 'abierto'} onChange={e => setFormData(p => ({ ...p, estado: e.target.value as any }))} className={INPUT}>
                  <option value="abierto">{t('cuadros.estado_abierto')}</option>
                  <option value="cerrado">{t('cuadros.estado_cerrado')}</option>
                  <option value="adjudicado">{t('cuadros.estado_adjudicado')}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t('cuadros.observaciones')}</label>
                <textarea value={formData.observaciones || ''} onChange={e => setFormData(p => ({ ...p, observaciones: e.target.value }))} className={`${INPUT} min-h-[80px]`} />
              </div>
            </div>

            <DialogFooter>
              <button type="button" onClick={() => { setShowModal(false); setFormData({}); setEditingCuadro(null); }} className={BUTTON_DANGER}>{t('common.cancelar')}</button>
              <button type="button" onClick={handleSave} className={BUTTON_PRIMARY}>{editingCuadro ? t('common.editar') : t('cuadros.crear')}</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Cuadros;