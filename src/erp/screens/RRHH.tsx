import { Skeleton } from '@/components/ui/skeleton';
import React, { useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useErp } from '../store';
import { fmtQ, factorSalarioReal, FSR_PRESTACIONES } from '../utils';
import { CARD, CARD_TITLE, BUTTON_DARK, BUTTON_ACCENT, INPUT, ERROR_STATE } from '../ui';
import { Users, Plus, Trash2, Edit } from 'lucide-react';
import { BarChart } from '../components/Charts';
import ChartToolbar from '../components/ChartToolbar';
import { useChartConfig } from '../hooks/useChartConfig';
import ProyectoFilter from '../components/ProyectoFilter';

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
  const { t } = useTranslation();
  const rrhhBarConfig = useChartConfig('line', 'default');
  const { empleados, addEmpleado, updateEmpleado, deleteEmpleado, proyectos } = useErp();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [filtroProyecto, setFiltroProyecto] = React.useState('');

  const empleadosFiltrados = filtroProyecto ? empleados.filter(e => e.proyectoId === filtroProyecto) : empleados;

  const pago = useCallback((e: typeof empleados[0]) => e.salarioDiario * e.diasTrabajados, []);
  const pagoFSR = (e: typeof empleados[0]) => factorSalarioReal(e.salarioDiario) * e.diasTrabajados;
  const totalPlanilla = empleadosFiltrados.reduce((a, e) => a + pago(e), 0);
  const totalFSR = empleadosFiltrados.reduce((a, e) => a + pagoFSR(e), 0);

  const porProyecto = useMemo(() => {
    const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];
    const byProyecto = new Map<string, number>();
    for (const e of empleadosFiltrados) {
      const key = e.proyectoId || '__none__';
      byProyecto.set(key, (byProyecto.get(key) || 0) + pago(e));
    }
    return proyectos
      .map((p, i) => ({
        label: p.nombre.split(' ')[0],
        value: byProyecto.get(p.id) || 0,
        color: colors[i % colors.length],
      }))
      .filter(x => x.value > 0);
  }, [empleadosFiltrados, proyectos, pago]);

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

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { setLoading(false); }, []);

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

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 max-w-[1600px] mx-auto overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('rrhh.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('rrhh.description')}</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            reset();
          }}
          className={BUTTON_ACCENT}
          aria-label={t('rrhh.addEmployee')}
        >
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          {t('rrhh.addEmployee')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 flex-shrink-0">
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{t('rrhh.totalEmployees')}</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{empleadosFiltrados.length}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">{t('rrhh.totalPayroll')}</span>
          </div>
          <div className="text-2xl font-bold text-primary">{fmtQ(totalPlanilla)}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">{t('rrhh.totalFSR')}</span>
          </div>
          <div className="text-2xl font-bold text-orange-500">{fmtQ(totalFSR)}</div>
        </div>
        <div className={CARD}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">{t('rrhh.factorReal')}</span>
          </div>
          <div className="text-2xl font-bold text-green-500">
            {totalPlanilla > 0 ? ((totalFSR / totalPlanilla - 1) * 100).toFixed(1) : '0.0'}%
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4 flex-shrink-0">
        <ProyectoFilter
          value={filtroProyecto}
          onChange={setFiltroProyecto}
          proyectos={proyectos}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 flex-shrink-0">
        <div className={CARD + " lg:col-span-2"}>
          <h3 className={CARD_TITLE}>{t('rrhh.payrollChart')}</h3>
          {porProyecto.length > 0 ? (
            <div className="h-48">
              <BarChart data={porProyecto} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('common.noData')}</p>
          )}
        </div>
      </div>

      <div className={CARD + " flex-1 overflow-hidden flex flex-col"}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t('rrhh.name')}</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t('rrhh.position')}</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">{t('rrhh.dailyWage')}</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">{t('rrhh.daysWorked')}</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">{t('rrhh.grossPay')}</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">{t('rrhh.netPayFSR')}</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground">{t('rrhh.type')}</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {empleadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-muted-foreground">
                    {t('rrhh.noEmployees')}
                  </td>
                </tr>
              ) : (
                empleadosFiltrados.map((empleado) => (
                  <tr key={empleado.id} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium text-foreground">{empleado.nombre}</td>
                    <td className="p-3 text-muted-foreground">{empleado.puesto}</td>
                    <td className="p-3 text-right font-mono">{fmtQ(empleado.salarioDiario)}</td>
                    <td className="p-3 text-right font-mono">{empleado.diasTrabajados}</td>
                    <td className="p-3 text-right font-mono">{fmtQ(pago(empleado))}</td>
                    <td className="p-3 text-right font-mono text-orange-500">{fmtQ(pagoFSR(empleado))}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        empleado.tipo === 'destajo'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {empleado.tipo}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(empleado.id);
                            reset({
                              nombre: empleado.nombre,
                              puesto: empleado.puesto,
                              salarioDiario: empleado.salarioDiario,
                              proyectoId: empleado.proyectoId || '',
                              tipo: empleado.tipo,
                              diasTrabajados: empleado.diasTrabajados,
                            });
                          }}
                          className="text-blue-500 hover:text-blue-600"
                          aria-label={t('common.edit')}
                        >
                          <Edit className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => deleteEmpleado(empleado.id)}
                          className="text-red-500 hover:text-red-600"
                          aria-label={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
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

      <div className={CARD + " mt-4"}>
        <h3 className={CARD_TITLE}>
          {editingId ? t('rrhh.editEmployee') : t('rrhh.newEmployee')}
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">{t('rrhh.name')}</label>
            <input {...register('nombre')} className={INPUT} placeholder={t('rrhh.namePlaceholder')} />
            {errors.nombre && <p className={ERROR_STATE}>{errors.nombre.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t('rrhh.position')}</label>
            <input {...register('puesto')} className={INPUT} placeholder={t('rrhh.positionPlaceholder')} />
            {errors.puesto && <p className={ERROR_STATE}>{errors.puesto.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t('rrhh.dailyWage')}</label>
            <input type="number" inputMode="decimal" step="0.01" {...register('salarioDiario')} className={INPUT} />
            {errors.salarioDiario && <p className={ERROR_STATE}>{errors.salarioDiario.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t('rrhh.daysWorked')}</label>
            <input type="number" inputMode="decimal" min={0} max={31} {...register('diasTrabajados')} className={INPUT} />
            {errors.diasTrabajados && <p className={ERROR_STATE}>{errors.diasTrabajados.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t('rrhh.type')}</label>
            <select {...register('tipo')} className={INPUT}>
              <option value="planilla">{t('rrhh.typePayroll')}</option>
              <option value="destajo">{t('rrhh.typePiecework')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t('common.project')}</label>
            <select {...register('proyectoId')} className={INPUT}>
              <option value="">{t('common.noProject')}</option>
              {proyectos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-2">
            <button type="submit" className={BUTTON_DARK}>
              {editingId ? t('common.update') : t('common.create')}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); reset(); }} className={BUTTON_ACCENT}>
                {t('common.cancel')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RRHH;
