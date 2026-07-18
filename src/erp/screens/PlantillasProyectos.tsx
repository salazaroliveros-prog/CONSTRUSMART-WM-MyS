import React, { useEffect, useState, useMemo } from 'react';
import { confirmAction } from '@/lib/confirm-action';
import { useErp } from '../store';
import { safeLogger } from '@/lib/safeLogger';
import { fmtQ } from '../utils';
import { useTranslation } from 'react-i18next';
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
import { COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER, COLOR_INFO, COLOR_PRIMARY } from '../ui';
import PlantillaAnalytics from '../components/PlantillaAnalytics';
import PlantillasDashboard from '../components/PlantillasDashboard';
import PlantillaEditorModal from '../components/PlantillaEditorModal';
import PlantillaVersionDiff from '../components/PlantillaVersionDiff';

const plantillaFormSchema = z.object({
  nombre: z.string().min(1, t('plantillas.nombre_requerido')).max(200, t('plantillas.max_caracteres')),
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
  snapshot?: Partial<Plantilla>;
}

const CATEGORIAS = [
  { key: 'residencial' as const, label: t('plantillas.cat_residencial'), icon: Home, color: 'bg-blue-50 border-blue-300', textColor: 'text-blue-600' },
  { key: 'comercial' as const, label: t('plantillas.cat_comercial'), icon: Building2, color: 'bg-emerald-50 border-emerald-300', textColor: 'text-emerald-600' },
  { key: 'industrial' as const, label: t('plantillas.cat_industrial'), icon: Factory, color: 'bg-orange-50 border-orange-300', textColor: 'text-orange-600' },
  { key: 'civil' as const, label: t('plantillas.cat_civil'), icon: Building, color: 'bg-purple-50 border-purple-300', textColor: 'text-blue-600' },
  { key: 'publica' as const, label: t('plantillas.cat_publica'), icon: Landmark, color: 'bg-rose-50 border-rose-300', textColor: 'text-rose-600' },
] as const;

const PlantillasProyectos: React.FC = () => {
  const { t } = useTranslation();
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
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<PlantillaFormData>({
    nombre: '',
    descripcion: '',
    categoria: 'residencial',
    proyectoOrigenId: '',
    clienteId: '',
    clienteNombre: '',
  });

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

  const clientesPlantilla = useMemo(() => Array.from(new Set(plantillas.map(p => p.clienteNombre).filter(Boolean))).slice(0, 5), [plantillas]);
  const clientesProyecto = useMemo(() => Array.from(new Set(proyectos.map(p => p.cliente).filter(Boolean))), [proyectos]);

  const categoriaInfo = CATEGORIAS.find(c => c.key === formData.categoria) || CATEGORIAS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = plantillaFormSchema.parse(formData);
      if (editingId) {
        updatePlantilla(editingId, validated);
        toast.success(t('plantillas.actualizada_correctamente'));
      } else {
        addPlantilla(validated);
        toast.success(t('plantillas.creada_correctamente'));
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ nombre: '', descripcion: '', categoria: 'residencial', proyectoOrigenId: '', clienteId: '', clienteNombre: '' });
      setFormErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFormErrors(prev => { const next = { ...prev }; error.errors.forEach((e) => { const f = e.path[0]; if (f) next[f] = e.message; }); return next; });
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
      toast.success(t('plantillas.estructura_actualizada'));
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
      await confirmAction({
        title: t('plantillas.bulk_delete_titulo', 'Eliminar plantillas'),
        content: t('plantillas.bulk_delete_contenido', { count: seleccionMultiple.size }),
        centered: true,
        okText: t('common.si'),
        cancelText: t('common.cancelar'),
        variant: 'destructive',
      });
      seleccionMultiple.forEach(id => deletePlantilla(id));
      setSeleccionMultiple(new Set());
      setModoSeleccion(false);
      toast.success(t('plantillas.eliminada_exito', { count: seleccionMultiple.size }));
    } catch (error) {
      console.error('Error al eliminar plantillas en lote:', error);
      toast.error(t('plantillas.error_eliminar_lote'));
    }
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
    toast.success(t('plantillas.exportada_exito', { count: plantillasSeleccionadas.length }));
  };

  const handleDelete = async (id: string) => {
    try {
      await confirmAction({
        title: t('plantillas.confirmar_eliminar_titulo', 'Eliminar plantilla'),
        content: t('plantillas.confirmar_eliminar_contenido', '¿Está seguro de eliminar esta plantilla?'),
        centered: true,
        okText: t('common.si'),
        cancelText: t('common.cancelar'),
        variant: 'destructive',
      });
      deletePlantilla(id);
        toast.success(t('plantillas.eliminada'));
    } catch (error) {
      console.error('Error al eliminar plantilla:', error);
      toast.error(t('plantillas.error_eliminar'));
    }
  };

  const handleClone = (plantilla: Plantilla) => {
    const nuevoNombre = prompt(t('plantillas.nombre_clonada', 'Nombre para la plantilla clonada:'), `${plantilla.nombre} (Copia)`);
    if (nuevoNombre && nuevoNombre.trim()) {
      clonarPlantilla(plantilla.id, nuevoNombre.trim());
      toast.success(t('plantillas.clonada'));
    }
  };

  const handleExport = (plantilla: Plantilla) => {
    try {
      const json = exportarPlantilla(plantilla.id);
      if (!json) {
        toast.error(t('plantillas.error_exportar', 'Error al exportar plantilla'));
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

      toast.success(t('plantillas.exportada_correctamente'));
    } catch (error) {
        toast.error(t('plantillas.error_exportar'));
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
        toast.success(t('plantillas.importada'));
      }
    };
    reader.onerror = () => {
      toast.error(t('plantillas.error_leer_archivo', 'Error al leer el archivo'));
    };
    reader.readAsText(file);

    e.target.value = '';
  };

  const handleCrearNuevaVersion = (plantilla: Plantilla) => {
    const cambios = prompt(t('plantillas.nombre_nueva_version', 'Describe los cambios de esta nueva versión:'));
    if (cambios && cambios.trim()) {
      crearNuevaVersionPlantilla(plantilla.id, cambios.trim());
      toast.success(t('plantillas.version_creada'));
    }
  };

  const handleVerHistorial = (plantilla: Plantilla) => {
    setPreviewPlantilla(plantilla);
    setShowHistorial(true);
  };

  const handleRestaurarVersion = async (version: number) => {
    if (!previewPlantilla) return;
    try {
      await confirmAction({
        title: t('plantillas.restaurar_version_titulo', 'Restaurar versión'),
        content: t('plantillas.restaurar_version_contenido', { version }),
        centered: true,
        okText: t('plantillas.restaurar_ok', 'Sí, restaurar'),
        cancelText: t('common.cancelar'),
      });
      restaurarVersionPlantilla(previewPlantilla.id, version);
      toast.success(t('plantillas.version_restaurada'));
      setShowHistorial(false);
    } catch (error) {
      console.error('Error al restaurar versión:', error);
      toast.error(t('plantillas.error_restaurar'));
    }
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
      toast.error(t('plantillas.error_integridad_titulo', 'Plantilla tiene errores de integridad'), {
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
    toast.success(t('plantillas.proyecto_creado'));
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
    toast.success(t('plantillas.creada_desde_proyecto'));
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Layout className="h-6 w-6" />
        {t('plantillas.titulo')}
      </h1>
      <p className="text-muted-foreground mt-1">{t('plantillas.subtitulo')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGlobalDashboard(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
          >
            <BarChart3 className="h-4 w-4" />
            {t('plantillas.dashboard_global_btn')}
          </button>
          <button
            onClick={() => setModoSeleccion(!modoSeleccion)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-md ${modoSeleccion ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            <CheckSquare2 className="h-4 w-4" />
            {modoSeleccion ? t('plantillas.cancelar_seleccion_btn') : t('plantillas.modo_seleccion_btn')}
          </button>
          <button
            onClick={() => setVistaLista(!vistaLista)}
            className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted"
            title={vistaLista ? t('plantillas.vista_cuadricula') : t('plantillas.vista_lista')}
          >
            {vistaLista ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </button>
          <label className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted cursor-pointer">
            <Upload className="h-4 w-4" />
            {t('plantillas.importar_btn', 'Importar')}
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
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" />
            {t('plantillas.nueva_plantilla_btn')}
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
            {seleccionMultiple.size === plantillasFiltradas.length ? t('plantillas.deseleccionar_todas_btn') : t('plantillas.seleccionar_todas_btn')}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleBulkExport}
              className="flex items-center gap-1 px-3 py-1 bg-card text-primary rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="h-3 w-3" /> {t('plantillas.exportar_btn')}
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            >
              <Trash2 className="h-3 w-3" /> {t('plantillas.eliminar_btn')}
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
            placeholder={t('plantillas.buscar_placeholder')}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm"
              aria-label={t('plantillas.buscar_placeholder')}
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label={t('plantillas.limpiar_busqueda_aria')}
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">{t('plantillas.ordenar_label')}</span>
          <select
            value={ordenamiento}
            onChange={(e) => setOrdenamiento(e.target.value as string)}
            className="px-3 py-1 border rounded-md text-sm"
              aria-label={t('plantillas.criterio_orden_aria')}
          >
            <option value="fecha">{t('plantillas.fecha_header')}</option>
            <option value="nombre">{t('plantillas.nombre_header')}</option>
            <option value="usos">{t('plantillas.usos_header')}</option>
            <option value="version">{t('plantillas.version_header')}</option>
          </select>
          <button
            onClick={() => setOrdenDescendente(!ordenDescendente)}
            className={`p-1 rounded ${ordenDescendente ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            title={ordenDescendente ? t('plantillas.orden_descendente') : t('plantillas.orden_ascendente')}
            aria-label={ordenDescendente ? t('plantillas.orden_descendente') : t('plantillas.orden_ascendente')}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">{t('plantillas.categoria_label')}</span>
          <button
            onClick={() => setFiltroCategoria('')}
            className={`px-3 py-1 rounded-md text-sm ${filtroCategoria === '' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            aria-label={t('plantillas.mostrar_todas_categorias_aria')}
            role="button"
          >
            {t('plantillas.todas_cat', 'Todas')}
          </button>
          {CATEGORIAS.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFiltroCategoria(cat.key)}
              className={`px-3 py-1 rounded-md text-sm ${filtroCategoria === cat.key ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              aria-label={t('plantillas.filtrar_por_categoria_aria', { categoria: cat.label })}
              role="button"
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium">{t('plantillas.cliente_label')}</span>
          <button
            onClick={() => setFiltroCliente('')}
            className={`px-3 py-1 rounded-md text-sm ${filtroCliente === '' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            aria-label={t('plantillas.mostrar_todos_clientes_aria')}
            role="button"
          >
            {t('plantillas.todos_clientes', 'Todos')}
          </button>
          <button
            onClick={() => setFiltroCliente('general')}
            className={`px-3 py-1 rounded-md text-sm ${filtroCliente === 'general' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            aria-label={t('plantillas.filtrar_por_cliente_aria', { cliente: 'General' })}
            role="button"
          >
            {t('plantillas.general_clientes', 'General')}
          </button>
          {clientesPlantilla.map(cliente => (
            <button
              key={cliente}
              onClick={() => setFiltroCliente(cliente)}
              className={`px-3 py-1 rounded-md text-sm ${filtroCliente === cliente ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              aria-label={t('plantillas.filtrar_por_cliente_aria', { cliente })}
              role="button"
            >
              {cliente}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFiltroFavoritas(!filtroFavoritas)}
          className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm ${filtroFavoritas ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-muted'}`}
          aria-label={filtroFavoritas ? t('plantillas.mostrar_todas_plantillas_aria') : t('plantillas.mostrar_favoritas_btn')}
          role="button"
        >
          <Star className={`w-4 h-4 ${filtroFavoritas ? 'fill-current' : ''}`} aria-hidden="true" />
          {t('plantillas.favoritas_btn', 'Favoritas')}
        </button>
      </div>

      {plantillasDesactualizadas.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 ${COLOR_WARNING} dark:text-amber-400 flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <div className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                {plantillasDesactualizadas.length} plantilla{plantillasDesactualizadas.length > 1 ? 's' : ''} desactualizada{plantillasDesactualizadas.length > 1 ? 's' : ''}
              </div>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                {t('plantillas.desactualizadas_aviso', 'Estas plantillas no se han usado en más de 90 días. Considera revisarlas o actualizarlas.')}
              </div>
            </div>
          </div>
        </div>
      )}

      {plantillasFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <Layout className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2 truncate" title={t('plantillas.sin_plantillas_titulo')}>{t('plantillas.sin_plantillas_titulo')}</h3>
          <p className="text-muted-foreground mb-4">{t('plantillas.sin_plantillas_desc')}</p>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ nombre: '', descripcion: '', categoria: 'residencial', proyectoOrigenId: '' });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t('plantillas.crear_plantilla_btn')}
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
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">{t('plantillas.nombre_header')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">{t('plantillas.categoria_label')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">{t('plantillas.cliente_label')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">{t('plantillas.usos_header')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">{t('plantillas.version_header')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">{t('plantillas.creada_colon')}</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" scope="col">{t('plantillas.acciones_header')}</th>
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
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{plantilla.descripcion || t('plantillas.sin_descripcion', 'Sin descripción')}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${catInfo.color} px-3 py-1.5 rounded text-xs ${catInfo.textColor}`}>
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {plantilla.clienteNombre || <span className="text-muted-foreground">{t('plantillas.general_sin_cliente_short', 'General')}</span>}
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
                          className={`p-1 hover:bg-muted rounded ${plantilla.favorita ? COLOR_WARNING : 'text-muted-foreground'}`}
                          title={plantilla.favorita ? t('plantillas.quitar_favoritos_title') : t('plantillas.agregar_favoritos_title')}
                        >
                          <Star className={`h-4 w-4 ${plantilla.favorita ? 'fill-current' : ''}`} />
                        </button>
                        <button onClick={() => handlePreview(plantilla)} className="p-1 hover:bg-muted rounded" aria-label={`${t('plantillas.ver_detalles')} ${plantilla.nombre}`}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button onClick={() => handleEdit(plantilla)} className="p-1 hover:bg-muted rounded" aria-label={`${t('plantillas.editar_datos')} ${plantilla.nombre}`}>
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button onClick={() => handleClone(plantilla)} className={`p-1 hover:bg-muted rounded ${COLOR_INFO} dark:text-blue-400`} aria-label={`${t('plantillas.clonar')} ${plantilla.nombre}`}>
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button onClick={() => handleCrearProyecto(plantilla.id)} className={`p-1 hover:bg-muted rounded ${COLOR_SUCCESS} dark:text-emerald-400`} aria-label={`${t('plantillas.crear_proyecto')} ${plantilla.nombre}`}>
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button onClick={() => handleDelete(plantilla.id)} className={`p-1 hover:bg-muted rounded ${COLOR_DANGER} dark:text-red-400`} aria-label={`${t('plantillas.eliminar_btn')} ${plantilla.nombre}`}>
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
                className="border rounded-lg p-4 hover:shadow-sm active:shadow-sm transition-all duration-200 hover:scale-[1.02] cursor-default relative focus:outline-none focus:ring-2 focus:ring-ring"
                tabIndex={0}
                role="button"
                aria-label={`${t('plantillas.plantilla_aria')} ${plantilla.nombre}`}
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
                      className={`p-1 hover:bg-muted rounded transition-colors duration-200 ${plantilla.favorita ? COLOR_WARNING : 'text-muted-foreground'}`}
                      title={plantilla.favorita ? t('plantillas.quitar_favoritos_title') : t('plantillas.agregar_favoritos_title')}
                    >
                      <Star className={`h-4 w-4 ${plantilla.favorita ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handlePreview(plantilla)}
                      className="p-1 hover:bg-muted rounded transition-colors duration-200"
                      aria-label={`${t('plantillas.ver_detalles')} ${plantilla.nombre}`}
                      title={t('plantillas.ver_detalles')}
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleEdit(plantilla)}
                      className="p-1 hover:bg-muted rounded transition-colors duration-200"
                      aria-label={`${t('plantillas.editar_datos')} ${plantilla.nombre}`}
                      title={t('plantillas.editar_datos')}
                    >
                      <Edit className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleEditStructure(plantilla)}
                      className={`p-1 hover:bg-muted rounded ${COLOR_PRIMARY} dark:text-indigo-400 transition-colors duration-200`}
                      aria-label={`${t('plantillas.editar_estructura')} ${plantilla.nombre}`}
                      title={t('plantillas.editar_estructura')}
                    >
                      <FileEdit className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleClone(plantilla)}
                      className={`p-1 hover:bg-muted rounded ${COLOR_INFO} dark:text-blue-400 transition-colors duration-200`}
                      aria-label={`${t('plantillas.clonar')} ${plantilla.nombre}`}
                      title={t('plantillas.clonar')}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleVerHistorial(plantilla)}
                      className={`p-1 hover:bg-muted rounded ${COLOR_PRIMARY} dark:text-purple-400 transition-colors duration-200`}
                      aria-label={`${t('plantillas.ver_historial')} ${plantilla.nombre}`}
                      title={t('plantillas.historial_version')}
                    >
                      <History className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleCrearNuevaVersion(plantilla)}
                      className={`p-1 hover:bg-muted rounded ${COLOR_WARNING} dark:text-orange-400 transition-colors duration-200`}
                      aria-label={`${t('plantillas.nueva_version')} ${plantilla.nombre}`}
                      title={t('plantillas.nueva_version')}
                    >
                      <GitBranch className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleExport(plantilla)}
                      className={`p-1 hover:bg-muted rounded ${COLOR_SUCCESS} dark:text-green-400 transition-colors duration-200`}
                      aria-label={`${t('plantillas.exportar_btn')} ${plantilla.nombre}`}
                      title={t('plantillas.exportar_btn')}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(plantilla.id)}
                      className={`p-1 hover:bg-muted rounded ${COLOR_DANGER} dark:text-red-400 transition-colors duration-200`}
                      aria-label={`${t('plantillas.eliminar_btn')} ${plantilla.nombre}`}
                      title={t('plantillas.eliminar_btn')}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold mb-1">{plantilla.nombre}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {plantilla.descripcion || t('plantillas.sin_descripcion')}
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
                    <span>{plantilla.usosCount || 0} {t('plantillas.usos_label', 'usos')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <span className={`${catInfo.color} px-3 py-1.5 rounded ${catInfo.textColor}`}>
                    {catInfo.label}
                  </span>
                  <span>v{plantilla.version}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span>{plantilla.estructuraPresupuesto?.length || 0} {t('plantillas.renglones_label', 'renglones')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>{plantilla.hitosTemplate?.length || 0} {t('plantillas.hitos_label')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>{plantilla.riesgosTemplate?.length || 0} {t('plantillas.riesgos_label')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    <span>{plantilla.checklistCalidad?.length || 0} {t('plantillas.checklist_label')}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCrearProyecto(plantilla.id)}
                  className="w-full mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 active:scale-95 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Copy className="h-4 w-4" />
                  {t('plantillas.crear_proyecto')}
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
              <h2 className="text-xl font-bold truncate" title={editingId ? t('plantillas.editar_plantilla_titulo') : t('plantillas.nueva_plantilla_titulo')}>
                {editingId ? t('plantillas.editar_plantilla_titulo') : t('plantillas.nueva_plantilla_titulo')}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ nombre: '', descripcion: '', categoria: 'residencial', proyectoOrigenId: '', clienteId: '', clienteNombre: '' });
                }}
                className="p-1 hover:bg-muted rounded"
                aria-label={t('plantillas.cerrar_modal_aria')}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('plantillas.nombre_form_label')}</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
                {formErrors.nombre && <p className="text-xs text-red-500 mt-0.5">{formErrors.nombre}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('plantillas.descripcion_form_label')}</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                />
                {formErrors.descripcion && <p className="text-xs text-red-500 mt-0.5">{formErrors.descripcion}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('plantillas.categoria_form_label')}</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value as string })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
                {formErrors.categoria && <p className="text-xs text-red-500 mt-0.5">{formErrors.categoria}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('plantillas.cliente_form_label')}</label>
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
                  <option value="">{t('plantillas.general_sin_cliente')}</option>
                  {clientesProyecto.map(cliente => (
                    <option key={cliente} value={cliente}>{cliente}</option>
                  ))}
                </select>
                {formErrors.clienteId && <p className="text-xs text-red-500 mt-0.5">{formErrors.clienteId}</p>}
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t('plantillas.crear_desde_proyecto_label')}</label>
                  <select
                    value={formData.proyectoOrigenId}
                    onChange={(e) => setFormData({ ...formData, proyectoOrigenId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">{t('plantillas.selecciona_proyecto_option')}</option>
                    {proyectos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                  {formErrors.proyectoOrigenId && <p className="text-xs text-red-500 mt-0.5">{formErrors.proyectoOrigenId}</p>}
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {editingId ? t('plantillas.actualizar_btn') : t('plantillas.nueva_plantilla_titulo')}
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
                  {t('plantillas.cancelar_btn')}
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
              <h2 className="text-xl font-bold truncate" title={t('plantillas.vista_previa_titulo') + ': ' + previewPlantilla.nombre}>{t('plantillas.vista_previa_titulo')}: {previewPlantilla.nombre}</h2>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewPlantilla(null);
                }}
                className="p-1 hover:bg-muted rounded"
                aria-label={t('plantillas.cerrar_vista_previa_aria')}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4">
              <PlantillaAnalytics plantillaId={previewPlantilla.id} />
              <div>
                <h3 className="font-semibold mb-2 truncate" title="{t('plantillas.info_general_titulo')}">{t('plantillas.info_general_titulo')}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('plantillas.categoria_colon')}</span>
                    <span className="ml-2">{previewPlantilla.categoria}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('plantillas.version_colon')}</span>
                    <span className="ml-2">{previewPlantilla.version}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('plantillas.usos_colon')}</span>
                    <span className="ml-2">{previewPlantilla.usosCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('plantillas.creada_colon')}</span>
                    <span className="ml-2">{new Date(previewPlantilla.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {previewPlantilla.descripcion && (
                <div>
                  <h3 className="font-semibold mb-2 truncate" title="{t('plantillas.descripcion_section')}">{t('plantillas.descripcion_section')}</h3>
                  <p className="text-sm text-muted-foreground">{previewPlantilla.descripcion}</p>
                </div>
              )}
              {previewPlantilla.configuracion && (
                <div>
                  <h3 className="font-semibold mb-2 truncate" title="{t('plantillas.configuracion_section')}">{t('plantillas.configuracion_section')}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('plantillas.tipologia_label')}</span>
                      <span className="ml-2">{previewPlantilla.configuracion.tipologia}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('plantillas.tipo_obra_label')}</span>
                      <span className="ml-2">{previewPlantilla.configuracion.tipoObra}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('plantillas.moneda_label')}</span>
                      <span className="ml-2">{previewPlantilla.configuracion.moneda}</span>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2 truncate" title="{t('plantillas.contenido_section')}">{t('plantillas.contenido_section')}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded p-3">
                  <div className="text-2xl font-bold">{previewPlantilla.estructuraPresupuesto?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">{t('plantillas.renglones_presupuesto')}</div>
                    <div className="text-[10px] text-muted-foreground">{t('plantillas.renglones_ayuda', 'Incluye materiales y mano de obra')}</div>
                  </div>
                  <div className="border rounded p-3">
                  <div className="text-2xl font-bold">{previewPlantilla.hitosTemplate?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">{t('plantillas.hitos_label')}</div>
                    <div className="text-[10px] text-muted-foreground">{t('plantillas.hitos_ayuda', 'Entregables controlados')}</div>
                  </div>
                  <div className="border rounded p-3">
                  <div className="text-2xl font-bold">{previewPlantilla.riesgosTemplate?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">{t('plantillas.riesgos_predefinidos')}</div>
                    <div className="text-[10px] text-muted-foreground">{t('plantillas.riesgos_ayuda', 'Mitigaciones incluidas')}</div>
                  </div>
                  <div className="border rounded p-3">
                    <div className="text-2xl font-bold">{previewPlantilla.checklistCalidad?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">{t('plantillas.items_calidad')}</div>
                  </div>
                </div>
              </div>
              {previewPlantilla.proyectoOrigenId && (
                <div>
                  <h3 className="font-semibold mb-2 truncate" title="{t('plantillas.proyecto_origen_section')}">{t('plantillas.proyecto_origen_section')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {proyectos.find(p => p.id === previewPlantilla.proyectoOrigenId)?.nombre || t('plantillas.no_encontrado')}
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
              <h2 className="text-xl font-bold truncate" title={t('plantillas.historial_titulo') + ': ' + previewPlantilla.nombre}>{t('plantillas.historial_titulo')}: {previewPlantilla.nombre}</h2>
              <button
                onClick={() => {
                  setShowHistorial(false);
                  setPreviewPlantilla(null);
                }}
                className="p-1 hover:bg-muted rounded"
                aria-label={t('plantillas.cerrar_historial_aria')}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <GitBranch className="h-4 w-4" />
                <span>{t('plantillas.version_actual_label', 'Versión actual')}: {previewPlantilla.version}</span>
              </div>
              {!previewPlantilla.versionHistorial || previewPlantilla.versionHistorial.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
                  {t('plantillas.sin_historial_text')}
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
                            {t('plantillas.usuario_label', 'Usuario')}: {historial.usuario}
                          </div>
                        </div>
                        {historial.version !== previewPlantilla.version && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => restaurarVersionPlantilla(previewPlantilla.id, historial.version)}
                              className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            >
                              {t('plantillas.restaurar_boton', 'Restaurar')}
                            </button>
                            {historial.snapshot && (
                              <button
                                onClick={() => setVersionesComparar({ anterior: historial.snapshot, actual: previewPlantilla })}
                                className={`px-3 py-1 text-xs bg-amber-50 ${COLOR_WARNING} rounded hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400`}
                              >
                                {t('plantillas.comparar_boton', 'Comparar')}
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
              <h2 className="text-xl font-bold truncate" title={t('plantillas.dashboard_global')}>{t('plantillas.dashboard_global')}</h2>
              <button
                onClick={() => setShowGlobalDashboard(false)}
                className="p-1 hover:bg-muted rounded"
                aria-label={t('plantillas.cerrar_dashboard_aria')}
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
              <h2 className="text-xl font-bold truncate" title={t('plantillas.comparacion_titulo')}>{t('plantillas.comparacion_titulo')}</h2>
              <button
                onClick={() => setVersionesComparar(null)}
                className="p-1 hover:bg-muted rounded"
                aria-label={t('plantillas.cerrar_comparacion_aria')}
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
