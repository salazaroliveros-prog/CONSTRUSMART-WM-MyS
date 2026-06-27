import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { CARD, INPUT, BUTTON_PRIMARY, BUTTON_DANGER } from '../ui';
import { Modal, message } from 'antd';
import { toast } from 'sonner';
import { Plus, Search, Filter, Package, Wrench, Truck, Settings, Edit, Trash2, Calendar, DollarSign, MapPin, User, CheckCircle, AlertCircle, WrenchIcon } from 'lucide-react';
import type { Activo } from '../store/schemas/gestion';

const Activos: React.FC = () => {
  const { t } = useTranslation();
  const { activos, proyectos, addActivo, updateActivo, deleteActivo, selectedProyectoId } = useErp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingActivo, setEditingActivo] = useState<Activo | null>(null);
  const [formData, setFormData] = useState<Partial<Activo>>({});

  const filteredActivos = useMemo(() => {
    return (activos || []).filter(activo => {
      const matchesSearch = !searchTerm || 
        activo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activo.codigoInventario.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTipo = filterTipo === 'all' || activo.tipo === filterTipo;
      const matchesEstado = filterEstado === 'all' || activo.estado === filterEstado;
      const matchesProyecto = !selectedProyectoId || selectedProyectoId === 'none' || activo.proyectoId === selectedProyectoId;
      
      return matchesSearch && matchesTipo && matchesEstado && matchesProyecto;
    });
  }, [activos, searchTerm, filterTipo, filterEstado, selectedProyectoId]);

  const stats = useMemo(() => {
    const total = filteredActivos.length;
    const disponibles = filteredActivos.filter(a => a.estado === 'disponible').length;
    const asignados = filteredActivos.filter(a => a.estado === 'asignado').length;
    const mantenimiento = filteredActivos.filter(a => a.estado === 'mantenimiento').length;
    const valorTotal = filteredActivos.reduce((sum, a) => sum + a.valorAdquisicion, 0);
    
    return { total, disponibles, asignados, mantenimiento, valorTotal };
  }, [filteredActivos]);

  const handleOpenModal = (activo?: Activo) => {
    if (activo) {
      setEditingActivo(activo);
      setFormData(activo);
    } else {
      setEditingActivo(null);
      setFormData({
        nombre: '',
        codigoInventario: '',
        tipo: 'herramienta',
        estado: 'disponible',
        valorAdquisicion: 0,
        fechaAdquisicion: new Date().toISOString().split('T')[0],
        proyectoId: selectedProyectoId || '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingActivo) {
        await updateActivo(editingActivo.id, formData);
        toast.success('Activo actualizado correctamente');
      } else {
        await addActivo({
          ...formData,
          id: crypto.randomUUID(),
          nombre: formData.nombre || '',
          codigoInventario: formData.codigoInventario || '',
          tipo: formData.tipo || 'herramienta',
          estado: formData.estado || 'disponible',
          valorAdquisicion: formData.valorAdquisicion || 0,
          fechaAdquisicion: formData.fechaAdquisicion || new Date().toISOString().split('T')[0],
          proyectoId: formData.proyectoId || '',
        } as Activo);
        toast.success('Activo creado correctamente');
      }
      setShowModal(false);
      setEditingActivo(null);
      setFormData({});
    } catch (error) {
      toast.error('Error al guardar activo');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await Modal.confirm({
        title: 'Eliminar Activo',
        content: '¿Estás seguro de eliminar este activo?',
        okText: 'Eliminar',
        okType: 'danger',
        cancelText: 'Cancelar',
      });
      await deleteActivo(id);
      toast.success('Activo eliminado correctamente');
    } catch {
      // User cancelled
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'herramienta': return <Wrench className="w-4 h-4" />;
      case 'equipo': return <Settings className="w-4 h-4" />;
      case 'vehiculo': return <Truck className="w-4 h-4" />;
      case 'accesorio': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'text-green-500 dark:text-green-400';
      case 'asignado': return 'text-blue-500 dark:text-blue-400';
      case 'mantenimiento': return 'text-orange-500 dark:text-orange-400';
      case 'baja': return 'text-red-500 dark:text-red-400';
      case 'dado_baja': return 'text-gray-500 dark:text-gray-400';
      default: return 'text-gray-500';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'disponible': return <CheckCircle className="w-4 h-4" />;
      case 'asignado': return <User className="w-4 h-4" />;
      case 'mantenimiento': return <WrenchIcon className="w-4 h-4" />;
      case 'baja':
      case 'dado_baja': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Activos y Herramientas</h1>
          <p className="text-sm text-muted-foreground">Gestión de activos, herramientas y equipos</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className={BUTTON_PRIMARY}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Activo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 flex-shrink-0">
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Disponibles</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{stats.disponibles}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Asignados</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">{stats.asignados}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Valor Total</span>
          </div>
          <div className="text-2xl font-bold text-amber-500">
            Q {(stats.valorTotal / 1000).toFixed(1)}K
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4 flex-shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={INPUT}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className={INPUT}
        >
          <option value="all">Todos los tipos</option>
          <option value="herramienta">Herramientas</option>
          <option value="equipo">Equipos</option>
          <option value="vehiculo">Vehículos</option>
          <option value="accesorio">Accesorios</option>
        </select>
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className={INPUT}
        >
          <option value="all">Todos los estados</option>
          <option value="disponible">Disponible</option>
          <option value="asignado">Asignado</option>
          <option value="mantenimiento">Mantenimiento</option>
          <option value="baja">Baja</option>
          <option value="dado_baja">Dado de Baja</option>
        </select>
      </div>

      {/* Table */}
      <div className={CARD + " flex-1 overflow-hidden flex flex-col"}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Código</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Nombre</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Tipo</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Estado</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Ubicación</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Asignado A</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Valor</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Fecha Adquisición</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivos.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center p-8 text-muted-foreground">
                    No hay activos registrados
                  </td>
                </tr>
              ) : (
                filteredActivos.map((activo) => (
                  <tr key={activo.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 text-sm font-medium">{activo.codigoInventario}</td>
                    <td className="p-3 text-sm">{activo.nombre}</td>
                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-2">
                        {getTipoIcon(activo.tipo)}
                        <span className="capitalize">{activo.tipo}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-2">
                        {getEstadoIcon(activo.estado)}
                        <span className={`capitalize ${getEstadoColor(activo.estado)}`}>
                          {activo.estado.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{activo.ubicacion || '-'}</td>
                    <td className="p-3 text-sm text-muted-foreground">{activo.asignadoA || '-'}</td>
                    <td className="p-3 text-sm font-medium">Q {activo.valorAdquisicion.toLocaleString()}</td>
                    <td className="p-3 text-sm text-muted-foreground">{activo.fechaAdquisicion}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(activo)}
                          className="text-blue-500 hover:text-blue-600"
                          aria-label="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(activo.id)}
                          className="text-red-500 hover:text-red-600"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        title={editingActivo ? 'Editar Activo' : 'Nuevo Activo'}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSave}
        okText="Guardar"
        cancelText="Cancelar"
        width={600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Código de Inventario *</label>
            <input
              type="text"
              value={formData.codigoInventario || ''}
              onChange={(e) => setFormData({ ...formData, codigoInventario: e.target.value })}
              className={INPUT}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <select
                value={formData.tipo || 'herramienta'}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                className={INPUT}
              >
                <option value="herramienta">Herramienta</option>
                <option value="equipo">Equipo</option>
                <option value="vehiculo">Vehículo</option>
                <option value="accesorio">Accesorio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado *</label>
              <select
                value={formData.estado || 'disponible'}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                className={INPUT}
              >
                <option value="disponible">Disponible</option>
                <option value="asignado">Asignado</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="baja">Baja</option>
                <option value="dado_baja">Dado de Baja</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Marca</label>
              <input
                type="text"
                value={formData.marca || ''}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modelo</label>
              <input
                type="text"
                value={formData.modelo || ''}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className={INPUT}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Número de Serie</label>
            <input
              type="text"
              value={formData.numeroSerie || ''}
              onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
              className={INPUT}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor de Adquisición *</label>
              <input
                type="number"
                value={formData.valorAdquisicion || 0}
                onChange={(e) => setFormData({ ...formData, valorAdquisicion: parseFloat(e.target.value) || 0 })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de Adquisición *</label>
              <input
                type="date"
                value={formData.fechaAdquisicion || ''}
                onChange={(e) => setFormData({ ...formData, fechaAdquisicion: e.target.value })}
                className={INPUT}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ubicación</label>
              <input
                type="text"
                value={formData.ubicacion || ''}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Asignado A</label>
              <input
                type="text"
                value={formData.asignadoA || ''}
                onChange={(e) => setFormData({ ...formData, asignadoA: e.target.value })}
                className={INPUT}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Activos;