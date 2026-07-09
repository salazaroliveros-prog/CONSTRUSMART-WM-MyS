import React, { useState, useMemo, useEffect } from 'react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { CARD, INPUT, BUTTON_PRIMARY, BUTTON_DANGER } from '../ui';
import { Modal, message } from 'antd';
import { toast } from 'sonner';
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
    solicitud: z.string().min(1, 'Solicitud requerida'),
    proyectoId: z.string().min(1, 'Proyecto requerido'),
    estado: z.enum(['abierto', 'cerrado', 'adjudicado']),
    fechaSolicitud: z.string().min(1, 'Fecha requerida'),
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
      toast.error('Corrige los errores en el formulario');
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
      setEditingCuadro(null);
      setFormData({});
    } catch (error) {
      toast.error(t('cuadros.error_guardar'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await Modal.confirm({
        title: t('cuadros.confirmar_eliminar_titulo'),
        content: t('cuadros.confirmar_eliminar'),
        okText: t('cuadros.eliminar'),
        okType: 'danger',
        cancelText: t('common.cancelar'),
      });
      await deleteCuadro(id);
      toast.success(t('cuadros.eliminado_exito'));
    } catch {
      // User cancelled
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'abierto': return 'text-blue-500 dark:text-blue-400';
      case 'cerrado': return 'text-gray-500 dark:text-gray-400';
      case 'adjudicado': return 'text-green-500 dark:text-green-400';
      default: return 'text-gray-500';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'abierto': return <ClipboardCheck className="w-4 h-4" />;
      case 'cerrado': return <FileText className="w-4 h-4" />;
      case 'adjudicado': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col p-3 sm:p-4 lg:p-5 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('cuadros.titulo')}</h1>
          <p className="text-sm text-muted-foreground">{t('cuadros.subtitulo')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className={BUTTON_PRIMARY}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('cuadros.nuevo_cuadro')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 flex-shrink-0">
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">{t('cuadros.total')}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">{t('cuadros.estado_abierto')}</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">{stats.abiertos}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">{t('cuadros.estado_adjudicado')}</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{stats.adjudicados}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">{t('cuadros.monto_total')}</span>
          </div>
          <div className="text-2xl font-bold text-amber-500">
            Q {(stats.montoTotal / 1000).toFixed(1)}K
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4 flex-shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('cuadros.buscar_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={INPUT}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className={INPUT}
        >
          <option value="all">{t('cuadros.todos_estados')}</option>
          <option value="abierto">{t('cuadros.estado_abierto')}</option>
          <option value="cerrado">{t('cuadros.estado_cerrado')}</option>
          <option value="adjudicado">{t('cuadros.estado_adjudicado')}</option>
        </select>
      </div>

      {/* Table */}
      <div className={CARD + " flex-1 overflow-hidden flex flex-col"}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t('cuadros.columna_solicitud')}</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t('cuadros.columna_proyecto')}</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t('cuadros.columna_estado')}</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t('cuadros.columna_fecha_solicitud')}</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t('cuadros.columna_fecha_cierre')}</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t('cuadros.columna_adjudicado')}</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t('cuadros.columna_cotizaciones')}</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">{t('activos.columna_acciones')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCuadros.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    {t('cuadros.sin_cuadros')}
                  </td>
                </tr>
              ) : (
                filteredCuadros.map((cuadro) => {
                  const proyecto = proyectos.find(p => p.id === cuadro.proyectoId);
                  const proveedorAdjudicado = cuadro.adjudicadoA ? proveedores.find(p => p.id === cuadro.adjudicadoA) : null;
                  const mejorCotizacion = cuadro.cotizaciones?.filter((cot: any) => cot.seleccionada)[0];
                  
                  return (
                    <tr key={cuadro.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3 text-sm font-medium">{cuadro.solicitud}</td>
                      <td className="p-3 text-sm">{proyecto?.nombre || '-'}</td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-2">
                          {getEstadoIcon(cuadro.estado)}
                          <span className={`capitalize ${getEstadoColor(cuadro.estado)}`}>
                            {cuadro.estado}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{cuadro.fechaSolicitud}</td>
                      <td className="p-3 text-sm text-muted-foreground">{cuadro.fechaCierre || '-'}</td>
                      <td className="p-3 text-sm text-muted-foreground">{proveedorAdjudicado?.nombre || '-'}</td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span>{cuadro.cotizaciones?.length || 0}</span>
                          {mejorCotizacion && (
                            <span className="text-green-500 text-xs">
                              (Q {mejorCotizacion.montoTotal.toLocaleString()})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(cuadro)}
                            className="text-blue-500 hover:text-blue-600"
                            aria-label={t('common.editar')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cuadro.id)}
                            className="text-red-500 hover:text-red-600"
                            aria-label={t('common.eliminar')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        title={editingCuadro ? t('cuadros.editar_cuadro') : t('cuadros.nuevo_cuadro')}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSave}
        okText={t('common.guardar')}
        cancelText={t('common.cancelar')}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('cuadros.solicitud_label')}</label>
            <input
              type="text"
              value={formData.solicitud || ''}
              onChange={(e) => { setFormData({ ...formData, solicitud: e.target.value }); setFormErrors(prev => ({ ...prev, solicitud: '' })); }}
              className={INPUT}
            />
            {formErrors.solicitud && <p className="text-xs text-red-500 mt-0.5">{formErrors.solicitud}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium mb-1">{t('cuadros.fecha_solicitud_label')}</label>
            <input
              type="date"
              value={formData.fechaSolicitud || ''}
              onChange={(e) => { setFormData({ ...formData, fechaSolicitud: e.target.value }); setFormErrors(prev => ({ ...prev, fechaSolicitud: '' })); }}
              className={INPUT}
            />
            {formErrors.fechaSolicitud && <p className="text-xs text-red-500 mt-0.5">{formErrors.fechaSolicitud}</p>}
          </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('cuadros.estado_label')}</label>
              <select
                value={formData.estado || 'abierto'}
                onChange={(e) => { setFormData({ ...formData, estado: e.target.value as any }); setFormErrors(prev => ({ ...prev, estado: '' })); }}
                className={INPUT}
              >
                <option value="abierto">{t('cuadros.estado_abierto')}</option>
                <option value="cerrado">{t('cuadros.estado_cerrado')}</option>
                <option value="adjudicado">{t('cuadros.estado_adjudicado')}</option>
              </select>
              {formErrors.estado && <p className="text-xs text-red-500 mt-0.5">{formErrors.estado}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('cuadros.proyecto_label')}</label>
            <select
              value={formData.proyectoId || ''}
              onChange={(e) => { setFormData({ ...formData, proyectoId: e.target.value }); setFormErrors(prev => ({ ...prev, proyectoId: '' })); }}
              className={INPUT}
            >
              <option value="">{t('cuadros.seleccionar_proyecto')}</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            {formErrors.proyectoId && <p className="text-xs text-red-500 mt-0.5">{formErrors.proyectoId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('cuadros.fecha_cierre_label')}</label>
            <input
              type="date"
              value={formData.fechaCierre || ''}
              onChange={(e) => setFormData({ ...formData, fechaCierre: e.target.value })}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('cuadros.adjudicado_label')}</label>
            <select
              value={formData.adjudicadoA || ''}
              onChange={(e) => setFormData({ ...formData, adjudicadoA: e.target.value })}
              className={INPUT}
            >
              <option value="">{t('cuadros.seleccionar_proveedor')}</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('cuadros.observaciones_label')}</label>
            <textarea
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className={INPUT}
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Cuadros;