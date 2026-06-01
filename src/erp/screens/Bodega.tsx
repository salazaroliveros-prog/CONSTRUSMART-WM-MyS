import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErp } from '../store';
import { fmtQ, todayISO } from '../utils';
import { Progress, BarChart } from '../components/Charts';
import { Warehouse, Check, X, AlertTriangle, Star, Plus, Trash2, Edit2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { INPUT_COMPACT } from '../ui';

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

const Bodega: React.FC = () => {
  const { materiales, updateMaterial, ordenes, updateOrden, addOrden, proveedores, addProveedor, updateProveedor, deleteProveedor } = useErp();
  const [showProveedor, setShowProveedor] = useState(false);
  const [showOrden, setShowOrden] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const criticos = materiales.filter(m => m.stock < m.stockMinimo);
  const pendientes = ordenes.filter(o => o.estado === 'pendiente');

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
      setEditingProveedor(null);
    } else {
      addProveedor(data);
    }
    resetProv();
    setShowProveedor(false);
  };

  const onAddOrden = (data: OrdenFormData) => {
    addOrden({ ...data, estado: 'borrador', fecha: todayISO() });
    resetOrd();
    setShowOrden(false);
  };

  const editProveedor = (p: { id: string; nombre: string; contacto: string; rubro: string; calificacion: number }) => {
    setEditingProveedor(p.id);
    setValue('nombre', p.nombre);
    setValue('contacto', p.contacto);
    setValue('rubro', p.rubro);
    setValue('calificacion', p.calificacion);
    setShowProveedor(true);
  };

  const pareto = useMemo(() => {
    const sorted = [...materiales].map(m => ({ label: m.nombre.split(' ')[0], value: m.stock * m.precio, color: '#f97316' })).sort((a, b) => b.value - a.value).slice(0, 8);
    return sorted;
  }, [materiales]);

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

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Warehouse className="w-6 h-6 text-cyan-500" /> Bodega, Compras y Proveedores
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setShowOrden(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva</span> OC
          </button>
          <button onClick={() => { setShowProveedor(true); setEditingProveedor(null); }} className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-sm flex items-center gap-1.5 flex-1 sm:flex-none justify-center">
            <Plus className="w-4 h-4" /> Proveedor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-slate-800">{materiales.length}</div>
          <div className="text-xs text-slate-400">Materiales</div>
        </div>
        <div className="bg-red-50 rounded-2xl p-4">
          <div className="text-2xl font-bold text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-5 h-5" />{criticos.length}
          </div>
          <div className="text-xs text-red-400">Stock Bajo Mínimo</div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4">
          <div className="text-2xl font-bold text-amber-600">{pendientes.length}</div>
          <div className="text-xs text-amber-500">OC por Aprobar</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-slate-800">{fmtQ(materiales.reduce((a, m) => a + m.stock * m.precio, 0))}</div>
          <div className="text-xs text-slate-400">Valor Inventario</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-3 border-b">
            <h3 className="font-bold text-slate-700 text-sm">Control de Stock</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {materiales.map(m => {
              const pct = (m.stock / Math.max(m.stockMinimo * 2, 1)) * 100;
              const bajo = m.stock < m.stockMinimo;
              return (
                <div key={m.id} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700">{m.nombre}</span>
                      {m.critico && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">crítico</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="number"
                        value={m.stock}
                        onChange={e => updateMaterial(m.id, { stock: +e.target.value })}
                        className="w-16 px-2 py-1 rounded bg-white text-right"
                      />
                      <span className="text-slate-400">{m.unidad}</span>
                    </div>
                  </div>
                  <Progress value={pct} color={bajo ? '#ef4444' : '#10b981'} />
                  <div className="text-[10px] text-slate-400 mt-1">
                    Mínimo: {m.stockMinimo} {m.unidad} {bajo && <span className="text-red-500 font-semibold">· ¡Reabastecer!</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-slate-700 text-sm mb-2">Pareto 80/20 Inventario</h3>
            <BarChart height={150} data={pareto} />
          </div>

          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-3 border-b">
              <h3 className="font-bold text-slate-700 text-sm">Órdenes por Aprobar</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-56 overflow-y-auto">
              {ordenes.map(o => (
                <div key={o.id} className="p-3 text-xs">
                  <div className="flex justify-between">
                    <b className="text-slate-700">{o.material}</b>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${o.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-600' : o.estado === 'rechazado' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'}`}>
                      {o.estado}
                    </span>
                  </div>
                  <div className="text-slate-400">{o.proveedor} · {o.cantidad} u · {fmtQ(o.monto)}</div>
                  {o.estado === 'pendiente' && (
                    <div className="flex gap-1 mt-1.5">
                      <button onClick={() => updateOrden(o.id, 'aprobado')} className="flex-1 bg-emerald-500 text-white py-1 rounded flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Aprobar
                      </button>
                      <button onClick={() => updateOrden(o.id, 'rechazado')} className="flex-1 bg-red-500 text-white py-1 rounded flex items-center justify-center gap-1">
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

      <div className="bg-white rounded-2xl p-4 shadow-sm mt-4">
        <h3 className="font-bold text-slate-700 text-sm mb-3">Proveedores</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {proveedores.map(p => (
            <div key={p.id} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-slate-700">{p.nombre}</div>
                <div className="text-xs text-slate-400">{p.rubro} · {p.contacto}</div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < p.calificacion ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                ))}
                <button onClick={() => editProveedor(p)} className="ml-1 p-1 text-slate-400 hover:text-orange-500">
                  <Edit2 className="w-3 h-3" />
                </button>
                <button onClick={() => deleteProveedor(p.id)} className="p-1 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showProveedor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowProveedor(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmitProv(onAddProveedor)} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-slate-800">{editingProveedor ? 'Editar' : 'Nuevo'} Proveedor</h2>
              <button type="button" onClick={() => setShowProveedor(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <input {...registerProv('nombre')} placeholder="Nombre" className={`${inp} ${errorsProv.nombre ? 'border-red-500' : ''}`} />
              {errorsProv.nombre && <p className="text-xs text-red-500">{errorsProv.nombre.message}</p>}
              <input {...registerProv('contacto')} placeholder="Contacto" className={`${inp} ${errorsProv.contacto ? 'border-red-500' : ''}`} />
              {errorsProv.contacto && <p className="text-xs text-red-500">{errorsProv.contacto.message}</p>}
              <input {...registerProv('rubro')} placeholder="Rubro" className={`${inp} ${errorsProv.rubro ? 'border-red-500' : ''}`} />
              {errorsProv.rubro && <p className="text-xs text-red-500">{errorsProv.rubro.message}</p>}
              <select {...registerProv('calificacion', { valueAsNumber: true })} className={inp}>
                {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} estrellas</option>)}
              </select>
            </div>
            <button type="submit" className="mt-4 w-full bg-orange-500 text-white py-2.5 rounded-lg font-semibold">
              {editingProveedor ? 'Actualizar' : 'Crear'} Proveedor
            </button>
          </form>
        </div>
      )}

      {showOrden && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOrden(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmitOrd(onAddOrden)} className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-slate-800">Nueva Orden de Compra</h2>
              <button type="button" onClick={() => setShowOrden(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <select {...registerOrd('proveedor')} className={`${inp} ${errorsOrd.proveedor ? 'border-red-500' : ''}`}>
                <option value="">— Seleccionar proveedor —</option>
                {proveedores.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
              <input {...registerOrd('material')} placeholder="Material" className={`${inp} ${errorsOrd.material ? 'border-red-500' : ''}`} />
              <input type="number" {...registerOrd('cantidad')} placeholder="Cantidad" className={`${inp} ${errorsOrd.cantidad ? 'border-red-500' : ''}`} />
              <input type="number" {...registerOrd('monto')} placeholder="Monto Q" className={`${inp} ${errorsOrd.monto ? 'border-red-500' : ''}`} />
            </div>
            <button type="submit" className="mt-4 w-full bg-orange-500 text-white py-2.5 rounded-lg font-semibold">Crear Orden</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Bodega;
