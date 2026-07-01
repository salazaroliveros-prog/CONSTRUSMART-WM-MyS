import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { CARD, INPUT, BUTTON_PRIMARY, BUTTON_DANGER } from '../ui';
import { Modal, message } from 'antd';
import { toast } from 'sonner';
import { Plus, Search, Filter, Calendar, BookOpen, Edit, Trash2, User, Clock, MapPin, Building2, AlertCircle } from 'lucide-react';
import type { BitacoraEntry } from '../store/schemas/calendario';
import { Skeleton } from '@/components/ui/skeleton';

const Bitacora: React.FC = () => {
  const { t } = useTranslation();
  const { bitacora, proyectos, addBitacora, updateBitacora, deleteBitacora, selectedProyectoId } = useErp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BitacoraEntry | null>(null);
  const [formData, setFormData] = useState<Partial<BitacoraEntry>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(false); }, []);

  const filteredBitacora = useMemo(() => {
    return (bitacora || []).filter(entry => {
      const matchesSearch = !searchTerm || 
        entry.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTipo = filterTipo === 'all' || entry.tipo === filterTipo;
      const matchesProyecto = !selectedProyectoId || selectedProyectoId === 'none' || entry.proyectoId === selectedProyectoId;
      
      return matchesSearch && matchesTipo && matchesProyecto;
    });
  }, [bitacora, searchTerm, filterTipo, selectedProyectoId]);

  const stats = useMemo(() => {
    const total = filteredBitacora.length;
    const entriesHoy = filteredBitacora.filter(e => e.fecha === new Date().toISOString().split('T')[0]).length;
    const incidentes = filteredBitacora.filter(e => e.tipo === 'incidente').length;
    const avances = filteredBitacora.filter(e => e.tipo === 'avance').length;
    
    return { total, entriesHoy, incidentes, avances };
  }, [filteredBitacora]);

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

  const handleOpenModal = (entry?: BitacoraEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData(entry);
    } else {
      setEditingEntry(null);
      setFormData({
        titulo: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        tipo: 'general',
        proyectoId: selectedProyectoId || '',
        usuario: '',
        ubicacion: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingEntry) {
        await updateBitacora(editingEntry.id, formData);
        toast.success('Entrada de bitácora actualizada correctamente');
      } else {
        await addBitacora({
          ...formData,
          id: crypto.randomUUID(),
          titulo: formData.titulo || '',
          descripcion: formData.descripcion || '',
          fecha: formData.fecha || new Date().toISOString().split('T')[0],
          tipo: formData.tipo || 'general',
          proyectoId: formData.proyectoId || '',
          usuario: formData.usuario || '',
          ubicacion: formData.ubicacion || '',
        } as BitacoraEntry);
        toast.success('Entrada de bitácora creada correctamente');
      }
      setShowModal(false);
      setEditingEntry(null);
      setFormData({});
    } catch (error) {
      toast.error('Error al guardar entrada de bitácora');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await Modal.confirm({
        title: 'Eliminar Entrada de Bitácora',
        content: '¿Estás seguro de eliminar esta entrada de bitácora?',
        okText: 'Eliminar',
        okType: 'danger',
        cancelText: 'Cancelar',
      });
      await deleteBitacora(id);
      toast.success('Entrada de bitácora eliminada correctamente');
    } catch {
      // User cancelled
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'avance': return 'text-green-500 dark:text-green-400';
      case 'incidente': return 'text-red-500 dark:text-red-400';
      case 'inspeccion': return 'text-blue-500 dark:text-blue-400';
      case 'reunion': return 'text-purple-500 dark:text-purple-400';
      case 'general': return 'text-gray-500 dark:text-gray-400';
      default: return 'text-gray-500';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'avance': return <BookOpen className="w-4 h-4" />;
      case 'incidente': return <AlertCircle className="w-4 h-4" />;
      case 'inspeccion': return <User className="w-4 h-4" />;
      case 'reunion': return <Clock className="w-4 h-4" />;
      case 'general': return <Calendar className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Bitácora de Obra</h1>
          <p className="text-sm text-muted-foreground">Registro diario de actividades y eventos</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className={BUTTON_PRIMARY}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Entrada
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 flex-shrink-0">
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">Hoy</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">{stats.entriesHoy}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground">Incidentes</span>
          </div>
          <div className="text-2xl font-bold text-red-500">{stats.incidentes}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Avances</span>
          </div>
          <div className="text-2xl font-bold text-green-500">{stats.avances}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4 flex-shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por título o descripción..."
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
          <option value="general">General</option>
          <option value="avance">Avance</option>
          <option value="incidente">Incidente</option>
          <option value="inspeccion">Inspección</option>
          <option value="reunion">Reunión</option>
        </select>
      </div>

      {/* Table */}
      <div className={CARD + " flex-1 overflow-hidden flex flex-col"}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Fecha</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Título</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Tipo</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Proyecto</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Usuario</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Ubicación</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredBitacora.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    No hay entradas de bitácora registradas
                  </td>
                </tr>
              ) : (
                filteredBitacora.map((entry) => {
                  const proyecto = proyectos.find(p => p.id === entry.proyectoId);
                  
                  return (
                    <tr key={entry.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3 text-sm text-muted-foreground">{entry.fecha}</td>
                      <td className="p-3 text-sm font-medium">{entry.titulo}</td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-2">
                          {getTipoIcon(entry.tipo)}
                          <span className={`capitalize ${getTipoColor(entry.tipo)}`}>
                            {entry.tipo}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{proyecto?.nombre || '-'}</td>
                      <td className="p-3 text-sm text-muted-foreground">{entry.usuario || '-'}</td>
                      <td className="p-3 text-sm text-muted-foreground">{entry.ubicacion || '-'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(entry)}
                            className="text-blue-500 hover:text-blue-600"
                            aria-label="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
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
        title={editingEntry ? 'Editar Entrada de Bitácora' : 'Nueva Entrada de Bitácora'}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSave}
        okText="Guardar"
        cancelText="Cancelar"
        width={600}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título *</label>
            <input
              type="text"
              value={formData.titulo || ''}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className={INPUT}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción *</label>
            <textarea
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className={INPUT}
              rows={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha *</label>
              <input
                type="date"
                value={formData.fecha || ''}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <select
                value={formData.tipo || 'general'}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                className={INPUT}
              >
                <option value="general">General</option>
                <option value="avance">Avance</option>
                <option value="incidente">Incidente</option>
                <option value="inspeccion">Inspección</option>
                <option value="reunion">Reunión</option>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Usuario</label>
              <input
                type="text"
                value={formData.usuario || ''}
                onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ubicación</label>
              <input
                type="text"
                value={formData.ubicacion || ''}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                className={INPUT}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Bitacora;