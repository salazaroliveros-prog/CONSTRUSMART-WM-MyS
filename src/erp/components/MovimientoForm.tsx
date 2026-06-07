import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErp } from '../store';
import { Categoria } from '../types';
import { CATEGORIA_LABEL, todayISO } from '../utils';
import { Plus } from 'lucide-react';
import { INPUT, ERROR_STATE } from '../ui';

const movimientoSchema = z.object({
  tipo: z.enum(['ingreso', 'gasto']),
  proyectoId: z.string().optional(),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  cantidad: z.coerce.number().min(0, 'La cantidad debe ser positiva'),
  unidad: z.string().min(1, 'La unidad es requerida'),
  categoria: z.enum(['materiales', 'mano_obra', 'equipo', 'subcontrato', 'administracion', 'transporte', 'imprevistos', 'marketing', 'licencias', 'seguros', 'otros']),
  costoUnitario: z.coerce.number().min(0, 'El costo debe ser positivo'),
  fecha: z.string().min(1, 'La fecha es requerida'),
});

type MovimientoFormData = z.infer<typeof movimientoSchema>;

const MovimientoForm: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { proyectos, addMovimiento } = useErp();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MovimientoFormData>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: {
      tipo: 'gasto',
      proyectoId: '',
      descripcion: '',
      cantidad: 1,
      unidad: 'global',
      categoria: 'materiales',
      costoUnitario: 0,
      fecha: todayISO(),
    },
  });

  const tipo = watch('tipo');
  const cantidad = watch('cantidad', 1);
  const costoUnitario = watch('costoUnitario', 0);
  const total = (Number(cantidad) || 0) * (Number(costoUnitario) || 0);

  const onSubmit = (data: MovimientoFormData) => {
    addMovimiento({
      tipo: data.tipo,
      proyectoId: data.proyectoId || '',
      descripcion: data.descripcion,
      cantidad: data.cantidad,
      unidad: data.unidad,
      categoria: data.categoria,
      costoUnitario: data.costoUnitario,
      monto: total,
      costoTotal: total,
      fecha: data.fecha,
    });
    reset({ ...data, descripcion: '', costoUnitario: 0, cantidad: 1 });
  };

  const inp = INPUT;
  const errorClass = ERROR_STATE;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card text-card-foreground rounded-2xl p-4 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-3" role="group" aria-label="Tipo de movimiento">
        <button
          type="button"
          onClick={() => setValue('tipo', 'ingreso')}
          aria-pressed={tipo === 'ingreso'}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            tipo === 'ingreso'
              ? 'bg-emerald-500 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Ingreso
        </button>
        <button
          type="button"
          onClick={() => setValue('tipo', 'gasto')}
          aria-pressed={tipo === 'gasto'}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            tipo === 'gasto'
              ? 'bg-red-500 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Gasto
        </button>
      </div>
      <div className={`grid ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'} gap-2`}>
        <select
          {...register('proyectoId')}
          className={inp + ' col-span-2'}
        >
          <option value="">— Sin proyecto (operativo/personal) —</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <input
          {...register('descripcion')}
          placeholder="Descripción"
          className={`${inp} ${errors.descripcion ? errorClass : ''} col-span-2`}
        />
        <input
          type="number"
          {...register('cantidad')}
          placeholder="Cantidad"
          className={`${inp} ${errors.cantidad ? errorClass : ''}`}
        />
        <input
          {...register('unidad')}
          placeholder="Unidad"
          className={`${inp} ${errors.unidad ? errorClass : ''}`}
        />
        <select {...register('categoria')} className={inp}>
          {(Object.keys(CATEGORIA_LABEL) as Categoria[]).map(c => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
        </select>
        <input
          type="number"
          {...register('costoUnitario')}
          placeholder="Costo unit."
          className={`${inp} ${errors.costoUnitario ? errorClass : ''}`}
        />
        <input
          type="date"
          {...register('fecha')}
          className={inp}
        />
        <div className={`${inp} bg-muted flex items-center font-semibold text-foreground`}>Q {total.toFixed(2)}</div>
      </div>
      {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion.message}</p>}
      {errors.costoUnitario && <p className="text-xs text-red-500 mt-1">{errors.costoUnitario.message}</p>}
      <button
        type="submit"
        className="mt-3 w-full bg-foreground hover:bg-foreground/90 text-background py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Plus className="w-4 h-4" aria-hidden="true" /> Registrar {tipo}
      </button>
    </form>
  );
};

export default MovimientoForm;
