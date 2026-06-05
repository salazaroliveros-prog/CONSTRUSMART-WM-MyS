import React, { useState } from 'react';
import { useNuevosModulos } from '../hooks/useNuevosModulos';
import { useErp } from '../store';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// Zod schema for Centro de Costo
const centroCostoSchema = z.object({
  proyectoId: z.string().min(1, 'Proyecto requerido'),
  codigo: z.string().min(1, 'Código requerido').regex(/^CC-\d{3,}$/, 'Formato: CC-001'),
  nombre: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  presupuestoAsignado: z.coerce.number().min(0, 'Debe ser ≥ 0').max(999_999_999, 'Monto muy alto'),
  tipo: z.enum(['directo', 'indirecto', 'administrativo']),
});

type CentroCostoForm = z.infer<typeof centroCostoSchema>;

export const Administracion: React.FC = () => {
  const { proyectos } = useErp();
  const {
    centrosCosto, addCentroCosto, updateCentroCosto,
    logs, validarPrecioSubrenglon
  } = useNuevosModulos();

  const [tab, setTab] = useState<'centros' | 'logs' | 'validacion'>('centros');
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CentroCostoForm>({
    resolver: zodResolver(centroCostoSchema),
    defaultValues: { proyectoId: '', codigo: '', nombre: '', presupuestoAsignado: 0, tipo: 'directo' },
  });

  const onAddCentroCosto = (data: CentroCostoForm) => {
    addCentroCosto({
      proyectoId: data.proyectoId,
      codigo: data.codigo,
      nombre: data.nombre,
      presupuestoAsignado: data.presupuestoAsignado,
      gastoActual: 0,
      tipo: data.tipo,
    });
    setShowForm(false);
    reset();
  };

  // ---- CENTROS DE COSTO ----
  const renderCentros = () => {
    const totalPresupuesto = centrosCosto.reduce((a, c) => a + c.presupuestoAsignado, 0);
    const totalGasto = centrosCosto.reduce((a, c) => a + c.gastoActual, 0);
    const pctEjecucion = totalPresupuesto > 0 ? (totalGasto / totalPresupuesto) * 100 : 0;

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">🏢 Centros de Costo</h2>
          <button onClick={() => { setShowForm(true); reset(); }}
            className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs">+ Nuevo Centro</button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-xs text-blue-600">Centros</p>
            <p className="text-xl font-bold text-blue-700">{centrosCosto.length}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-xs text-green-600">Presupuesto</p>
            <p className="text-xl font-bold text-green-700">Q{totalPresupuesto.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-center">
            <p className="text-xs text-orange-600">Gasto Actual</p>
            <p className="text-xl font-bold text-orange-700">Q{totalGasto.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <p className="text-xs text-purple-600">Ejecución</p>
            <p className="text-xl font-bold text-purple-700">{pctEjecucion.toFixed(1)}%</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="text-left p-2">Código</th>
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Proyecto</th>
                <th className="text-right p-2">Presupuesto</th>
                <th className="text-right p-2">Gasto Actual</th>
                <th className="text-right p-2">Saldo</th>
                <th className="text-right p-2">Ejec. %</th>
              </tr>
            </thead>
            <tbody>
              {centrosCosto.map((cc, i) => {
                const saldo = cc.presupuestoAsignado - cc.gastoActual;
                const pct = cc.presupuestoAsignado > 0 ? (cc.gastoActual / cc.presupuestoAsignado) * 100 : 0;
                return (
                  <tr key={i} className="border-t hover:bg-slate-50">
                    <td className="p-2 font-mono text-xs">{cc.codigo}</td>
                    <td className="p-2">{cc.nombre}</td>
                    <td className="p-2 text-xs text-slate-500">{proyectos.find(p => p.id === cc.proyectoId)?.nombre || cc.proyectoId}</td>
                    <td className="p-2 text-right">Q{cc.presupuestoAsignado.toLocaleString()}</td>
                    <td className="p-2 text-right">Q{cc.gastoActual.toLocaleString()}</td>
                    <td className={`p-2 text-right font-semibold ${saldo < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      Q{saldo.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${pct > 90 ? 'bg-red-100 text-red-700' : pct > 70 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {pct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ---- LOGS DE AUDITORÍA ----
  const renderLogs = () => (
    <div>
      <h2 className="text-lg font-bold mb-4">📋 Logs de Auditoría</h2>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-100">
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Usuario</th>
              <th className="text-left p-2">Acción</th>
              <th className="text-left p-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i} className="border-t hover:bg-slate-50">
                <td className="p-2 whitespace-nowrap">{l.fecha}</td>
                <td className="p-2">{l.usuario}</td>
                <td className="p-2">{l.accion}</td>
                <td className="p-2 text-slate-500 max-w-xs truncate">{l.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ---- VALIDACIÓN DE PRECIOS ----
  const renderValidacion = () => (
    <div>
      <h2 className="text-lg font-bold mb-4">✅ Validación de Precios en Subrenglones</h2>
      <p className="text-sm text-slate-500 mb-4">
        Verifica que los precios unitarios de los subrenglones estén dentro de rangos razonables (Q1 – Q10,000).
      </p>
      <button onClick={() => {
        const result = validarPrecioSubrenglon();
        toast.info(`Validación completada: ${result.length} precio(s) fuera de rango`);
      }} className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
        🔍 Ejecutar Validación
      </button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-black text-slate-800 mb-4">🔧 Administración del Sistema</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: 'centros' as const, label: '🏢 Centros Costo' },
          { key: 'logs' as const, label: '📋 Auditoría' },
          { key: 'validacion' as const, label: '✅ Validación Precios' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-t text-sm font-medium ${
              tab === t.key ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'centros' && renderCentros()}
      {tab === 'logs' && renderLogs()}
      {tab === 'validacion' && renderValidacion()}

      {/* Modal Centro Costo con Zod validation */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <form onSubmit={handleSubmit(onAddCentroCosto)} onClick={e => e.stopPropagation()} className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="font-bold mb-4">Nuevo Centro de Costo</h3>
            <div className="grid gap-3">
              <div>
                <select {...register('proyectoId')} className={`w-full px-3 py-2 border rounded text-sm ${errors.proyectoId ? 'border-red-500' : ''}`}>
                  <option value="">Seleccionar proyecto</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                {errors.proyectoId && <p className="text-xs text-red-500 mt-1">{errors.proyectoId.message}</p>}
              </div>
              <div>
                <input {...register('codigo')} placeholder="Código (ej: CC-001)" className={`w-full px-3 py-2 border rounded text-sm ${errors.codigo ? 'border-red-500' : ''}`} />
                {errors.codigo && <p className="text-xs text-red-500 mt-1">{errors.codigo.message}</p>}
              </div>
              <div>
                <input {...register('nombre')} placeholder="Nombre del centro de costo" className={`w-full px-3 py-2 border rounded text-sm ${errors.nombre ? 'border-red-500' : ''}`} />
                {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <input {...register('presupuestoAsignado')} type="number" placeholder="Presupuesto asignado Q" className={`w-full px-3 py-2 border rounded text-sm ${errors.presupuestoAsignado ? 'border-red-500' : ''}`} />
                {errors.presupuestoAsignado && <p className="text-xs text-red-500 mt-1">{errors.presupuestoAsignado.message}</p>}
              </div>
              <div>
                <select {...register('tipo')} className="w-full px-3 py-2 border rounded text-sm">
                  <option value="directo">Directo</option>
                  <option value="indirecto">Indirecto</option>
                  <option value="administrativo">Administrativo</option>
                </select>
              </div>
              <button type="submit" className="bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Administracion;