import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErp } from '../store';
import { fmtQ, todayISO } from '../utils';
import { Progress, BarChart } from '../components/Charts';
import ValeSalidaModal from '../components/ValeSalidaModal';
import QRScanner from '../components/QRScanner';
import RecepcionMateriales from '../components/RecepcionMateriales';
import ConteoCiclico from '../components/ConteoCiclico';
import KitsMateriales from '../components/KitsMateriales';
import type { KitMaterial, RecepcionMaterial } from '../types';
import { Warehouse, Check, X, AlertTriangle, Star, Plus, Trash2, Edit2, Search, TrendingUp, DollarSign, Package, Filter, FileText, ClipboardList, Layers, Truck, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { INPUT_COMPACT } from '../ui';
import { toast } from 'sonner';

const proveedorSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  contacto: z.string().min(1, 'Contacto requerido'),
  rubro: z.string().min(1, 'Rubro requerido'),
  calificacion: z.coerce.number().min(0).max(5),
});

const ordenSchema = z.object({
  proveedor: z.string().min(1, 'Proveedor requerido'),
  material: z.string().min(1, 'Material requerido'),
  cantidad: z.coerce.number().min(1, 'Cantidad requerida'),
  monto: z.coerce.number().min(0, 'Monto requerido'),
});

type ProveedorFormData = z.infer<typeof proveedorSchema>;
type OrdenFormData = z.infer<typeof ordenSchema>;

// Límite de monto para aprobación automática (Gerente puede aprobar cualquier monto)
const MONTO_LIMITE_AUTO = 5000;

const Bodega: React.FC = () => {
  const { 
    materiales, updateMaterial, 
    ordenes, updateOrden, addOrden, 
    proveedores, addProveedor, updateProveedor, deleteProveedor,
    user 
  } = useErp();
  
  const [showProveedor, setShowProveedor] = useState(false);
  const [showOrden, setShowOrden] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showValeSalida, setShowValeSalida] = useState(false);
  const [activeTab, setActiveTab] = useState<'stock' | 'recepcion' | 'conteo' | 'kits'>('stock');
  const [stockSearch, setStockSearch] = useState('');
  const [proveedorSearch, setProveedorSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'todos' | 'criticos' | 'bajo'>('todos');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // Alertas de stock crítico
  useEffect(() => {
    const criticosActuales = materiales.filter(m => m.stock < m.stockMinimo);
    criticosActuales.forEach(m => {
      if (!m.critico) {
        toast.warning(`⚠️ Stock crítico: ${m.nombre} (${m.stock} ${m.unidad})`, {
          description: `Mínimo requerido: ${m.stockMinimo} ${m.unidad}. ¡Reabastecer urgente!`,
          duration: 5000,
        });
        updateMaterial(m.id, { critico: true });
      }
    });
    materiales.filter(m => m.critico && m.stock >= m.stockMinimo).forEach(m => {
      updateMaterial(m.id, { critico: false });
      toast.success(`✅ ${m.nombre} reabastecido (${m.stock} ${m.unidad})`);
    });
  }, [materiales, updateMaterial]);

  const criticos = materiales.filter(m => m.stock < m.stockMinimo);
  const pendientes = ordenes.filter(o => o.estado === 'pendiente');

  // Stock filtrado
  const filteredMateriales = useMemo(() => {
    let filtered = materiales;
    if (stockSearch) {
      const q = stockSearch.toLowerCase();
      filtered = filtered.filter(m => m.nombre.toLowerCase().includes(q));
    }
    if (stockFilter === 'criticos') {
      filtered = filtered.filter(m => m.critico);
    } else if (stockFilter === 'bajo') {
      filtered = filtered.filter(m => m.stock < m.stockMinimo);
    }
    return filtered;
  }, [materiales, stockSearch, stockFilter]);

  // Pareto mejorado con % acumulado
  const pareto = useMemo(() => {
    const sorted = [...materiales]
      .map(m => ({ 
        label: m.nombre.split(' ').slice(0, 2).join(' '), 
        value: m.stock * m.precio,
        stock: m.stock,
        unidad: m.unidad,
        critico: m.critico,
        color: m.critico ? '#ef4444' : m.stock < m.stockMinimo ? '#fbbf24' : '#10b981' 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    const total = sorted.reduce((a, b) => a + b.value, 0);
    let acum = 0;
    return sorted.map(item => {
      acum += item.value;
      return {
        ...item,
        pctAcum: total > 0 ? (acum / total) * 100 : 0,
        pctTotal: total > 0 ? (item.value / total) * 100 : 0,
      };
    });
  }, [materiales]);

  const {
    register: registerProv,
    handleSubmit: handleSubmitProv,
    reset: resetProv,
    setValue,
    formState: { errors: errorsProv },
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: { nombre: '', contacto: '', rubro: '', calificacion: 3 },
  });

  const {
    register: registerOrd,
    handleSubmit: handleSubmitOrd,
    reset: resetOrd,
    formState: { errors: errorsOrd },
  } = useForm<OrdenFormData>({
    resolver: zodResolver(ordenSchema),
    defaultValues: { proveedor: '', material: '', cantidad: 1, monto: 0 },
  });

  const onAddProveedor = (data: ProveedorFormData) => {
    if (editingProveedor) {
      updateProveedor(editingProveedor, data);
      toast.success('Proveedor actualizado');
      setEditingProveedor(null);
    } else {
      addProveedor(data);
      toast.success('Proveedor creado');
    }
    resetProv();
    setShowProveedor(false);
  };

  const onAddOrden = (data: OrdenFormData) => {
    addOrden({ ...data, estado: 'borrador', fecha: todayISO() });
    toast.success('Orden de compra creada');
    resetOrd();
    setShowOrden(false);
  };

  const handleAprobarOC = (id: string, monto: number) => {
    // Solo Gerente o Administrador pueden aprobar montos > límite
    if (monto > MONTO_LIMITE_AUTO && user?.rol !== 'Gerente' && user?.rol !== 'Administrador') {
      toast.error('❌ Monto excede límite de aprobación automática. Se requiere aprobación de Gerente.');
      return;
    }
    updateOrden(id, 'aprobado');
    toast.success('✅ Orden aprobada');
  };

  const editProveedor = (p: { id: string; nombre: string; contacto: string; rubro: string; calificacion: number }) => {
    setEditingProveedor(p.id);
    setValue('nombre', p.nombre);
    setValue('contacto', p.contacto);
    setValue('rubro', p.rubro);
    setValue('calificacion', p.calificacion);
    setShowProveedor(true);
  };

  const inp = INPUT_COMPACT;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const totalInventario = materiales.reduce((a, m) => a + m.stock * m.precio, 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Warehouse className="w-6 h-6 text-cyan-500" /> Bodega, Compras y Proveedores
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setShowValeSalida(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
            <ClipboardList className="w-4 h-4" /> <span className="hidden sm:inline">Vale</span> Salida
          </button>
          <button onClick={() => setShowOrden(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva</span> OC
          </button>
          <button onClick={() => { setShowProveedor(true); setEditingProveedor(null); }} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
            <Plus className="w-4 h-4" /> Proveedor
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-cyan-500" />
            <span className="text-xs text-slate-400">Materiales</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{materiales.length}</div>
        </div>
        <div className={`rounded-2xl p-4 border ${criticos.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-4 h-4 ${criticos.length > 0 ? 'text-red-500' : 'text-slate-400'}`} />
            <span className="text-xs text-slate-400">Stock Bajo Mínimo</span>
          </div>
          <div className={`text-2xl font-bold flex items-center gap-1 ${criticos.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {criticos.length}
          </div>
        </div>
        <div className={`rounded-2xl p-4 border ${pendientes.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Filter className={`w-4 h-4 ${pendientes.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className="text-xs text-slate-400">OC por Aprobar</span>
          </div>
          <div className={`text-2xl font-bold ${pendientes.length > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{pendientes.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-slate-400">Valor Inventario</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{fmtQ(totalInventario)}</div>
        </div>
      </div>

      {/* Tabs: Stock / Recepción / Conteo / Kits */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl">
        {([
          { id: 'stock' as const, label: 'Stock', icon: Package },
          { id: 'recepcion' as const, label: 'Recepción', icon: Truck },
          { id: 'conteo' as const, label: 'Conteo', icon: RotateCcw },
          { id: 'kits' as const, label: 'Kits', icon: Layers },
        ]).map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                active
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido por tab */}
      {activeTab === 'recepcion' && <RecepcionMateriales />}
      {activeTab === 'conteo' && <ConteoCiclico />}
      {activeTab === 'kits' && <KitsMateriales />}

      {activeTab === 'stock' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Control de Stock */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
          <div className="p-3 border-b bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-700 text-sm">Control de Stock</h3>
            </div>
            {/* Filtros de stock */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={stockSearch}
                  onChange={e => setStockSearch(e.target.value)}
                  placeholder="Buscar material..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-cyan-400"
                />
              </div>
              <div className="flex gap-1">
                {(['todos', 'criticos', 'bajo'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStockFilter(f)}
                    className={`px-2.5 py-1.5 text-[10px] rounded-lg font-medium transition-colors ${
                      stockFilter === f
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {f === 'todos' ? 'Todos' : f === 'criticos' ? 'Críticos' : 'Stock Bajo'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
            {filteredMateriales.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No se encontraron materiales
              </div>
            ) : filteredMateriales.map(m => {
              const pct = Math.min((m.stock / Math.max(m.stockMinimo * 2, 1)) * 100, 100);
              const bajo = m.stock < m.stockMinimo;
              return (
                <div key={m.id} className="p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-slate-700 truncate">{m.nombre}</span>
                      {m.critico && (
                        <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                          crítico
                        </span>
                      )}
                      {bajo && !m.critico && (
                        <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
                          bajo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <span className="text-slate-400 text-[10px]">Stock:</span>
                      <input
                        type="number"
                        value={m.stock}
                        onChange={e => updateMaterial(m.id, { stock: Math.max(0, +e.target.value) })}
                        placeholder="Stock"
                        className="w-16 px-2 py-1 rounded border border-slate-200 text-right text-xs outline-none focus:border-cyan-400"
                      />
                      <span className="text-slate-400 w-8">{m.unidad}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress value={pct} color={bajo ? '#ef4444' : '#10b981'} />
                    </div>
                    <span className="text-[10px] text-slate-500 w-16 text-right">
                      {fmtQ(m.stock * m.precio)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-slate-400">
                      P.Unit: {fmtQ(m.precio)}/{m.unidad}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Mín: {m.stockMinimo} {m.unidad}
                      {bajo && <span className="text-red-500 font-semibold ml-1">· ¡Reabastecer!</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Pareto + OC */}
        <div className="space-y-4">
          {/* Pareto 80/20 Mejorado */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-slate-700 text-sm">Pareto 80/20 - Top 10</h3>
            </div>
            {pareto.length > 0 ? (
              <div className="space-y-2">
                {/* Línea de % acumulado */}
                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div 
                    className="absolute inset-y-0 left-0 bg-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pareto[0]?.pctAcum || 0, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-center mb-2">
                  {pareto.filter(p => p.pctAcum <= 80).length} materiales = ~80% del valor
                </div>
                <BarChart height={120} data={pareto.map(p => ({
                  label: p.label,
                  value: p.value,
                  color: p.color,
                }))} />
                {/* Tooltip / lista */}
                <div className="space-y-1 mt-2">
                  {pareto.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px] group relative">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                        <span className="text-slate-600 truncate">{p.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-400">{fmtQ(p.value)}</span>
                        <span className="text-slate-300">
                          ({p.pctTotal.toFixed(1)}%)
                        </span>
                        <div className="hidden group-hover:block absolute -top-8 right-0 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
                          Stock: {p.stock} {p.unidad} · {fmtQ(p.value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-4">Sin datos de inventario</div>
            )}
          </div>

          {/* Órdenes por Aprobar */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
            <div className="p-3 border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 text-sm">Órdenes de Compra</h3>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {ordenes.length} total
                </span>
              </div>
              {/* Mini tabs para filtrar OC */}
              <div className="flex gap-1 mt-2">
                {(['todas', 'pendiente', 'aprobado', 'rechazado'] as const).map(estado => (
                  <button
                    key={estado}
                    onClick={() => {/* filtro simplificado */}}
                    className="text-[9px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                  >
                    {estado === 'todas' ? 'Todas' : estado.charAt(0).toUpperCase() + estado.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
              {ordenes.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">
                  <FileText className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  Sin órdenes de compra
                </div>
              ) : ordenes.map(o => (
                <div key={o.id} className="p-3 text-xs hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <b className="text-slate-700 truncate block">{o.material}</b>
                      <div className="text-slate-400 truncate">{o.proveedor}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ml-2 ${
                      o.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-600' : 
                      o.estado === 'rechazado' ? 'bg-red-50 text-red-500' : 
                      o.estado === 'pendiente' ? 'bg-amber-50 text-amber-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {o.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span>{o.cantidad} u</span>
                    <span>·</span>
                    <span>{fmtQ(o.monto)}</span>
                    {o.monto > MONTO_LIMITE_AUTO && (
                      <span className="text-amber-500 font-medium">⚠️ Alta</span>
                    )}
                  </div>
                  {o.estado === 'pendiente' && (
                    <div className="flex gap-1 mt-2">
                      <button 
                        onClick={() => handleAprobarOC(o.id, o.monto)} 
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-1 rounded flex items-center justify-center gap-1 text-[10px] transition-colors"
                      >
                        <Check className="w-3 h-3" /> Aprobar
                      </button>
                      <button 
                        onClick={() => { updateOrden(o.id, 'rechazado'); toast.info('Orden rechazada'); }} 
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 rounded flex items-center justify-center gap-1 text-[10px] transition-colors"
                      >
                        <X className="w-3 h-3" /> Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}


      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-700 text-sm">Proveedores</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={proveedorSearch}
              onChange={e => setProveedorSearch(e.target.value)}
              placeholder="Buscar proveedor..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 outline-none focus:border-cyan-400 w-48"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {proveedores
            .filter(p => !proveedorSearch || p.nombre.toLowerCase().includes(proveedorSearch.toLowerCase()) || p.rubro.toLowerCase().includes(proveedorSearch.toLowerCase()))
            .map(p => (
            <div key={p.id} className="bg-slate-50 hover:bg-slate-100 rounded-xl p-3 flex items-center justify-between transition-colors group">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm text-slate-700 truncate">{p.nombre}</div>
                <div className="text-xs text-slate-400 truncate">{p.rubro}</div>
                <div className="text-[10px] text-slate-400 truncate">{p.contacto}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < p.calificacion ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <button onClick={() => editProveedor(p)} className="ml-1 p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Editar">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={() => { deleteProveedor(p.id); toast.success('Proveedor eliminado'); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Eliminar">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Vale de Salida */}
      <ValeSalidaModal open={showValeSalida} onClose={() => setShowValeSalida(false)} />

      {/* Modal Proveedor */}
      {showProveedor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowProveedor(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmitProv(onAddProveedor)} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-slate-800">{editingProveedor ? 'Editar' : 'Nuevo'} Proveedor</h2>
              <button type="button" onClick={() => setShowProveedor(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="space-y-3">
              <input {...registerProv('nombre')} placeholder="Nombre del proveedor*" className={`${inp} ${errorsProv.nombre ? 'border-red-500' : ''}`} />
              {errorsProv.nombre && <p className="text-xs text-red-500">{errorsProv.nombre.message}</p>}
              <input {...registerProv('contacto')} placeholder="Contacto*" className={`${inp} ${errorsProv.contacto ? 'border-red-500' : ''}`} />
              {errorsProv.contacto && <p className="text-xs text-red-500">{errorsProv.contacto.message}</p>}
              <input {...registerProv('rubro')} placeholder="Rubro*" className={`${inp} ${errorsProv.rubro ? 'border-red-500' : ''}`} />
              {errorsProv.rubro && <p className="text-xs text-red-500">{errorsProv.rubro.message}</p>}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Calificación</label>
                <select {...registerProv('calificacion', { valueAsNumber: true })} className={inp}>
                  {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} estrella{n !== 1 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold transition-colors">
              {editingProveedor ? 'Actualizar' : 'Crear'} Proveedor
            </button>
          </form>
        </div>
      )}

      {/* Modal OC */}
      {showOrden && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOrden(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmitOrd(onAddOrden)} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-slate-800">Nueva Orden de Compra</h2>
              <button type="button" onClick={() => setShowOrden(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Proveedor*</label>
                <select {...registerOrd('proveedor')} className={`${inp} ${errorsOrd.proveedor ? 'border-red-500' : ''}`}>
                  <option value="">— Seleccionar proveedor —</option>
                  {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>
                {errorsOrd.proveedor && <p className="text-xs text-red-500">{errorsOrd.proveedor.message}</p>}
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Material*</label>
                <input {...registerOrd('material')} placeholder="Nombre del material" className={`${inp} ${errorsOrd.material ? 'border-red-500' : ''}`} />
                {errorsOrd.material && <p className="text-xs text-red-500">{errorsOrd.material.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Cantidad*</label>
                  <input type="number" {...registerOrd('cantidad')} placeholder="Cantidad" className={`${inp} ${errorsOrd.cantidad ? 'border-red-500' : ''}`} />
                  {errorsOrd.cantidad && <p className="text-xs text-red-500">{errorsOrd.cantidad.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Monto Q*</label>
                  <input type="number" {...registerOrd('monto')} placeholder="Monto Q" className={`${inp} ${errorsOrd.monto ? 'border-red-500' : ''}`} />
                  {errorsOrd.monto && <p className="text-xs text-red-500">{errorsOrd.monto.message}</p>}
                </div>
              </div>
            </div>
            <button type="submit" className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg font-semibold transition-colors">
              Crear Orden de Compra
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Bodega;