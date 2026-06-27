import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { CARD, INPUT, BUTTON_PRIMARY, BUTTON_DANGER } from '../ui';
import { Modal, message } from 'antd';
import { toast } from 'sonner';
import { Plus, Search, Filter, ClipboardCheck, DollarSign, Calendar, User, Edit, Trash2, CheckCircle, AlertCircle, Building2, FileText } from 'lucide-react';
import type { CuadroComparativo } from '../store/schemas/gestion';

const Cuadros: React.FC = () => {
  const { t } = useTranslation();
  const { cuadros, proyectos, proveedores, addCuadro, updateCuadro, deleteCuadro, selectedProyectoId, cotizacionesNegocio } = useErp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCuadro, setEditingCuadro] = useState<CuadroComparativo | null>(null);
  const [formData, setFormData] = useState<Partial<CuadroComparativo>>({});

  const filteredCuadros = useMemo(() => {
    return (cuadros || []).filter(cuadro => {
      const matchesSearch = !searchTerm || 
        cuadro.solicitud.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesEstado = filterEstado === 'all' || cuadro.estado === filterEstado;
      const matchesProyecto = !selectedProyectoId || selectedProyectoId === 'none' || cuadro.proyectoId === selectedProyectoId;
      
      return matchesSearch && matchesEstado && matchesProyecto;
    });
  }, [cuadros, searchTerm, filterEstado, selectedProyectoId]);

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

  const handleOpenModal = (cuadro?: CuadroComparativo) => {
    if (cuadro) {
      setEditingCuadro(cuadro);
      setFormData(cuadro);
    } else {
      setEditingCuadro(null);
      setFormData({
        solicitud: '',
        fechaSolicitud: new Date().toISOString().split('T')[0],
        estado: 'abierto',
        proyectoId: selectedProyectoId || '',
        cotizaciones: [],
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingCuadro) {
        await updateCuadro(editingCuadro.id, formData);
        toast.success('Cuadro actualizado correctamente');
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
        toast.success('Cuadro creado correctamente');
      }
      setShowModal(false);
      setEditingCuadro(null);
      setFormData({});
    } catch (error) {
      toast.error('Error al guardar cuadro');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await Modal.confirm({
        title: 'Eliminar Cuadro Comparativo',
        content: '¿Estás seguro de eliminar este cuadro comparativo?',
        okText: 'Eliminar',
        okType: 'danger',
        cancelText: 'Cancelar',
      });
      await deleteCuadro(id);
      toast.success('Cuadro eliminado correctamente');
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
    <div className="h-full flex flex-col p-4 sm:p-6 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Cuadros Comparativos</h1>
          <p className="text-sm text-muted-foreground">Análisis comparativo de cotizaciones</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className={BUTTON_PRIMARY}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cuadro
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 flex-shrink-0">
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Abiertos</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">{stats.abiertos}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Adjudicados</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{stats.adjudicados}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Monto Total</span>
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
            placeholder="Buscar por solicitud..."
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
          <option value="all">Todos los estados</option>
          <option value="abierto">Abierto</option>
          <option value="cerrado">Cerrado</option>
          <option value="adjudicado">Adjudicado</option>
        </select>
      </div>

      {/* Table */}
      <div className={CARD + " flex-1 overflow-hidden flex flex-col"}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Solicitud</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Proyecto</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Estado</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Fecha Solicitud</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Fecha Cierre</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Adjudicado A</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Cotizaciones</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCuadros.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    No hay cuadros comparativos registrados
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
                            aria-label="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cuadro.id)}
                            className="text-red-500 hover:text-red-600"
                            aria-label="Eliminar"
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
        title={editingCuadro ? 'Editar Cuadro Comparativo' : 'Nuevo Cuadro Comparativo'}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSave}
        okText="Guardar"
        cancelText="Cancelar"
        width={600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Solicitud *</label>
            <input
              type="text"
              value={formData.solicitud || ''}
              onChange={(e) => setFormData({ ...formData, solicitud: e.target.value })}
              className={INPUT}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de Solicitud *</label>
              <input
                type="date"
                value={formData.fechaSolicitud || ''}
                onChange={(e) => setFormData({ ...formData, fechaSolicitud: e.target.value })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado *</label>
              <select
                value={formData.estado || 'abierto'}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                className={INPUT}
              >
                <option value="abierto">Abierto</option>
                <option value="cerrado">Cerrado</option>
                <option value="adjudicado">Adjudicado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Proyecto</label>
            <select
              value={formData.proyectoId || ''}
              onChange={(e) => setFormData({ ...formData, proyectoId: e.target.value })}
              className={INPUT}
            >
              <option value="">Seleccionar proyecto</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de Cierre</label>
            <input
              type="date"
              value={formData.fechaCierre || ''}
              onChange={(e) => setFormData({ ...formData, fechaCierre: e.target.value })}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Adjudicado A</label>
            <select
              value={formData.adjudicadoA || ''}
              onChange={(e) => setFormData({ ...formData, adjudicadoA: e.target.value })}
              className={INPUT}
            >
              <option value="">Seleccionar proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observaciones</label>
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