import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useErp } from '../store';
import { Tipologia } from '../types';
import { fmtQ, fmtPct, TIPOLOGIA_LABEL, todayISO } from '../utils';
import { Progress } from '../components/Charts';
import { INPUT, BUTTON_PRIMARY, MODAL_OVERLAY, MODAL_PANEL, MODAL_HEADER, MODAL_TITLE, MODAL_CLOSE, BUTTON_ICON, BUTTON_DANGER } from '../ui';
import { Plus, MapPin, Trash2, X, Building2, Pencil } from 'lucide-react';

const proyectoSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido'),
  cliente: z.string().min(1, 'Cliente requerido'),
  ubicacion: z.string().min(1, 'Ubicación requerida'),
  tipologia: z.enum(['residencial', 'comercial', 'industrial', 'civil', 'publica'] as const),
  presupuestoTotal: z.coerce.number().min(0, 'Valor requerido'),
  montoContrato: z.coerce.number().min(0, 'Valor requerido'),
});

type ProyectoFormData = z.infer<typeof proyectoSchema>;

const estadoColor = (p: { avanceFisico: number; avanceFinanciero: number; estado: string }) => {
  const dev = p.avanceFinanciero - p.avanceFisico;
  if (p.estado === 'planeacion') return '#94a3b8';
  if (dev > 8) return '#ef4444';
  if (dev > 3) return '#fbbf24';
  return '#10b981';
};

const Proyectos: React.FC = () => {
  const { proyectos, addProyecto, updateProyecto, deleteProyecto } = useErp();
  const [show, setShow] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProyectoFormData>({
    resolver: zodResolver(proyectoSchema),
    defaultValues: {
      nombre: '',
      cliente: '',
      ubicacion: '',
      tipologia: 'residencial',
      presupuestoTotal: 0,
      montoContrato: 0,
    },
  });

  const onSubmit = (data: ProyectoFormData) => {
    if (editingId) {
      updateProyecto(editingId, {
        nombre: data.nombre,
        cliente: data.cliente,
        ubicacion: data.ubicacion,
        tipologia: data.tipologia,
        presupuestoTotal: data.presupuestoTotal,
        montoContrato: data.montoContrato,
      });
    } else {
      addProyecto({
        nombre: data.nombre,
        cliente: data.cliente,
        ubicacion: data.ubicacion,
        tipologia: data.tipologia,
        estado: 'planeacion',
        presupuestoTotal: data.presupuestoTotal,
        montoContrato: data.montoContrato,
        avanceFisico: 0,
        avanceFinanciero: 0,
        lat: 14.6 + Math.random() * 0.2,
        lng: -90.55 + Math.random() * 0.2,
        fechaInicio: todayISO(),
        fechaFin: todayISO(),
      });
    }
    reset();
    setEditingId(null);
    setShow(false);
  };

  const openCreate = () => {
    setEditingId(null);
    reset({
      nombre: '',
      cliente: '',
      ubicacion: '',
      tipologia: 'residencial',
      presupuestoTotal: 0,
      montoContrato: 0,
    });
    setShow(true);
  };

  const openEdit = (p: Proyecto) => {
    setEditingId(p.id);
    reset({
      nombre: p.nombre,
      cliente: p.cliente,
      ubicacion: p.ubicacion,
      tipologia: p.tipologia,
      presupuestoTotal: p.presupuestoTotal,
      montoContrato: p.montoContrato,
    });
    setShow(true);
  };

  const Skeleton = (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border animate-pulse space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-muted" />
          <div className="space-y-2">
            <div className="h-3 w-36 bg-muted rounded" />
            <div className="h-2 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="w-4 h-4 bg-muted rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-2 w-full bg-muted rounded" />
        <div className="h-2 w-5/6 bg-muted rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-2 w-full bg-muted rounded" />
        <div className="h-2 w-4/6 bg-muted rounded" />
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Portafolio de Proyectos</h1>
          <p className="text-sm text-muted-foreground">{proyectos.length} proyectos registrados</p>
        </div>
        <button onClick={openCreate} className={BUTTON_PRIMARY}>
          <Plus className="w-4 h-4" aria-hidden="true" /> Nuevo Proyecto
        </button>
      </div>

      <div className="bg-slate-900 rounded-2xl p-4 mb-4 relative overflow-hidden" style={{ height: 220 }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200)', backgroundSize: 'cover' }} />
        <div className="relative z-10 flex items-center gap-2 text-white mb-1">
          <MapPin className="w-4 h-4 text-orange-400" /><span className="text-sm font-bold">Mapa de Calor - Geolocalización de Obras</span>
        </div>
        <div className="relative z-10 flex gap-3 text-[10px] text-slate-300 mb-2">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />En tiempo</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Riesgo</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />Desviado</span>
        </div>
        <div className="relative z-10 h-[130px]">
          {proyectos.map((p) => (
            <div key={p.id} className="absolute group" style={{ left: `${Math.round(((p.lng + 90.7) / 0.4) * 100)}%`, top: `${Math.round(((14.7 - p.lat) / 0.3) * 100)}%` }}>
              <div className="w-4 h-4 rounded-full ring-2 ring-white animate-pulse cursor-pointer" style={{ background: estadoColor(p) }} />
              <div className="hidden group-hover:block absolute left-5 -top-1 bg-white text-slate-800 text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">{p.nombre}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {proyectos.length === 0 ? Array.from({ length: 3 }).map((_, i) => <div key={i}>{Skeleton}</div>) : proyectos.map(p => (
          <div key={p.id} className="bg-card text-card-foreground rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 border border-border">
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: estadoColor(p) }} aria-hidden="true">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm truncate">{p.nombre}</h3>
                  <p className="text-[11px] text-muted-foreground truncate">{p.cliente} · {p.ubicacion}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className={BUTTON_ICON} aria-label={`Editar proyecto ${p.nombre}`}>
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button onClick={() => deleteProyecto(p.id)} className={BUTTON_DANGER} aria-label={`Eliminar proyecto ${p.nombre}`}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">{TIPOLOGIA_LABEL[p.tipologia]}</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${p.estado === 'ejecucion' ? 'bg-emerald-50 text-emerald-700' : p.estado === 'planeacion' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{p.estado}</span>
              </div>
              <div className="space-y-2.5 mb-4">
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-slate-500">Avance Físico</span>
                    <span className="font-semibold text-slate-700">{fmtPct(p.avanceFisico)}</span>
                  </div>
                  <Progress value={p.avanceFisico} color="#3b82f6" />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-slate-500">Avance Financiero</span>
                    <span className="font-semibold text-slate-700">{fmtPct(p.avanceFinanciero)}</span>
                  </div>
                  <Progress value={p.avanceFinanciero} color="#f97316" />
                </div>
              </div>
              <div className="pt-3.5 flex justify-between text-xs border-t border-border">
                <div>
                  <span className="text-muted-foreground block text-[10px] mb-0.5">Presupuesto</span>
                  <b className="text-foreground font-semibold">{fmtQ(p.presupuestoTotal)}</b>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[10px] mb-0.5">Contrato</span>
                  <b className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmtQ(p.montoContrato)}</b>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {show && (
        <div className={MODAL_OVERLAY} onClick={() => setShow(false)} role="dialog" aria-modal="true" aria-labelledby="modal-proyecto-title">
          <form onClick={e => e.stopPropagation()} onSubmit={handleSubmit(onSubmit)} className={`${MODAL_PANEL} max-w-md`}>
            <div className={MODAL_HEADER}>
              <h2 id="modal-proyecto-title" className={MODAL_TITLE}>{editingId ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
              <button type="button" onClick={() => { setShow(false); setEditingId(null); }} className={MODAL_CLOSE} aria-label="Cerrar diálogo">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <input {...register('nombre')} placeholder="Nombre del proyecto" className={INPUT} />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
              <input {...register('cliente')} placeholder="Cliente" className={INPUT} />
              {errors.cliente && <p className="text-xs text-red-500">{errors.cliente.message}</p>}
              <input {...register('ubicacion')} placeholder="Ubicación" className={INPUT} />
              {errors.ubicacion && <p className="text-xs text-red-500">{errors.ubicacion.message}</p>}
              <select {...register('tipologia')} className={INPUT}>
                {(Object.keys(TIPOLOGIA_LABEL) as Tipologia[]).map(t => <option key={t} value={t}>{TIPOLOGIA_LABEL[t]}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" {...register('presupuestoTotal')} placeholder="Presupuesto Q" className={INPUT} />
                <input type="number" {...register('montoContrato')} placeholder="Contrato Q" className={INPUT} />
              </div>
              {(errors.presupuestoTotal || errors.montoContrato) && (
                <p className="text-xs text-red-500">{errors.presupuestoTotal?.message || errors.montoContrato?.message}</p>
              )}
            </div>
            <button type="submit" className={BUTTON_PRIMARY}>{editingId ? 'Guardar Cambios' : 'Crear Proyecto'}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Proyectos;
