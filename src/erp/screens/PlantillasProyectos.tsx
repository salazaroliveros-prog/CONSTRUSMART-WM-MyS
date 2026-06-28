import React, { useEffect, useState, useMemo } from 'react';
import { Modal, message } from 'antd';
import { useErp } from '../store';
import { safeLogger } from '@/lib/safeLogger';
import { fmtQ } from '../utils';
import type { Plantilla } from '../store/schemas/plantillas';
import type { Proyecto } from '../types';
import {
  Plus, X, Copy, Building2, Home, Factory, Building,
  Landmark, Edit, Trash2, Eye, Clock, TrendingUp, Settings,
  Package, CheckCircle, AlertCircle, Layout, BarChart3, Download, Upload, History, GitBranch, Search, ArrowUpDown, List, Grid3x3, Star, FileEdit, CheckSquare2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { z } from 'zod';
import PlantillaAnalytics from '../components/PlantillaAnalytics';
import PlantillasDashboard from '../components/PlantillasDashboard';
import PlantillaEditorModal from '../components/PlantillaEditorModal';
import PlantillaVersionDiff from '../components/PlantillaVersionDiff';

const plantillaFormSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().max(500).optional().default(''),
  categoria: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica']).default('residencial'),
  proyectoOrigenId: z.string().optional().default(''),
  clienteId: z.string().optional().default(''),
  clienteNombre: z.string().optional().default(''),
});

type PlantillaFormData = z.infer<typeof plantillaFormSchema>;

interface VersionComparacion {
  anterior: Plantilla;
  actual: Plantilla;
}

interface VersionHistorialItem {
  version: number;
  fecha: string;
  usuario: string;
  cambios: string;
  snapshot?: any;
}

const CATEGORIAS = [
  { key: 'residencial' as const, label: 'Residencial', icon: Home, color: 'bg-blue-50 border-blue-300', textColor: 'text-blue-600' },
  { key: 'comercial' as const, label: 'Comercial', icon: Building2, color: 'bg-emerald-50 border-emerald-300', textColor: 'text-emerald-600' },
  { key: 'industrial' as const, label: 'Industrial', icon: Factory, color: 'bg-orange-50 border-orange-300', textColor: 'text-orange-600' },
  { key: 'civil' as const, label: 'Civil', icon: Building, color: 'bg-purple-50 border-purple-300', textColor: 'text-purple-600' },
  { key: 'publica' as const, label: 'Pública', icon: Landmark, color: 'bg-rose-50 border-rose-300', textColor: 'text-rose-600' },
] as const;

const PlantillasProyectos: React.FC = () => {
  const { plantillas, proyectos, addPlantilla, updatePlantilla, deletePlantilla, clonarPlantilla, exportarPlantilla, importarPlantilla, crearProyectoDesdePlantilla, crearNuevaVersionPlantilla, restaurarVersionPlantilla, validarIntegridadPlantilla, toggleFavoritoPlantilla } = useErp();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showGlobalDashboard, setShowGlobalDashboard] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<Plantilla | null>(null);
  const [versionesComparar, setVersionesComparar] = useState<VersionComparacion | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPlantilla, setPreviewPlantilla] = useState<Plantilla | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroFavoritas, setFiltroFavoritas] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState<'nombre' | 'fecha' | 'usos' | 'version'>('fecha');
  const [ordenDescendente, setOrdenDescendente] = useState(true);
  const [vistaLista, setVistaLista] = useState(false);
  const [seleccionMultiple, setSeleccionMultiple] = useState<Set<string>>(new Set());
  const [modoSeleccion, setModoSeleccion] = useState(false);
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});//AUTO

  useEffect(() => { setLoading(false); }, []);

  const plantillasFiltradas = useMemo(() => {
    const filtradas = plantillas.filter(p =>
      p.activa &&
      (filtroCategoria === '' || p.categoria === filtroCategoria) &&
      (filtroCliente === '' || p.clienteId === filtroCliente || (!p.clienteId && filtroCliente === 'general')) &&
      (!filtroFavoritas || p.favorita) &&
      (busqueda === '' || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.descripcion && p.descripcion.toLowerCase().includes(busqueda.toLowerCase())))
    );

    const ordenadas = [...filtradas].sort((a, b) => {
      let comparison = 0;
      switch (ordenamiento) {
        case 'nombre':
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case 'fecha':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'usos':
          comparison = (a.usosCount || 0) - (b.usosCount || 0);
          break;
        case 'version':
          comparison = a.version - b.version;
          break;
      }
      return ordenDescendente ? -comparison : comparison;
    });

    return ordenadas;
  }, [plantillas, filtroCategoria, filtroCliente, filtroFavoritas, busqueda, ordenamiento, ordenDescendente]);

  const plantillasDesactualizadas = useMemo(() => {
    const threshold = 90 * 24 * 60 * 60 * 1000;
    return plantillas.filter(p => {
      if (!p.metricas?.ultimaUso) return false;
      const daysSinceUse = Date.now() - new Date(p.metricas.ultimaUso).getTime();
      return daysSinceUse > threshold;
    });
  }, [plantillas]);

  const categoriaInfo = CATEGORIAS.find(c => c.key === formData.categoria) || CATEGORIAS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = plantillaFormSchema.parse(formData);
      if (editingId) {
        updatePlantilla(editingId, validated);
        toast.success('Plantilla actualizada correctamente');
      } else {
        addPlantilla(validated);
        toast.success('Plantilla creada correctamente');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ nombre: '', descripcion: '', categoria: 'residencial', proyectoOrigenId: '', clienteId: '', clienteNombre: '' });
      setFormErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormErrors(prev => { const next = { ...prev }; error.errors.forEach((e: any) => { const f = e.path[0]; if (f) next[f] = e.message; }); return next; });
      }
    }
  };

  const handleEdit = (plantilla: Plantilla) => {
    setEditingId(plantilla.id);
    setFormData({
      nombre: plantilla.nombre,
      descripcion: plantilla.descripcion,
      categoria: plantilla.categoria,
      proyectoOrigenId: plantilla.proyectoOrigenId || '',
      clienteId: plantilla.clienteId || '',
      clienteNombre: plantilla.clienteNombre || '',
    });
    setShowForm(true);
  };

  const handleEditStructure = (plantilla: Plantilla) => {
    setEditingPlantilla(plantilla);
    setShowEditorModal(true);
  };

  const handleSaveStructure = (estructuraData: Partial<Plantilla>) => {
    if (editingPlantilla) {
      updatePlantilla(editingPlantilla.id, estructuraData);
      toast.success('Estructura de plantilla actualizada');
      setShowEditorModal(false);
      setEditingPlantilla(null);
    }
  };

  const toggleSeleccion = (plantillaId: string) => {
    const nuevaSeleccion = new Set(seleccionMultiple);
    if (nuevaSeleccion.has(plantillaId)) {
      nuevaSeleccion.delete(plantillaId);
    } else {
      nuevaSeleccion.add(plantillaId);
    }
    setSeleccionMultiple(nuevaSeleccion);
  };

  const handleSeleccionarTodas = () => {
    if (seleccionMultiple.size === plantillasFiltradas.length) {
      setSeleccionMultiple(new Set());
    } else {
      setSeleccionMultiple(new Set(plantillasFiltradas.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (seleccionMultiple.size === 0) return;
    try {
      await Modal.confirm({
        title: 'Eliminar plantillas',
        content: `¿Eliminar ${seleccionMultiple.size} plantilla${seleccionMultiple.size > 1 ? 's' : ''}?`,
        centered: true,
        okText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        okType: 'danger',
      });
      seleccionMultiple.forEach(id => deletePlantilla(id));
      setSeleccionMultiple(new Set());
      setModoSeleccion(false);
      toast.success(`${seleccionMultiple.size} plantilla${seleccionMultiple.size > 1 ? 's' : ''} eliminada${seleccionMultiple.size > 1 ? 's' : ''}`);
    } catch {}
  };

  const handleBulkExport = () => {
    if (seleccionMultiple.size === 0) return;

    const plantillasSeleccionadas = plantillas.filter(p => seleccionMultiple.has(p.id));
    plantillasSeleccionadas.forEach(p => {
      try {
        const json = exportarPlantilla(p.id);
        if (json) {
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `plantilla-${p.nombre.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        safeLogger.error(new Error('Error exportando plantilla: ' + (error as Error).message));
      }
    });

    setSeleccionMultiple(new Set());
    setModoSeleccion(false);
    toast.success(`${plantillasSeleccionadas.length} plantilla${plantillasSeleccionadas.length > 1 ? 's' : ''} exportada${plantillasSeleccionadas.length > 1 ? 's' : ''}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await Modal.confirm({
        title: 'Eliminar plantilla',
        content: '¿Está seguro de eliminar esta plantilla?',
        centered: true,
        okText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        okType: 'danger',
      });
      deletePlantilla(id);
      toast.success('Plantilla eliminada');
    } catch {}
  };

  const handleClone = (plantilla: Plantilla) => {
    const nuevoNombre = prompt('Nombre para la plantilla clonada:', `${plantilla.nombre} (Copia)`);
    if (nuevoNombre && nuevoNombre.trim()) {
      clonarPlantilla(plantilla.id, nuevoNombre.trim());
      toast.success('Plantilla clonada correctamente');
    }
  };

  const handleExport = (plantilla: Plantilla) => {
    try {
      const json = exportarPlantilla(plantilla.id);
      if (!json) {
        toast.error('Error al exportar plantilla');
        return;
      }

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla-${plantilla.nombre.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Plantilla exportada correctamente');
    } catch (error) {
      toast.error('Error al exportar plantilla');
      safeLogger.error(error);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      if (json) {
        importarPlantilla(json);
        toast.success('Plantilla importada correctamente');
      }
    };
    reader.onerror = () => {
      toast.error('Error al leer el archivo');
    };
    reader.readAsText(file);

    e.target.value = '';
  };

  const handleCrearNuevaVersion = (plantilla: Plantilla) => {
    const cambios = prompt('Describe los cambios de esta nueva versión:');
    if (cambios && cambios.trim()) {
      crearNuevaVersionPlantilla(plantilla.id, cambios.trim());
      toast.success('Nueva versión creada correctamente');
    }
  };

  const handleVerHistorial = (plantilla: Plantilla) => {
    setPreviewPlantilla(plantilla);
    setShowHistorial(true);
  };

  const handleRestaurarVersion = async (version: number) => {
    if (!previewPlantilla) return;
    try {
      await Modal.confirm({
        title: 'Restaurar versión',
        content: `¿Está seguro de restaurar la versión ${version}? Se creará una nueva versión basada en esta restauración.`,
        centered: true,
        okText: 'Sí, restaurar',
        cancelText: 'Cancelar',
        okType: 'primary',
      });
      restaurarVersionPlantilla(previewPlantilla.id, version);
      toast.success('Versión restaurada correctamente');
      setShowHistorial(false);
    } catch {}
  };

  const handlePreview = (plantilla: Plantilla) => {
    setPreviewPlantilla(plantilla);
    setShowPreview(true);
  };

  const handleCrearProyecto = (plantillaId: string) => {
    const plantilla = plantillas.find(p => p.id === plantillaId);
    if (!plantilla) return;

    const validacion = validarIntegridadPlantilla(plantillaId);
    if (!validacion.valido) {
      toast.error('Plantilla tiene errores de integridad', {
        description: validacion.errores.join(', '),
      });
      return;
    }

    const proyectoData: Partial<Proyecto> = {
      nombre: `Nuevo proyecto - ${plantilla.nombre}`,
      tipologia: plantilla.configuracion?.tipologia || 'residencial',
      tipoObra: plantilla.configuracion?.tipoObra || 'nueva',
      moneda: plantilla.configuracion?.moneda || 'GTQ',
      descripcion: plantilla.descripcion,
    };

    crearProyectoDesdePlantilla(plantillaId, proyectoData);
    toast.success('Proyecto creado desde plantilla');
  };

  const handleCrearDesdeProyecto = (proyectoId: string) => {
    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return;

    const nuevaPlantilla: Partial<Plantilla> = {
      nombre: `Plantilla - ${proyecto.nombre}`,
      descripcion: `Creada desde proyecto: ${proyecto.nombre}`,
      categoria: proyecto.tipologia,
      proyectoOrigenId: proyectoId,
      clienteId: proyecto.cliente || '',
      clienteNombre: proyecto.cliente || '',
      configuracion: {
        tipologia: proyecto.tipologia,
        tipoObra: proyecto.tipoObra,
        moneda: proyecto.moneda,
        factorSobrecosto: proyecto.factorSobrecosto,
      },
    };

    addPlantilla(nuevaPlantilla);
    toast.success('Plantilla creada desde proyecto');
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="h-6 w-6" />
            Plantillas de Proyectos
          </h1>
          <p className="text-muted-foreground mt-1">Gestiona plantillas para crear proyectos rápidamente</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGlobalDashboard(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard Global
          </button>
          <button
            onClick={() => setModoSeleccion(!modoSeleccion)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md ${modoSeleccion ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            <CheckSquare2 className="h-4 w-4" />
            {modoSeleccion ? 'Cancelar Selección' : 'Seleccionar'}
          </button>
          <button
            onClick={() => setVistaLista(!vistaLista)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
            title={vistaLista ? 'Vista de cuadrícula' : 'Vista de lista'}
          >
            {vistaLista ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
          <label className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted cursor-pointer">
            <Upload className="h-4 w-4" />
            Importar
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ nombre: '', descripcion: '', categoria: 'residencial', proyectoOrigenId: '', clienteId: '', clienteNombre: '' });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" />
            Nueva Plantilla
          </button>
        </div>
      </div>

      {modoSeleccion && seleccionMultiple.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg animate-in slide-in-from-top">
          <span className="text-sm font-medium">
            {seleccionMultiple.size} seleccionada{seleccionMultiple.size > 1 ? 's' : ''}
          </span>
          <button
            onClick={handleSeleccionarTodas}
            className="text-sm hover:underline"
          >
            {seleccionMultiple.size === plantillasFiltradas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleBulkExport}
              className="flex items-center gap-1 px-3 py-1 bg-white text-primary rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="h-3 w-3" /> Exportar
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            >
              <Trash2 className="h-3 w-3" /> Eliminar
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2 items-center flex-1 min-w-[200px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar plantillas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
              aria-label="Buscar plantillas por nombre o descripción"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Ordenar:</span>
          <select
            value={ordenamiento}
            onChange={(e) => setOrdenamiento(e.target.value as any)}
            className="px-3 py-1 border rounded-md text-sm"
            aria-label="Criterio de ordenamiento"
          >
            <option value="fecha">Fecha</option>
            <option value="nombre">Nombre</option>
            <option value="usos">Usos</option>
            <option value="version">Versión</option>
          </select>
          <button
            onClick={() => setOrdenDescendente(!ordenDescendente)}
            className={`p-1 rounded ${ordenDescendente ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            title={ordenDescendente ? 'Descendente' : 'Ascendente'}
            aria-label={`Orden ${ordenDescendente ? 'descendente' : 'ascendente'}`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Categoría:</span>
          <button
            onClick={() => setFiltroCategoria('')}
            className={`px-3 py-1 rounded-md text-sm ${filtroCategoria === '' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            aria-label="Mostrar todas las categorías"
            role="button"
          >
            Todas
          </button>
          {CATEGORIAS.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFiltroCategoria(cat.key)}
              className={`px-3 py-1 rounded-md text-sm ${filtroCategoria === cat.key ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              aria-label={`Filtrar por categoría ${cat.label}`}
              role="button"
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">Cliente:</span>
          <button
            onClick={() => setFiltroCliente('')}
            className={`px-3 py-1 rounded-md text-sm ${filtroCliente === '' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            aria-label="Mostrar todos los clientes"
            role="button"
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroCliente('general')}
            className={`px-3 py-1 rounded-md text-sm ${filtroCliente === 'general' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            aria-label="Filtrar por plantillas generales"
            role="button"
          >
            General
          </button>
          {Array.from(new Set(plantillas.map(p => p.clienteNombre).filter(Boolean))).slice(0, 5).map(cliente => (
            <button
              key={cliente}
              onClick={() => setFiltroCliente(cliente)}
              className={`px-3 py-1 rounded-md text-sm ${filtroCliente === cliente ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              aria-label={`Filtrar por cliente ${cliente}`}
              role="button"
            >
              {cliente}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFiltroFavoritas(!filtroFavoritas)}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${filtroFavoritas ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted'}`}
          aria-label={filtroFavoritas ? 'Mostrar todas las plantillas' : 'Mostrar solo favoritas'}
          role="button"
        >
          <Star className={`w-4 h-4 ${filtroFavoritas ? 'fill-current' : ''}`} aria-hidden="true" />
          Favoritas
        </button>
      </div>

      {plantillasDesactualizadas.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                {plantillasDesactualizadas.length} plantilla{plantillasDesactualizadas.length > 1 ? 's' : ''} desactualizada{plantillasDesactualizadas.length > 1 ? 's' : ''}
              </div>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                Estas plantillas no se han usado en más de 90 días. Considera revisarlas o actualizarlas.
              </div>
            </div>
          </div>
        </div>
      )}

      {plantillasFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <Layout className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay plantillas</h3>
          <p className="text-muted-foreground mb-4">Crea tu primera plantilla para empezar</p>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ nombre: '', descripcion: '', categoria: 'residencial', proyectoOrigenId: '' });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Crear Plantilla
          </button>
        </div>
      ) : vistaLista ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full" role="table" aria-label="Lista de plantillas">
            <thead className="bg-muted">
              <tr>
                {modoSeleccion && (
                  <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">
                    <input
                      type="checkbox"
                      checked={seleccionMultiple.size === plantillasFiltradas.length && plantillasFiltradas.length > 0}
                      onChange={handleSeleccionarTodas}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">Categoría</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">Usos</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">Versión</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">Creada</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {plantillasFiltradas.map(plantilla => {
                const catInfo = CATEGORIAS.find(c => c.key === plantilla.categoria) || CATEGORIAS[0];
                return (
                  <tr key={plantilla.id} className="border-t hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring" tabIndex={0} role="row">
                    {modoSeleccion && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={seleccionMultiple.has(plantilla.id)}
                          onChange={() => toggleSeleccion(plantilla.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium">{plantilla.nombre}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{plantilla.descripcion || 'Sin descripción'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${catInfo.color} px-2 py-1 rounded text-xs ${catInfo.textColor}`}>
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {plantilla.clienteNombre || <span className="text-muted-foreground">General</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {plantilla.usosCount || 0}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      v{plantilla.version}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(plantilla.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleFavoritoPlantilla(plantilla.id)}
                          className={`p-1 hover:bg-muted rounded ${plantilla.favorita ? 'text-amber-500' : 'text-muted-foreground'}`}
                          title={plantilla.favorita ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        >
                          <Star className={`h-4 w-4 ${plantilla.favorita ? 'fill-current' : ''}`} />
                        </button>
                        <button onClick={() => handlePreview(plantilla)} className="p-1 hover:bg-muted rounded" aria-label={`Ver detalles de ${plantilla.nombre}`}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button onClick={() => handleEdit(plantilla)} className="p-1 hover:bg-muted rounded" aria-label={`Editar ${plantilla.nombre}`}>
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button onClick={() => handleClone(plantilla)} className="p-1 hover:bg-muted rounded text-blue-500 dark:text-blue-400" aria-label={`Clonar ${plantilla.nombre}`}>
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button onClick={() => handleCrearProyecto(plantilla.id)} className="p-1 hover:bg-muted rounded text-emerald-500 dark:text-emerald-400" aria-label={`Crear proyecto desde ${plantilla.nombre}`}>
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button onClick={() => handleDelete(plantilla.id)} className="p-1 hover:bg-muted rounded text-red-500 dark:text-red-400" aria-label={`Eliminar ${plantilla.nombre}`}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantillasFiltradas.map(plantilla => {
            const catInfo = CATEGORIAS.find(c => c.key === plantilla.categoria) || CATEGORIAS[0];
            const Icon = catInfo.icon;
            return (
              <div
                key={plantilla.id}
                className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02] cursor-default relative focus:outline-none focus:ring-2 focus:ring-ring"
                tabIndex={0}
                role="button"
                aria-label={`Plantilla ${plantilla.nombre}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePreview(plantilla);
                  }
                }}
              >
                {modoSeleccion && (
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={seleccionMultiple.has(plantilla.id)}
                      onChange={() => toggleSeleccion(plantilla.id)}
                      className="w-4 h-4 rounded"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${catInfo.color}`}>
                    <Icon className={`h-5 w-5 ${catInfo.textColor}`} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleFavoritoPlantilla(plantilla.id)}
                      className={`p-1 hover:bg-muted rounded transition-colors duration-150 ${plantilla.favorita ? 'text-amber-500' : 'text-muted-foreground'}`}
                      title={plantilla.favorita ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      <Star className={`h-4 w-4 ${plantilla.favorita ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handlePreview(plantilla)}
                      className="p-1 hover:bg-muted rounded transition-colors duration-150"
                      aria-label={`Ver detalles de ${plantilla.nombre}`}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleEdit(plantilla)}
                      className="p-1 hover:bg-muted rounded transition-colors duration-150"
                      aria-label={`Editar ${plantilla.nombre}`}
                      title="Editar datos básicos"
                    >
                      <Edit className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleEditStructure(plantilla)}
                      className="p-1 hover:bg-muted rounded text-indigo-500 dark:text-indigo-400 transition-colors duration-150"
                      aria-label={`Editar estructura de ${plantilla.nombre}`}
                      title="Editar estructura completa"
                    >
                      <FileEdit className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleClone(plantilla)}
                      className="p-1 hover:bg-muted rounded text-blue-500 dark:text-blue-400 transition-colors duration-150"
                      aria-label={`Clonar ${plantilla.nombre}`}
                      title="Clonar"
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleVerHistorial(plantilla)}
                      className="p-1 hover:bg-muted rounded text-purple-500 dark:text-purple-400 transition-colors duration-150"
                      aria-label={`Ver historial de ${plantilla.nombre}`}
                      title="Historial de versiones"
                    >
                      <History className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleCrearNuevaVersion(plantilla)}
                      className="p-1 hover:bg-muted rounded text-orange-500 dark:text-orange-400 transition-colors duration-150"
                      aria-label={`Crear nueva versión de ${plantilla.nombre}`}
                      title="Nueva versión"
                    >
                      <GitBranch className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleExport(plantilla)}
                      className="p-1 hover:bg-muted rounded text-green-500 dark:text-green-400 transition-colors duration-150"
                      aria-label={`Exportar ${plantilla.nombre}`}
                      title="Exportar"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(plantilla.id)}
                      className="p-1 hover:bg-muted rounded text-red-500 dark:text-red-400 transition-colors duration-150"
                      aria-label={`Eliminar ${plantilla.nombre}`}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{plantilla.nombre}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {plantilla.descripcion || 'Sin descripción'}
                </p>
                {plantilla.clienteNombre && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Building2 className="h-3 w-3" />
                    <span>{plantilla.clienteNombre}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(plantilla.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{plantilla.usosCount || 0} usos</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <span className={`${catInfo.color} px-2 py-1 rounded ${catInfo.textColor}`}>
                    {catInfo.label}
                  </span>
                  <span>v{plantilla.version}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{plantilla.estructuraPresupuesto?.length || 0} renglones</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>{plantilla.hitosTemplate?.length || 0} hitos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{plantilla.riesgosTemplate?.length || 0} riesgos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    <span>{plantilla.checklistCalidad?.length || 0} checklist</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCrearProyecto(plantilla.id)}
                  className="w-full mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Copy className="h-4 w-4" />
                  Crear Proyecto
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-background rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ nombre: '', descripcion: '', categoria: 'residencial', proyectoOrigenId: '', clienteId: '', clienteNombre: '' });
                }}
                className="p-1 hover:bg-muted rounded"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cliente (opcional)</label>
                <select
                  value={formData.clienteId}
                  onChange={(e) => {
                    const selectedProject = proyectos.find(p => p.cliente === e.target.value);
                    setFormData({
                      ...formData,
                      clienteId: e.target.value,
                      clienteNombre: selectedProject?.cliente || e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">General (sin cliente específico)</option>
                  {Array.from(new Set(proyectos.map(p => p.cliente).filter(Boolean))).map(cliente => (
                    <option key={cliente} value={cliente}>{cliente}</option>
                  ))}
                </select>
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Crear desde proyecto existente (opcional)</label>
                  <select
                    value={formData.proyectoOrigenId}
                    onChange={(e) => setFormData({ ...formData, proyectoOrigenId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecciona un proyecto...</option>
                    {proyectos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {editingId ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ nombre: '', descripcion: '', categoria: 'residencial', proyectoOrigenId: '', clienteId: '', clienteNombre: '' });
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreview && previewPlantilla && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Vista Previa: {previewPlantilla.nombre}</h2>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewPlantilla(null);
                }}
                className="p-1 hover:bg-muted rounded"
                aria-label="Cerrar vista previa"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4">
              <PlantillaAnalytics plantillaId={previewPlantilla.id} />
              <div>
                <h3 className="font-semibold mb-2">Información General</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Categoría:</span>
                    <span className="ml-2">{previewPlantilla.categoria}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Versión:</span>
                    <span className="ml-2">{previewPlantilla.version}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Usos:</span>
                    <span className="ml-2">{previewPlantilla.usosCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Creada:</span>
                    <span className="ml-2">{new Date(previewPlantilla.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {previewPlantilla.descripcion && (
                <div>
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-sm text-muted-foreground">{previewPlantilla.descripcion}</p>
                </div>
              )}
              {previewPlantilla.configuracion && (
                <div>
                  <h3 className="font-semibold mb-2">Configuración</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipología:</span>
                      <span className="ml-2">{previewPlantilla.configuracion.tipologia}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipo de obra:</span>
                      <span className="ml-2">{previewPlantilla.configuracion.tipoObra}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Moneda:</span>
                      <span className="ml-2">{previewPlantilla.configuracion.moneda}</span>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2">Contenido de la Plantilla</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded p-3">
                    <div className="text-2xl font-bold">{previewPlantilla.estructuraPresupuesto?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Renglones de presupuesto</div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="text-2xl font-bold">{previewPlantilla.hitosTemplate?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Hitos</div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="text-2xl font-bold">{previewPlantilla.riesgosTemplate?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Riesgos predefinidos</div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="text-2xl font-bold">{previewPlantilla.checklistCalidad?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Items de calidad</div>
                  </div>
                </div>
              </div>
              {previewPlantilla.proyectoOrigenId && (
                <div>
                  <h3 className="font-semibold mb-2">Proyecto de Origen</h3>
                  <p className="text-sm text-muted-foreground">
                    {proyectos.find(p => p.id === previewPlantilla.proyectoOrigenId)?.nombre || 'No encontrado'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showHistorial && previewPlantilla && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Historial de Versiones: {previewPlantilla.nombre}</h2>
              <button
                onClick={() => {
                  setShowHistorial(false);
                  setPreviewPlantilla(null);
                }}
                className="p-1 hover:bg-muted rounded"
                aria-label="Cerrar historial"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <GitBranch className="h-4 w-4" />
                <span>Versión actual: {previewPlantilla.version}</span>
              </div>
              {!previewPlantilla.versionHistorial || previewPlantilla.versionHistorial.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay historial de versiones disponible
                </div>
              ) : (
                <div className="space-y-2">
                  {[...previewPlantilla.versionHistorial].reverse().map((historial: VersionHistorialItem) => (
                    <div key={historial.version} className="border rounded p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">v{historial.version}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(historial.fecha).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mb-1">
                            {historial.cambios}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Usuario: {historial.usuario}
                          </div>
                        </div>
                        {historial.version !== previewPlantilla.version && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => restaurarVersionPlantilla(previewPlantilla.id, historial.version)}
                              className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            >
                              Restaurar
                            </button>
                            {historial.snapshot && (
                              <button
                                onClick={() => setVersionesComparar({ anterior: historial.snapshot, actual: previewPlantilla })}
                                className="px-3 py-1 text-xs bg-amber-50 text-amber-600 rounded hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                              >
                                Comparar
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showGlobalDashboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-background rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Dashboard Global de Plantillas</h2>
              <button
                onClick={() => setShowGlobalDashboard(false)}
                className="p-1 hover:bg-muted rounded"
                aria-label="Cerrar dashboard"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <PlantillasDashboard />
          </div>
        </div>
      )}

      {versionesComparar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-background rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Comparación de Versiones</h2>
              <button
                onClick={() => setVersionesComparar(null)}
                className="p-1 hover:bg-muted rounded"
                aria-label="Cerrar comparación"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <PlantillaVersionDiff
              versionAnterior={versionesComparar.anterior}
              versionActual={versionesComparar.actual}
            />
          </div>
        </div>
      )}

      {showEditorModal && editingPlantilla && (
        <PlantillaEditorModal
          plantilla={editingPlantilla}
          onSave={handleSaveStructure}
          onClose={() => {
            setShowEditorModal(false);
            setEditingPlantilla(null);
          }}
        />
      )}
    </div>
  );
};

export default PlantillasProyectos;

