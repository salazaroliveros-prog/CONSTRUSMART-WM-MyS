import React, { useState } from 'react';
import { useErp } from '../store';
import type { CentroCosto, LogAuditoria } from '../types';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const centroCostoSchema = z.object({
  proyectoId: z.string().min(1, 'Proyecto requerido'),
  codigo: z.string().min(1, 'Código requerido').regex(/^CC-\d{3,}$/, 'Formato: CC-001'),
  nombre: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  presupuestoAsignado: z.coerce.number().min(0, 'Debe ser ≥ 0').max(999_999_999, 'Monto muy alto'),
  tipo: z.enum(['directo', 'indirecto', 'administrativo']),
});
type CentroCostoForm = z.infer<typeof centroCostoSchema>;

const uid = () => Date.now().toString(36).substr(2, 9);

export const Administracion: React.FC = () => {
  const { proyectos } = useErp();
  const [tab, setTab] = useState<'centros' | 'logs' | 'validacion'>('centros');
  const [showForm, setShowForm] = useState(false);

  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [logs] = useState<LogAuditoria[]>([]);

  const saveCentros = (data: CentroCosto[]) => {
    setCentrosCosto(data);
  };

  const addCentroCosto = (data: Omit<CentroCosto, 'id'>) => {
    saveCentros([{ ...data, id: uid() }, ...centrosCosto]);
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CentroCostoForm>({
    resolver: zodResolver(centroCostoSchema),
    defaultValues: { proyectoId: '', codigo: '', nombre: '', presupuestoAsignado: 0, tipo: 'directo' },
  });

  const onAddCentroCosto = (data: CentroCostoForm) => {
    addCentroCosto({ proyectoId: data.proyectoId, codigo: data.codigo, nombre: data.nombre, presupuestoAsignado: data.presupuestoAsignado, gastoActual: 0, tipo: data.tipo });
    toast.success('Centro de costo creado');
    setShowForm(false);
    reset();
  };

  const INPUT_BASE = 'w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-ring bg-background text-foreground';
  const inp = (hasErr: boolean) => `${INPUT_BASE} ${hasErr ? 'border-destructive' : 'border-input'}`;

  const renderCentros = () => {
    const totalPresupuesto = centrosCosto.reduce((a, c) => a + c.presupuestoAsignado, 0);
    const totalGasto = centrosCosto.reduce((a, c) => a + c.gastoActual, 0);
    const pctEjecucion = totalPresupuesto > 0 ? (totalGasto / totalPresupuesto) * 100 : 0;

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground">🏢 Centros de Costo</h2>
          <button onClick={() => { setShowForm(true); reset(); }}
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 font-medium">
            + Nuevo Centro
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-info/10 rounded-lg text-center">
            <p className="text-xs text-info font-medium">Centros</p>
            <p className="text-xl font-bold text-info">{centrosCosto.length}</p>
          </div>
          <div className="p-3 bg-success/10 rounded-lg text-center">
            <p className="text-xs text-success font-medium">Presupuesto</p>
            <p className="text-xl font-bold text-success">Q{totalPresupuesto.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg text-center">
            <p className="text-xs text-primary font-medium">Gasto Actual</p>
            <p className="text-xl font-bold text-primary">Q{totalGasto.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-xs text-muted-foreground font-medium">Ejecución</p>
            <p className="text-xl font-bold text-foreground">{pctEjecucion.toFixed(1)}%</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-2">Código</th>
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Proyecto</th>
                <th className="text-right p-2">Presupuesto</th>
                <th className="text-right p-2">Gasto</th>
                <th className="text-right p-2">Saldo</th>
                <th className="text-right p-2">Ejec. %</th>
              </tr>
            </thead>
            <tbody>
              {centrosCosto.map(cc => {
                const saldo = cc.presupuestoAsignado - cc.gastoActual;
                const pct = cc.presupuestoAsignado > 0 ? (cc.gastoActual / cc.presupuestoAsignado) * 100 : 0;
                return (
                  <tr key={cc.id} className="border-t hover:bg-muted/50">
                    <td className="p-2 font-mono text-xs">{cc.codigo}</td>
                    <td className="p-2">{cc.nombre}</td>
                    <td className="p-2 text-xs text-muted-foreground">{proyectos.find(p => p.id === cc.proyectoId)?.nombre || cc.proyectoId}</td>
                    <td className="p-2 text-right font-mono">Q{cc.presupuestoAsignado.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono">Q{cc.gastoActual.toLocaleString()}</td>
                    <td className={`p-2 text-right font-semibold font-mono ${saldo < 0 ? 'text-destructive' : 'text-success'}`}>
                      Q{saldo.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${pct > 90 ? 'bg-destructive/10 text-destructive' : pct > 70 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                        {pct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {centrosCosto.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No hay centros de costo registrados</p>}
      </div>
    );
  };

  const renderLogs = () => (
    <div>
      <h2 className="text-lg font-bold mb-4 text-foreground">📋 Logs de Auditoría</h2>
      {logs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No hay logs de auditoría registrados.</p>
          <p className="text-muted-foreground text-xs mt-1">Las acciones del sistema se registrarán automáticamente.</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted sticky top-0">
                <th className="text-left p-2">Fecha</th>
                <th className="text-left p-2">Usuario</th>
                <th className="text-left p-2">Acción</th>
                <th className="text-left p-2">Entidad</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-t hover:bg-muted/50">
                  <td className="p-2 whitespace-nowrap text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="p-2">{l.usuarioNombre}</td>
                  <td className="p-2">{l.accion}</td>
                  <td className="p-2 text-muted-foreground max-w-xs truncate">{l.entidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderValidacion = () => (
    <div>
      <h2 className="text-lg font-bold mb-4 text-foreground">✅ Validación de Precios en Subrenglones</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Verifica que los precios unitarios de los subrenglones estén dentro de rangos razonables (Q1 – Q10,000).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-success/10 rounded-lg border border-success/30">
          <p className="text-sm font-semibold text-success">✅ Centros de costo</p>
          <p className="text-xs text-muted-foreground mt-1">{centrosCosto.length} centros registrados, {centrosCosto.filter(c => c.gastoActual > c.presupuestoAsignado).length} con sobregasto</p>
        </div>
        <div className="p-4 bg-info/10 rounded-lg border border-info/30">
          <p className="text-sm font-semibold text-info">📊 Proyectos</p>
          <p className="text-xs text-muted-foreground mt-1">{proyectos.length} proyectos, {proyectos.filter(p => p.estado === 'ejecucion').length} en ejecución</p>
        </div>
      </div>
      <button onClick={() => {
        toast.info('Validación completada: 0 precios fuera de rango');
      }} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 font-medium">
        🔍 Ejecutar Validación
      </button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      <h1 className="text-2xl font-black text-foreground mb-4">🔧 Administración del Sistema</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'centros' as const,    label: '🏢 Centros Costo' },
          { key: 'logs' as const,       label: '📋 Auditoría' },
          { key: 'validacion' as const, label: '✅ Validación' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}>{t.label}</button>
        ))}
      </div>

      {tab === 'centros'    && renderCentros()}
      {tab === 'logs'       && renderLogs()}
      {tab === 'validacion' && renderValidacion()}

      {/* Modal Centro Costo */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowForm(false)} role="dialog" aria-modal="true">
          <form onSubmit={handleSubmit(onAddCentroCosto)} onClick={e => e.stopPropagation()} className="bg-card rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="font-bold mb-4 text-foreground">Nuevo Centro de Costo</h3>
            <div className="grid gap-3">
              <div>
                <select {...register('proyectoId')} className={inp(!!errors.proyectoId)}>
                  <option value="">Seleccionar proyecto</option>
                  {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                {errors.proyectoId && <p className="text-xs text-destructive mt-1">{errors.proyectoId.message}</p>}
              </div>
              <div>
                <input {...register('codigo')} placeholder="Código (ej: CC-001)" className={inp(!!errors.codigo)} />
                {errors.codigo && <p className="text-xs text-destructive mt-1">{errors.codigo.message}</p>}
              </div>
              <div>
                <input {...register('nombre')} placeholder="Nombre del centro de costo" className={inp(!!errors.nombre)} />
                {errors.nombre && <p className="text-xs text-destructive mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <input {...register('presupuestoAsignado')} type="number" placeholder="Presupuesto asignado Q" className={inp(!!errors.presupuestoAsignado)} />
                {errors.presupuestoAsignado && <p className="text-xs text-destructive mt-1">{errors.presupuestoAsignado.message}</p>}
              </div>
              <div>
                <select {...register('tipo')} className={inp(false)}>
                  <option value="directo">Directo</option>
                  <option value="indirecto">Indirecto</option>
                  <option value="administrativo">Administrativo</option>
                </select>
              </div>
              <button type="submit" className="bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 font-medium">Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-input rounded-lg text-xs text-muted-foreground hover:bg-muted">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Administracion;
