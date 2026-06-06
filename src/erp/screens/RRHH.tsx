import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErp } from '../store';
import { fmtQ, factorSalarioReal, FSR_PRESTACIONES } from '../utils';
import { CARD, CARD_TITLE, BUTTON_DARK, BUTTON_ACCENT, INPUT, ERROR_STATE } from '../ui';
import { Users, Plus, Trash2 } from 'lucide-react';
import { BarChart } from '../components/Charts';

const empleadoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  puesto: z.string().min(1, 'Puesto requerido'),
  salarioDiario: z.coerce.number().min(0, 'Salario requerido'),
  proyectoId: z.string().optional(),
  tipo: z.enum(['planilla', 'destajo']),
  diasTrabajados: z.coerce.number().min(0).max(31, 'Días inválidos'),
});

type EmpleadoFormData = z.infer<typeof empleadoSchema>;

const RRHH: React.FC = () => {
  const { empleados, addEmpleado, updateEmpleado, deleteEmpleado, proyectos } = useErp();
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const pago = (e: typeof empleados[0]) => e.salarioDiario * e.diasTrabajados;
  const pagoFSR = (e: typeof empleados[0]) => factorSalarioReal(e.salarioDiario) * e.diasTrabajados;
  const totalPlanilla = empleados.reduce((a, e) => a + pago(e), 0);
  const totalFSR = empleados.reduce((a, e) => a + pagoFSR(e), 0);

  const porProyecto = proyectos.map((p, i) => ({
    label: p.nombre.split(' ')[0],
    value: empleados.filter(e => e.proyectoId === p.id).reduce((a, e) => a + pago(e), 0),
    color: ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'][i % 5],
  })).filter(x => x.value > 0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmpleadoFormData>({
    resolver: zodResolver(empleadoSchema),
    defaultValues: {
      nombre: '',
      puesto: '',
      salarioDiario: 0,
      proyectoId: '',
      tipo: 'planilla',
      diasTrabajados: 0,
    },
  });

  const onSubmit = (data: EmpleadoFormData) => {
    if (editingId) {
      updateEmpleado(editingId, {
        nombre: data.nombre,
        puesto: data.puesto,
        salarioDiario: data.salarioDiario,
        proyectoId: data.proyectoId || null,
        diasTrabajados: data.diasTrabajados,
        tipo: data.tipo,
      });
      setEditingId(null);
    } else {
      addEmpleado({
        nombre: data.nombre,
        puesto: data.puesto,
        salarioDiario: data.salarioDiario,
        proyectoId: data.proyectoId || null,
        diasTrabajados: data.diasTrabajados,
        tipo: data.tipo,
      });
    }
    reset({
      nombre: '',
      puesto: '',
      salarioDiario: 0,
      proyectoId: '',
      tipo: 'planilla',
      diasTrabajados: 0,
    });
    setEditingId(null);
  };

  const inp = INPUT;


  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-pink-500" aria-hidden="true" /> RRHH y Planillas
        </h1>
        <button
          onClick={() => {
            setEditingId(null);
            reset({
              nombre: '',
              puesto: '',
              salarioDiario: 0,
              proyectoId: '',
              tipo: 'planilla',
              diasTrabajados: 0,
            });
          }}
          className={BUTTON_ACCENT}
        >
          <Plus className="w-4 h-4" /> Nuevo Empleado
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className={CARD}>
          <div className="text-2xl font-bold text-foreground">{empleados.length}</div>
          <div className="text-xs text-muted-foreground">Personal Activo</div>
        </div>
        <div className={CARD}>
          <div className="text-2xl font-bold text-foreground">{fmtQ(totalPlanilla)}</div>
          <div className="text-xs text-muted-foreground">Planilla Base</div>
        </div>
        <div className={CARD}>
          <div className="text-2xl font-bold text-primary">{fmtQ(totalFSR)}</div>
          <div className="text-xs text-muted-foreground">Con FSR (+{(FSR_PRESTACIONES * 100).toFixed(0)}%)</div>
        </div>
        <div className={CARD}>
          <div className="text-2xl font-bold text-foreground">
            {empleados.filter(e => e.tipo === 'destajo').length}
          </div>
          <div className="text-xs text-muted-foreground">Destajistas</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${CARD} lg:col-span-2 p-0 overflow-hidden`}>
          <div className="p-3 border-b border-border">
            <h3 className={CARD_TITLE}>Planilla Semanal</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left p-2">Empleado</th>
                  <th className="p-2">Proyecto</th>
                  <th className="p-2">Salario/día</th>
                  <th className="p-2">Días</th>
                  <th className="p-2">Pago FSR</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {empleados.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">No hay empleados registrados.</td></tr>
                ) : empleados.map(e => (
                  <tr key={e.id} className="border-t border-border/50 hover:bg-muted/40 transition-colors">
                    <td className="p-2">
                      <div className="font-semibold text-foreground">{e.nombre}</div>
                      <div className="text-muted-foreground">{e.puesto} · {e.tipo}</div>
                    </td>
                    <td className="p-2 text-center text-muted-foreground">
                      {proyectos.find(p => p.id === e.proyectoId)?.nombre.split(' ')[0] || '-'}
                    </td>
                    <td className="p-2 text-center text-foreground">{fmtQ(e.salarioDiario)}</td>
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        value={e.diasTrabajados}
                        onChange={ev => updateEmpleado(e.id, { diasTrabajados: +ev.target.value })}
                        aria-label={`Días trabajados de ${e.nombre}`}
                        className="w-14 px-1 py-0.5 rounded border border-input bg-background text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                    <td className="p-2 text-center font-bold text-primary">
                      {fmtQ(pagoFSR(e))}
                    </td>
                    <td className="p-2">
                      <button onClick={() => deleteEmpleado(e.id)}
                        aria-label={`Eliminar empleado ${e.nombre}`}
                        className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card text-card-foreground rounded-2xl p-4 shadow-sm border border-border">
            <h3 className="font-bold text-foreground text-sm mb-2">Costo MO por Proyecto</h3>
            {porProyecto.length ? (
              <BarChart height={140} data={porProyecto} />
            ) : (
              <p className="text-xs text-slate-400">Sin datos</p>
            )}
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="bg-card text-card-foreground rounded-2xl p-4 shadow-sm border border-border space-y-2">
            <h3 className="font-bold text-slate-700 text-sm">Nuevo Empleado</h3>
            <input
              {...register('nombre')}
              placeholder="Nombre"
              className={`${inp} ${errors.nombre ? ERROR_STATE : ''}`}
            />
            {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
            <input
              {...register('puesto')}
              placeholder="Puesto"
              className={`${inp} ${errors.puesto ? ERROR_STATE : ''}`}
            />
            {errors.puesto && <p className="text-xs text-red-500">{errors.puesto.message}</p>}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                {...register('salarioDiario')}
                placeholder="Salario/día"
                className={`${inp} ${errors.salarioDiario ? ERROR_STATE : ''}`}
              />
              {errors.salarioDiario && <p className="text-xs text-red-500">{errors.salarioDiario.message}</p>}
              <select
                {...register('tipo')}
                className={`${inp} ${errors.tipo ? ERROR_STATE : ''}`}
              >
                <option value="planilla">Planilla</option>
                <option value="destajo">Destajo</option>
              </select>
            </div>
            <select
              {...register('proyectoId')}
              className={`${inp} ${errors.proyectoId ? ERROR_STATE : ''}`}
            >
              <option value="">Sin proyecto</option>
              {proyectos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
            <input
              type="number"
              {...register('diasTrabajados')}
              placeholder="Días trabajados"
              className={`${inp} ${errors.diasTrabajados ? ERROR_STATE : ''}`}
            />
            {errors.diasTrabajados && <p className="text-xs text-red-500">{errors.diasTrabajados.message}</p>}
            <button type="submit" className={BUTTON_DARK}>
              <Plus className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Agregar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RRHH;